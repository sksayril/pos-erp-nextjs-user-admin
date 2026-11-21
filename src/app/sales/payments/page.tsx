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
  CheckCircle2, 
  Download,
  Receipt,
  User
} from 'lucide-react';
import { useToastStore } from '../../../lib/store';

export default function SalesPaymentsPage() {
  const { addToast } = useToastStore();
  const [payments, setPayments] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    paymentNumber: '',
    invoiceNumber: '',
    customerName: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMethod: 'Cash',
    referenceNumber: '',
    status: 'Success',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payRes, saleRes] = await Promise.all([
        fetch('/api/sales/payments'),
        fetch('/api/sales')
      ]);
      const payData = await payRes.json();
      const saleData = await saleRes.json();

      if (Array.isArray(payData)) setPayments(payData);
      if (Array.isArray(saleData)) setSales(saleData);
    } catch (err) {
      console.error('Fetch sales payments error:', err);
      addToast('error', 'Error', 'Failed to fetch customer payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    const dueSale = sales.find(s => Number(s.dueAmount) > 0) || sales[0] || {};
    setFormData({
      paymentNumber: `REC-SAL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceNumber: dueSale.invoiceNumber || '',
      customerName: dueSale.customerName || 'Rahul Sharma',
      date: new Date().toISOString().split('T')[0],
      amount: Number(dueSale.dueAmount) || 10000,
      paymentMethod: 'UPI',
      referenceNumber: `UPI-TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'Success',
      notes: 'Customer invoice receipt'
    });
    setModalOpen(true);
  };

  const handleInvoiceSelect = (invNo: string) => {
    const s = sales.find(x => x.invoiceNumber === invNo);
    if (s) {
      setFormData(prev => ({
        ...prev,
        invoiceNumber: s.invoiceNumber,
        customerName: s.customerName,
        amount: Number(s.dueAmount) > 0 ? Number(s.dueAmount) : Number(s.grandTotal)
      }));
    }
  };

  const handleDelete = async (id: string, payNum: string) => {
    try {
      const res = await fetch(`/api/sales/payments?id=${id}`, { method: 'DELETE' });
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
    if (!formData.paymentNumber || !formData.customerName || !formData.amount) {
      addToast('warning', 'Validation', 'Receipt Ref, Customer, and Amount are required');
      return;
    }

    try {
      const res = await fetch('/api/sales/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save payment');

      addToast('success', 'Receipt Recorded', `Payment ${formData.paymentNumber} processed and customer balance updated!`);
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
    const headers = ['Receipt #', 'Invoice Ref', 'Customer', 'Date', 'Amount', 'Method', 'Reference #', 'Status'];
    const rows = payments.map(p => [
      `"${p.paymentNumber}"`,
      `"${p.invoiceNumber}"`,
      `"${p.customerName}"`,
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
    link.setAttribute('download', `Sales_Receipts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Exported', 'Payments ledger exported.');
  };

  const columns = [
    { 
      header: 'Receipt Voucher', 
      accessor: 'paymentNumber', 
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
            <Receipt className="h-4 w-4" />
          </div>
          <div>
            <p className="font-mono font-bold text-xs text-foreground">{row.paymentNumber}</p>
            <p className="text-[11px] text-muted-foreground font-mono">{row.date}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'Customer', 
      accessor: 'customerName', 
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-foreground">{row.customerName}</span>
          <span className="text-[11px] text-muted-foreground font-mono">Invoice: {row.invoiceNumber}</span>
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
      header: 'Received Amount', 
      accessor: 'amount', 
      sortable: true,
      render: (row: any) => (
        <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
          Rs. {(Number(row.amount) || 0).toLocaleString()}
        </span>
      )
    },
    { 
      header: 'Receipt Status', 
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

  const totalReceived = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const upiCollections = payments.filter(p => p.paymentMethod === 'UPI').reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const cashCollections = payments.filter(p => p.paymentMethod === 'Cash').reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Receipt className="h-6 w-6 text-primary" /> Sales Payments & Customer Receipts
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track customer receivables collections, POS register cash, and bank settlements.
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
                <Plus className="h-4 w-4" /> Record Receipt
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
                <p className="text-xs font-medium text-muted-foreground">Total Customer Inflow</p>
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Rs. {totalReceived.toLocaleString()}
                </h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">UPI / Digital Payments</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">
                  Rs. {upiCollections.toLocaleString()}
                </h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Cash / Direct POS Receipts</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">
                  Rs. {cashCollections.toLocaleString()}
                </h3>
              </div>
            </div>
          </div>

          {/* Table */}
          <DataTable
            title="Customer Payment Vouchers"
            data={payments}
            columns={columns}
            searchKey="paymentNumber"
            searchPlaceholder="Search voucher ref, customer, or invoice..."
          />

        </div>

        {/* Record Receipt Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" /> Record Customer Payment
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Receipt Voucher Ref *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.paymentNumber}
                    onChange={(e) => setFormData({ ...formData, paymentNumber: e.target.value.toUpperCase() })}
                    className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Link to Sale Invoice (Optional)</label>
                  <select 
                    value={formData.invoiceNumber}
                    onChange={(e) => handleInvoiceSelect(e.target.value)}
                    className="h-9 w-full rounded-lg border border-border px-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Direct Advance / Unlinked Receipt</option>
                    {sales.map((s, i) => (
                      <option key={i} value={s.invoiceNumber}>
                        {s.invoiceNumber} - {s.customerName} (Due: Rs. {Number(s.dueAmount || 0).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Customer Name *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border px-3 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Date Received</label>
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
                    <label className="font-semibold text-foreground">Payment Mode</label>
                    <select 
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI / QR</option>
                      <option value="Credit Card">Credit / Debit Card</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                      <option value="Cheque">Bank Cheque</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Txn Ref #</label>
                    <input 
                      type="text" 
                      placeholder="e.g. UPI-TXN-8812"
                      value={formData.referenceNumber}
                      onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Remarks</label>
                  <textarea 
                    rows={2}
                    placeholder="Cashier remarks, receipt reference notes..."
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
                    <Save className="h-4 w-4" /> Save Receipt
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