'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { 
  RotateCw, Plus, RefreshCw, Eye, Trash2, 
  DollarSign, CheckCircle2, Calendar, FileText, Truck, Building2
} from 'lucide-react';
import { useToastStore } from '../../../lib/store';

export default function PurchaseReturnsPage() {
  const { addToast } = useToastStore();

  const [returns, setReturns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewReturn, setPreviewReturn] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    purchaseNumber: '',
    supplierName: '',
    supplierPhone: '',
    warehouseName: 'Central Godown (HQ)',
    productId: '',
    quantity: 1,
    unitCost: 0,
    claimStatus: 'Debit Issued',
    status: 'Dispatched',
    reason: '',
    notes: ''
  });

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const [resRet, resProd, resSup] = await Promise.all([
        fetch('/api/returns/purchases'),
        fetch('/api/products'),
        fetch('/api/people/suppliers')
      ]);

      if (resRet.ok) {
        const data = await resRet.json();
        setReturns(Array.isArray(data) ? data : []);
      }
      if (resProd.ok) {
        const prods = await resProd.json();
        setProducts(Array.isArray(prods) ? prods : []);
      }
      if (resSup.ok) {
        const sups = await resSup.json();
        setSuppliers(Array.isArray(sups) ? sups : []);
      }
    } catch (error) {
      console.error('Fetch purchase returns error:', error);
      addToast('error', 'Fetch Error', 'Failed to retrieve purchase returns.');
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
      unitCost: Number(prod.cost || prod.costPrice || prod.price || 0)
    }));
  };

  const handleSupplierSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    const sup = suppliers.find(s => s.name === name);
    setForm(f => ({
      ...f,
      supplierName: name,
      supplierPhone: sup ? sup.phone : ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.purchaseNumber || !form.supplierName || !form.productId) {
      addToast('error', 'Validation Error', 'Purchase reference, supplier, and product are required.');
      return;
    }

    const prod = products.find(p => p._id === form.productId || p.id === form.productId);
    const prodName = prod ? prod.name : 'Returned Product';
    const sku = prod ? prod.sku : '';
    const qty = Number(form.quantity) || 1;
    const cost = Number(form.unitCost) || 0;
    const total = qty * cost;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/returns/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseNumber: form.purchaseNumber,
          supplierName: form.supplierName,
          supplierPhone: form.supplierPhone,
          warehouseName: form.warehouseName,
          claimStatus: form.claimStatus,
          status: form.status,
          reason: form.reason,
          notes: form.notes,
          items: [
            {
              productId: form.productId,
              productName: prodName,
              sku,
              quantity: qty,
              unitCost: cost,
              subtotal: total
            }
          ],
          totalAmount: total,
          debitAmount: total
        })
      });

      if (res.ok) {
        const created = await res.json();
        addToast('success', 'Purchase Return Created', `Return ${created.returnNumber} recorded and Debit Note linked.`);
        setReturns(prev => [created, ...prev]);
        setIsModalOpen(false);
        setForm({
          purchaseNumber: '',
          supplierName: '',
          supplierPhone: '',
          warehouseName: 'Central Godown (HQ)',
          productId: '',
          quantity: 1,
          unitCost: 0,
          claimStatus: 'Debit Issued',
          status: 'Dispatched',
          reason: '',
          notes: ''
        });
      } else {
        const err = await res.json();
        addToast('error', 'Creation Failed', err.error || 'Could not record purchase return.');
      }
    } catch (err) {
      addToast('error', 'Error', 'Failed to communicate with database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, returnNum: string) => {
    if (!confirm(`Are you sure you want to delete purchase return ${returnNum}?`)) return;

    try {
      const res = await fetch(`/api/returns/purchases?id=${id}`, { method: 'DELETE' });
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
  const settledCount = returns.filter(r => r.status === 'Settled').length;
  const debitIssuedCount = returns.filter(r => r.claimStatus === 'Debit Issued').length;

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
      header: 'Purchase Reference',
      accessor: 'purchaseNumber',
      sortable: true,
      render: (row: any) => (
        <span className="font-mono font-semibold text-xs text-foreground bg-muted/40 px-2 py-0.5 rounded border border-border">
          {row.purchaseNumber}
        </span>
      )
    },
    {
      header: 'Supplier / Vendor',
      accessor: 'supplierName',
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col text-xs">
          <span className="font-semibold text-foreground">{row.supplierName}</span>
          <span className="text-[11px] text-muted-foreground">{row.supplierPhone || '—'}</span>
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
      header: 'Debit Amount',
      accessor: 'debitAmount',
      sortable: true,
      render: (row: any) => (
        <span className="font-mono font-bold text-xs text-emerald-600">
          ₹{Number(row.debitAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row: any) => (
        <Badge variant={row.status === 'Settled' ? 'success' : row.status === 'Supplier Acknowledged' ? 'info' : 'warning'} className="text-[11px]">
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
            title="View Return Details"
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
                <RotateCw className="h-6 w-6 text-primary" /> Purchase Returns (Supplier Claims)
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage damaged incoming supplier shipments, dead-on-arrival warranty replacements, and debit note deductions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchReturns} disabled={loading} className="cursor-pointer">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)} className="cursor-pointer">
                <Plus className="h-4 w-4" /> Record Purchase Return
              </Button>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Total Supplier Claims</span>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-foreground mt-2">
                ₹{totalReturnValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">Across {returns.length} supplier return claims</span>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Settled Replacements</span>
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-blue-600 mt-2">
                {settledCount} Settled
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">Adjusted in supplier bills</span>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Debit Notes Linked</span>
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-indigo-600 mt-2">
                {debitIssuedCount} Notes
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">Accounts payable deduction</span>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Vendor Quality Score</span>
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Building2 className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-emerald-600 mt-2">
                98.6%
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">Accepted inbound shipments</span>
            </div>
          </div>

          {/* DataTable */}
          <DataTable
            data={returns}
            columns={columns}
            searchKey="supplierName"
            searchPlaceholder="Search supplier, return #, purchase #..."
            filters={[
              { name: 'Status', key: 'status', options: ['Dispatched', 'Supplier Acknowledged', 'Settled'] },
              { name: 'Claim Status', key: 'claimStatus', options: ['Debit Issued', 'Adjusted in Next Bill', 'Pending'] }
            ]}
          />

          {/* Create Purchase Return Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Record Purchase Return to Supplier"
            size="md"
          >
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Purchase Bill Reference *</label>
                  <input
                    type="text"
                    required
                    value={form.purchaseNumber}
                    onChange={(e) => setForm({ ...form, purchaseNumber: e.target.value })}
                    placeholder="e.g. PUR-2026-0001"
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Supplier / Distributor *</label>
                  <select
                    required
                    value={form.supplierName}
                    onChange={handleSupplierSelect}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s._id || s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
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
                  <option value="">-- Choose Defective Product Item --</option>
                  {products.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.name} {p.sku ? `(${p.sku})` : ''} — Unit Cost: ₹{Number(p.cost || p.costPrice || 0).toLocaleString()}
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
                  <label className="text-xs font-bold text-foreground block mb-1.5">Unit Purchase Cost (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.unitCost}
                    onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Return Cargo Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Dispatched">Dispatched to Supplier</option>
                    <option value="Supplier Acknowledged">Supplier Acknowledged Receipt</option>
                    <option value="Settled">Settled / Closed</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Claim Resolution Mode</label>
                  <select
                    value={form.claimStatus}
                    onChange={(e) => setForm({ ...form, claimStatus: e.target.value })}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Debit Issued">Issue Debit Note</option>
                    <option value="Adjusted in Next Bill">Adjust in Next Monthly Invoice</option>
                    <option value="Pending">Pending Vendor Response</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Reason for Return / Defect Description *</label>
                <textarea
                  rows={2}
                  required
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Explain why goods are being returned to supplier..."
                  className="w-full rounded-xl border border-border bg-card p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting} className="cursor-pointer">
                  <CheckCircle2 className="h-4 w-4" /> Save Return & Issue Debit Note
                </Button>
              </div>
            </form>
          </Modal>

          {/* Preview Modal */}
          {previewReturn && (
            <Modal
              isOpen={Boolean(previewReturn)}
              onClose={() => setPreviewReturn(null)}
              title={`Purchase Return Details — ${previewReturn.returnNumber}`}
              size="md"
            >
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-card border border-border/70 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-primary font-mono">{previewReturn.returnNumber}</span>
                      <h3 className="text-sm font-bold text-foreground mt-0.5">{previewReturn.supplierName}</h3>
                      <p className="text-[11px] text-muted-foreground font-mono">Bill Ref: {previewReturn.purchaseNumber}</p>
                    </div>
                    <Badge variant={previewReturn.status === 'Settled' ? 'success' : 'info'}>
                      {previewReturn.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                    <div>
                      <span className="text-muted-foreground block">Return Date</span>
                      <span className="font-semibold text-foreground">{previewReturn.date}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Total Claim Amount</span>
                      <span className="font-mono font-bold text-emerald-600 text-sm">
                        ₹{Number(previewReturn.debitAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Debit Note Linked</span>
                      <span className="font-mono font-semibold text-primary">{previewReturn.debitNoteNo || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Claim Status</span>
                      <span className="font-semibold text-foreground">{previewReturn.claimStatus}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/50">
                    <span className="text-muted-foreground block mb-1">Reason for Claim</span>
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