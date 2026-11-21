'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  RefreshCw, 
  X, 
  Save, 
  DollarSign, 
  Building2, 
  CheckCircle2, 
  Download,
  Receipt
} from 'lucide-react';
import { useToastStore } from '../../../lib/store';

export default function PurchasePaymentsPage() {
  const { addToast } = useToastStore();
  const [payments, setPayments] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    paymentNumber: '',
    purchaseNumber: '',
    supplierName: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMethod: 'Bank Transfer',
    referenceNumber: '',
    status: 'Success',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payRes, purRes] = await Promise.all([
        fetch('/api/purchases/payments'),
        fetch('/api/purchases')
      ]);
      const payData = await payRes.json();
      const purData = await purRes.json();

      if (Array.isArray(payData)) setPayments(payData);
      if (Array.isArray(purData)) setPurchases(purData);
    } catch (err) {
      console.error('Fetch payments error:', err);
      addToast('error', 'Error', 'Failed to fetch vendor payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    const duePurchase = purchases.find(p => Number(p.dueAmount) > 0) || purchases[0] || {};
    setFormData({
      paymentNumber: `PAY-PUR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      purchaseNumber: duePurchase.purchaseNumber || '',
      supplierName: duePurchase.supplierName || 'Apple Authorized Distributor',
      date: new Date().toISOString().split('T')[0],
      amount: Number(duePurchase.dueAmount) || 50000,
      paymentMethod: 'Bank Transfer',
      referenceNumber: `NEFT-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'Success',
      notes: 'Vendor invoice settlement'
    });
    setModalOpen(true);
  };

  const handlePurchaseSelect = (purNo: string) => {
    const pur = purchases.find(p => p.purchaseNumber === purNo);
    if (pur) {
      setFormData(prev => ({
        ...prev,
        purchaseNumber: pur.purchaseNumber,
        supplierName: pur.supplierName,
        amount: Number(pur.dueAmount) > 0 ? Number(pur.dueAmount) : Number(pur.grandTotal)
      }));
    }
  };

  const handleDelete = async (id: string, payNum: string) => {
    try {
      const res = await fetch(`/api/purchases/payments?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Deleted', `Payment record "${payNum}" removed.`);
        fetchData();
      } else {
        throw new Error('Failed to delete payment');
      }
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'Could not delete payment');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.paymentNumber || !formData.supplierName || !formData.amount) {
      addToast('warning', 'Validation', 'Payment Ref, Supplier, and Amount are required');
      return;
    }

    try {
      const res = await fetch('/api/purchases/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save payment');

      addToast('success', 'Payment Recorded', `Payment ${formData.paymentNumber} processed and supplier ledger updated!`);
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'Could not record payment');
    }
  };

  const exportCSV = () => {
    if (payments.length === 0) {
      addToast('warning', 'Export', 'No payment data to export');
      return;
    }
    const headers = ['Payment #', 'Purchase Ref', 'Supplier', 'Date', 'Amount', 'Method', 'Reference #', 'Status'];
    const rows = payments.map(p => [
      `"${p.paymentNumber}"`,
      `"${p.purchaseNumber}"`,
      `"${p.supplierName}"`,
      `"${p.date}"`,
      p.amount,
      `"${p.paymentMethod}"`,
      `"${p.referenceNumber || ''}"`,
      `"${p.status}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vendor_Payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Exported', 'Payments ledger exported.');
  };

  const columns = [
    { 
      header: 'Payment Reference', 
      accessor: 'paymentNumber', 
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
            <CreditCard className="h-4 w-4" />
          </div>
          <div>
            <p className="font-mono font-bold text-xs text-foreground">{row.paymentNumber}</p>
            <p className="text-[11px] text-muted-foreground font-mono">{row.date}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'Supplier / Payee', 
      accessor: 'supplierName', 
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-foreground">{row.supplierName}</span>
          <span className="text-[11px] text-muted-foreground font-mono">Bill: {row.purchaseNumber}</span>
        </div>
      )
    },
    { 
      header: 'Payment Method', 
      accessor: 'paymentMethod', 
      render: (row: any) => (
        <div className="flex flex-col">
          <Badge variant="outline" className="w-fit text-[11px] font-medium">{row.paymentMethod}</Badge>
          {row.referenceNumber && <span className="text-[10px] text-muted-foreground font-mono mt-0.5">Ref: {row.referenceNumber}</span>}
        </div>
      )
    },
    { 
      header: 'Disbursed Amount', 
      accessor: 'amount', 
      sortable: true,
      render: (row: any) => (
        <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
          Rs. {(Number(row.amount) || 0).toLocaleString()}
        </span>
      )
    },
    { 
      header: 'Settlement Status', 
      accessor: 'status', 
      render: (row: any) => (
        <Badge variant={row.status === 'Success' ? 'success' : 'destructive'} className="text-[11px]">
          {row.status || 'Success'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => handleDelete(row._id, row.paymentNumber)} 
            className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Delete Payment"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </div>
      )
    }
  ];

  const totalDisbursed = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const bankPayments = payments.filter(p => p.paymentMethod === 'Bank Transfer').reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const upiPayments = payments.filter(p => p.paymentMethod === 'UPI').reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Receipt className="h-6 w-6 text-primary" /> Purchase Payments & Disbursals
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Maintain bank remittance logs, supplier bill settlements, and corporate treasury transactions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV} className="h-9 gap-1.5">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={fetchData} className="h-9 gap-1.5">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="primary" size="sm" onClick={openAddModal} className="h-9 gap-1.5 font-semibold">
                <Plus className="h-4 w-4" /> Record Payment
              </Button>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Disbursed to Vendors</p>
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Rs. {totalDisbursed.toLocaleString()}
                </h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Bank Transfers / RTGS</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">
                  Rs. {bankPayments.toLocaleString()}
                </h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">UPI / Digital Settlements</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">
                  Rs. {upiPayments.toLocaleString()}
                </h3>
              </div>
            </div>
          </div>

          {/* Table */}
          <DataTable
            title="Vendor Payment Receipts"
            data={payments}
            columns={columns}
            searchKey="paymentNumber"
            searchPlaceholder="Search payment ref, supplier, or reference #..."
          />

        </div>

        {/* Record Payment Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" /> Record Vendor Payment
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Payment Voucher Ref *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.paymentNumber}
                    onChange={(e) => setFormData({ ...formData, paymentNumber: e.target.value.toUpperCase() })}
                    className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Link to Purchase Invoice (Optional)</label>
                  <select 
                    value={formData.purchaseNumber}
                    onChange={(e) => handlePurchaseSelect(e.target.value)}
                    className="h-9 w-full rounded-lg border border-border px-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Direct Advance Payment / No Bill Link</option>
                    {purchases.map((p, i) => (
                      <option key={i} value={p.purchaseNumber}>
                        {p.purchaseNumber} - {p.supplierName} (Due: Rs. {Number(p.dueAmount || 0).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Supplier / Vendor Name *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border px-3 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Payment Date</label>
                    <input 
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Amount (Rs.) *</label>
                    <input 
                      type="number" 
                      step="any"
                      min={1}
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      className="h-9 w-full rounded-lg border border-emerald-500/60 px-3 bg-background font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Payment Method</label>
                    <select 
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                      <option value="UPI">Corporate UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Bank Cheque</option>
                      <option value="Credit Card">Corporate Card</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Txn / Cheque #</label>
                    <input 
                      type="text" 
                      placeholder="e.g. UTR-991204"
                      value={formData.referenceNumber}
                      onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Notes / Comments</label>
                  <textarea 
                    rows={2}
                    placeholder="Remarks, bank approval, or payment authorization notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full rounded-lg border border-border p-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="font-semibold gap-1.5">
                    <Save className="h-4 w-4" /> Disburse Payment
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </PageContainer>
    </AppShell>
  );
}