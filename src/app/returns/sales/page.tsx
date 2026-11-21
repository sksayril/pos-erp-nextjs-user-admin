'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { 
  RotateCcw, Plus, RefreshCw, Eye, Trash2, 
  DollarSign, CheckCircle2, Calendar, FileText, PackageX, User
} from 'lucide-react';
import { useToastStore } from '../../../lib/store';

export default function SalesReturnsPage() {
  const { addToast } = useToastStore();

  const [returns, setReturns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewReturn, setPreviewReturn] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    invoiceNumber: '',
    customerName: '',
    customerPhone: '',
    warehouseName: 'Central Godown (HQ)',
    productId: '',
    quantity: 1,
    unitPrice: 0,
    refundStatus: 'Credit Issued',
    status: 'Received',
    reason: '',
    notes: ''
  });

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const [resRet, resProd] = await Promise.all([
        fetch('/api/returns/sales'),
        fetch('/api/products')
      ]);

      if (resRet.ok) {
        const data = await resRet.json();
        setReturns(Array.isArray(data) ? data : []);
      }
      if (resProd.ok) {
        const prods = await resProd.json();
        setProducts(Array.isArray(prods) ? prods : []);
      }
    } catch (error) {
      console.error('Fetch sales returns error:', error);
      addToast('error', 'Fetch Error', 'Failed to retrieve sales returns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleProductSelect = (productId: string) => {
    const prod = products.find(p => p._id === productId || p.id === productId);
    if (!prod) return;
    setForm(f => ({
      ...f,
      productId,
      unitPrice: Number(prod.price || prod.sellingPrice || 0)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.invoiceNumber || !form.customerName || !form.productId) {
      addToast('error', 'Validation Error', 'Invoice number, customer, and product are required.');
      return;
    }

    const prod = products.find(p => p._id === form.productId || p.id === form.productId);
    const prodName = prod ? prod.name : 'Returned Product';
    const sku = prod ? prod.sku : '';
    const qty = Number(form.quantity) || 1;
    const price = Number(form.unitPrice) || 0;
    const tax = qty * price * 0.18;
    const total = (qty * price) + tax;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/returns/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: form.invoiceNumber,
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          warehouseName: form.warehouseName,
          refundStatus: form.refundStatus,
          status: form.status,
          reason: form.reason,
          notes: form.notes,
          items: [
            {
              productId: form.productId,
              productName: prodName,
              sku,
              quantity: qty,
              unitPrice: price,
              tax,
              total
            }
          ],
          totalAmount: total,
          refundAmount: total
        })
      });

      if (res.ok) {
        const created = await res.json();
        addToast('success', 'Sales Return Recorded', `RMA ${created.returnNumber} created and Credit Note linked.`);
        setReturns(prev => [created, ...prev]);
        setIsModalOpen(false);
        setForm({
          invoiceNumber: '',
          customerName: '',
          customerPhone: '',
          warehouseName: 'Central Godown (HQ)',
          productId: '',
          quantity: 1,
          unitPrice: 0,
          refundStatus: 'Credit Issued',
          status: 'Received',
          reason: '',
          notes: ''
        });
      } else {
        const err = await res.json();
        addToast('error', 'Creation Failed', err.error || 'Could not record sales return.');
      }
    } catch (err) {
      addToast('error', 'Error', 'Failed to communicate with database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, returnNum: string) => {
    try {
      const res = await fetch(`/api/returns/sales?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Return Deleted', `${returnNum} removed.`);
        setReturns(prev => prev.filter(r => r._id !== id));
      } else {
        const err = await res.json();
        addToast('error', 'Delete Failed', err.error || 'Failed to delete record.');
      }
    } catch (err) {
      addToast('error', 'Error', 'Failed to communicate with database.');
    }
  };

  const totalReturnValue = returns.reduce((acc, r) => acc + (Number(r.totalAmount) || 0), 0);
  const restockedCount = returns.filter(r => r.status === 'Restocked').length;
  const creditIssuedCount = returns.filter(r => r.refundStatus === 'Credit Issued').length;

  const columns = [
    {
      header: 'Return # / Date',
      accessor: 'returnNumber',
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-xs text-primary">{row.returnNumber}</span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Calendar className="h-3 w-3" /> {row.date}
          </span>
        </div>
      )
    },
    {
      header: 'Invoice Reference',
      accessor: 'invoiceNumber',
      sortable: true,
      render: (row: any) => (
        <span className="font-mono font-semibold text-xs text-foreground bg-muted/40 px-2 py-0.5 rounded border border-border">
          {row.invoiceNumber}
        </span>
      )
    },
    {
      header: 'Customer',
      accessor: 'customerName',
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col text-xs">
          <span className="font-semibold text-foreground">{row.customerName}</span>
          <span className="text-[11px] text-muted-foreground">{row.customerPhone || '—'}</span>
        </div>
      )
    },
    {
      header: 'Returned Items',
      accessor: 'items',
      render: (row: any) => (
        <div className="flex flex-col text-xs max-w-xs truncate">
          <span className="font-medium text-foreground truncate">
            {(row.items || []).map((i: any) => `${i.productName} (x${i.quantity})`).join(', ')}
          </span>
          <span className="text-[11px] text-rose-600 truncate">{row.reason}</span>
        </div>
      )
    },
    {
      header: 'Refund Amount',
      accessor: 'refundAmount',
      sortable: true,
      render: (row: any) => (
        <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
          ₹{Number(row.refundAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'RMA Status',
      accessor: 'status',
      render: (row: any) => (
        <Badge variant={row.status === 'Restocked' ? 'success' : row.status === 'Inspected' ? 'info' : 'warning'} className="text-[11px]">
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPreviewReturn(row)}
            className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="View RMA Details"
          >
            <Eye className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => handleDelete(row._id, row.returnNumber)}
            className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Delete Record"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <RotateCcw className="h-6 w-6 text-primary" /> Sales Returns (Customer RMA)
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Process customer returns, inspect returned merchandise, restock warehouse inventory, and issue credit notes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchReturns} disabled={loading} className="cursor-pointer">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)} className="cursor-pointer">
                <Plus className="h-4 w-4" /> Record Sales Return
              </Button>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Total Returns Value</span>
                <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-foreground mt-2">
                ₹{totalReturnValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">Across {returns.length} customer RMAs</span>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Restocked & Verified</span>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-emerald-600 mt-2">
                {restockedCount} Restocked
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Returned to live stock</span>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Credit Notes Issued</span>
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-blue-600 mt-2">
                {creditIssuedCount} Notes
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">Store credit adjusted</span>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">RMA Return Rate</span>
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <PackageX className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-amber-600 mt-2">
                1.4% Overall
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">Well within industry benchmark</span>
            </div>
          </div>

          {/* DataTable */}
          <DataTable
            data={returns}
            columns={columns}
            searchKey="customerName"
            searchPlaceholder="Search customer, return #, invoice #..."
            filters={[
              { name: 'Status', key: 'status', options: ['Received', 'Inspected', 'Restocked', 'Scrapped'] },
              { name: 'Refund Status', key: 'refundStatus', options: ['Credit Issued', 'Refunded', 'Pending'] }
            ]}
          />

          {/* Create Sales Return Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Record Customer Sales Return (RMA)"
            size="md"
          >
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Original Invoice Number *</label>
                  <input
                    type="text"
                    required
                    value={form.invoiceNumber}
                    onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                    placeholder="e.g. INV-2026-0001"
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="Client name..."
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Returned Product *</label>
                <select
                  required
                  value={form.productId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">-- Choose Returned Product Item --</option>
                  {products.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.name} {p.sku ? `(${p.sku})` : ''} — Unit Price: ₹{Number(p.price || p.sellingPrice || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Return Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Item Unit Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.unitPrice}
                    onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">RMA Inspection Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Received">Received</option>
                    <option value="Inspected">Inspected</option>
                    <option value="Restocked">Restocked into Inventory</option>
                    <option value="Scrapped">Scrapped / Damaged</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Refund Resolution</label>
                  <select
                    value={form.refundStatus}
                    onChange={(e) => setForm({ ...form, refundStatus: e.target.value })}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Credit Issued">Issue Credit Note</option>
                    <option value="Refunded">Direct Cash / Bank Refund</option>
                    <option value="Pending">Pending Inspection</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Return Reason & Defect Report *</label>
                <textarea
                  rows={2}
                  required
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Explain why the customer returned the product..."
                  className="w-full rounded-xl border border-border bg-card p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting} className="cursor-pointer">
                  <CheckCircle2 className="h-4 w-4" /> Save Return & Issue Note
                </Button>
              </div>
            </form>
          </Modal>

          {/* Preview Modal */}
          {previewReturn && (
            <Modal
              isOpen={Boolean(previewReturn)}
              onClose={() => setPreviewReturn(null)}
              title={`Sales Return Details — ${previewReturn.returnNumber}`}
              size="md"
            >
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-card border border-border/70 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-primary font-mono">{previewReturn.returnNumber}</span>
                      <h3 className="text-sm font-bold text-foreground mt-0.5">{previewReturn.customerName}</h3>
                      <p className="text-[11px] text-muted-foreground font-mono">Invoice: {previewReturn.invoiceNumber}</p>
                    </div>
                    <Badge variant={previewReturn.status === 'Restocked' ? 'success' : 'info'}>
                      {previewReturn.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                    <div>
                      <span className="text-muted-foreground block">Return Date</span>
                      <span className="font-semibold text-foreground">{previewReturn.date}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Total Refund Value</span>
                      <span className="font-mono font-bold text-rose-600 text-sm">
                        ₹{Number(previewReturn.refundAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Credit Note Linked</span>
                      <span className="font-mono font-semibold text-primary">{previewReturn.creditNoteNo || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Refund Status</span>
                      <span className="font-semibold text-emerald-600">{previewReturn.refundStatus}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/50">
                    <span className="text-muted-foreground block mb-1">Reason for Return</span>
                    <p className="p-2 rounded-lg bg-muted/20 border border-border text-foreground">
                      {previewReturn.reason}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="outline" size="sm" onClick={() => setPreviewReturn(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </Modal>
          )}

        </div>
      </PageContainer>
    </AppShell>
  );
}