'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { PageContainer } from '../../components/layout/PageContainer';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { 
  Receipt, Plus, RefreshCw, Eye, Edit3, Trash2, 
  DollarSign, TrendingUp, Tag, ShieldCheck, FileText, Calendar, Building2, CreditCard
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToastStore } from '../../lib/store';

export default function ExpensesListPage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewExpense, setViewExpense] = useState<any | null>(null);
  const [editExpense, setEditExpense] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resExp, resCat] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/expenses/categories')
      ]);

      if (resExp.ok) {
        const data = await resExp.json();
        setExpenses(Array.isArray(data) ? data : []);
      }
      if (resCat.ok) {
        const cats = await resCat.json();
        setCategories(Array.isArray(cats) ? cats : []);
      }
    } catch (error) {
      console.error('Fetch Expenses Error:', error);
      addToast('error', 'Fetch Failed', 'Unable to retrieve expenses from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete expense "${title}"?`)) return;

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Expense Deleted', `"${title}" has been removed.`);
        setExpenses(prev => prev.filter(e => e._id !== id));
      } else {
        const err = await res.json();
        addToast('error', 'Delete Failed', err.error || 'Could not delete expense.');
      }
    } catch (error) {
      addToast('error', 'Error', 'Failed to communicate with database.');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editExpense) return;

    try {
      setIsSaving(true);
      const res = await fetch(`/api/expenses/${editExpense._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editExpense)
      });

      if (res.ok) {
        const updated = await res.json();
        addToast('success', 'Expense Updated', 'Changes saved successfully.');
        setExpenses(prev => prev.map(item => item._id === updated._id ? updated : item));
        setEditExpense(null);
      } else {
        const err = await res.json();
        addToast('error', 'Update Failed', err.error || 'Could not update record.');
      }
    } catch (error) {
      addToast('error', 'Error', 'Failed to save expense updates.');
    } finally {
      setIsSaving(false);
    }
  };

  const totalExpense = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const totalTax = expenses.reduce((acc, e) => acc + (Number(e.taxAmount) || 0), 0);
  const paidCount = expenses.filter(e => e.paymentStatus === 'Paid').length;
  const uniqueCategoryCount = new Set(expenses.map(e => e.category)).size;

  const columns = [
    {
      header: 'Expense ID / Title',
      accessor: 'expenseNumber',
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-xs text-primary">{row.expenseNumber || 'EXP-000'}</span>
          <span className="font-semibold text-xs text-foreground mt-0.5 line-clamp-1">{row.title}</span>
          {row.vendor && <span className="text-[11px] text-muted-foreground">Payee: {row.vendor}</span>}
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'category',
      sortable: true,
      render: (row: any) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          <Tag className="h-3 w-3" />
          {row.category}
        </span>
      )
    },
    {
      header: 'Amount',
      accessor: 'amount',
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
            ₹{Number(row.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          {row.taxAmount > 0 && (
            <span className="text-[10px] text-muted-foreground">
              Tax: ₹{Number(row.taxAmount).toLocaleString('en-IN')}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Date & Branch',
      accessor: 'date',
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col text-xs">
          <span className="font-medium text-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3 text-muted-foreground" /> {row.date || '—'}
          </span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Building2 className="h-3 w-3 text-muted-foreground" /> {row.warehouseName || 'Main Hub'}
          </span>
        </div>
      )
    },
    {
      header: 'Payment Mode',
      accessor: 'paymentMethod',
      render: (row: any) => (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground bg-muted/50 px-2 py-1 rounded-md border border-border">
          <CreditCard className="h-3 w-3 text-muted-foreground" />
          {row.paymentMethod || 'Cash'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'paymentStatus',
      render: (row: any) => (
        <Badge variant={row.paymentStatus === 'Paid' ? 'success' : row.paymentStatus === 'Approved' ? 'info' : 'warning'} className="text-[11px]">
          {row.paymentStatus || 'Paid'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewExpense(row)}
            className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="View Receipt"
          >
            <Eye className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => setEditExpense({ ...row })}
            className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white border border-amber-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Edit Expense"
          >
            <Edit3 className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => handleDelete(row._id, row.title)}
            className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Delete Record"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </div>
      )
    }
  ];

  const filterOptions = categories.map(c => c.name);

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Receipt className="h-6 w-6 text-primary" /> Operating Expenses Ledger
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Monitor and record company operational overheads, bills, facility maintenance, and logistics expenditures.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="cursor-pointer">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="primary" size="sm" onClick={() => router.push('/expenses/create')} className="cursor-pointer">
                <Plus className="h-4 w-4" /> Create Expense
              </Button>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Total Disbursed</span>
                <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-foreground mt-2">
                ₹{totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">Across {expenses.length} recorded entries</span>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">GST / Tax Deductions</span>
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-foreground mt-2">
                ₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">Input tax credit eligible</span>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Paid Transactions</span>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-foreground mt-2">
                {paidCount} / {expenses.length}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Cleared vouchers</span>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Active Cost Centers</span>
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Tag className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-foreground mt-2">
                {uniqueCategoryCount} Categories
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">Managed operating nodes</span>
            </div>
          </div>

          {/* Main Table */}
          <DataTable
            data={expenses}
            columns={columns}
            searchKey="title"
            searchPlaceholder="Search by title, expense ID, vendor, or category..."
            filters={[
              { name: 'Category', key: 'category', options: filterOptions },
              { name: 'Payment Method', key: 'paymentMethod', options: ['Cash', 'Bank Transfer', 'UPI', 'Credit Card', 'Cheque'] },
              { name: 'Payment Status', key: 'paymentStatus', options: ['Paid', 'Pending', 'Approved', 'Rejected'] }
            ]}
          />

          {/* View Details Modal */}
          {viewExpense && (
            <Modal
              isOpen={Boolean(viewExpense)}
              onClose={() => setViewExpense(null)}
              title={`Expense Voucher — ${viewExpense.expenseNumber}`}
              size="md"
            >
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-muted/40 border border-border/70 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Expense Title</span>
                      <span className="text-sm font-bold text-foreground">{viewExpense.title}</span>
                    </div>
                    <Badge variant={viewExpense.paymentStatus === 'Paid' ? 'success' : 'warning'}>
                      {viewExpense.paymentStatus}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                    <div>
                      <span className="text-muted-foreground block">Category</span>
                      <span className="font-semibold text-foreground">{viewExpense.category}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Voucher Amount</span>
                      <span className="font-mono font-bold text-rose-600 text-sm">
                        ₹{Number(viewExpense.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Billing Date</span>
                      <span className="font-medium text-foreground">{viewExpense.date}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Payment Method</span>
                      <span className="font-medium text-foreground">{viewExpense.paymentMethod}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Payee / Vendor</span>
                      <span className="font-medium text-foreground">{viewExpense.vendor || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Bill / Ref Number</span>
                      <span className="font-mono font-medium text-foreground">{viewExpense.reference || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Disbursed By</span>
                      <span className="font-medium text-foreground">{viewExpense.paidBy || 'Accounts'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Branch / Location</span>
                      <span className="font-medium text-foreground">{viewExpense.warehouseName || 'Central Hub'}</span>
                    </div>
                  </div>

                  {viewExpense.description && (
                    <div className="pt-2 border-t border-border/50">
                      <span className="text-muted-foreground block mb-1">Remarks & Details</span>
                      <p className="text-foreground bg-card p-2 rounded-lg border border-border">
                        {viewExpense.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setViewExpense(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </Modal>
          )}

          {/* Edit Modal */}
          {editExpense && (
            <Modal
              isOpen={Boolean(editExpense)}
              onClose={() => !isSaving && setEditExpense(null)}
              title={`Edit Expense — ${editExpense.expenseNumber}`}
              size="md"
            >
              <form onSubmit={handleUpdate} className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Expense Title *</label>
                  <input
                    type="text"
                    required
                    value={editExpense.title}
                    onChange={(e) => setEditExpense({ ...editExpense, title: e.target.value })}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Category *</label>
                    <select
                      value={editExpense.category}
                      onChange={(e) => setEditExpense({ ...editExpense, category: e.target.value })}
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {categories.map((c) => (
                        <option key={c._id || c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Amount (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editExpense.amount}
                      onChange={(e) => setEditExpense({ ...editExpense, amount: Number(e.target.value) })}
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Tax / GST Amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editExpense.taxAmount || 0}
                      onChange={(e) => setEditExpense({ ...editExpense, taxAmount: Number(e.target.value) })}
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Billing Date *</label>
                    <input
                      type="date"
                      required
                      value={editExpense.date}
                      onChange={(e) => setEditExpense({ ...editExpense, date: e.target.value })}
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Payment Method</label>
                    <select
                      value={editExpense.paymentMethod}
                      onChange={(e) => setEditExpense({ ...editExpense, paymentMethod: e.target.value })}
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Payment Status</label>
                    <select
                      value={editExpense.paymentStatus}
                      onChange={(e) => setEditExpense({ ...editExpense, paymentStatus: e.target.value })}
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Payee / Vendor Name</label>
                    <input
                      type="text"
                      value={editExpense.vendor || ''}
                      onChange={(e) => setEditExpense({ ...editExpense, vendor: e.target.value })}
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Invoice / Receipt Ref #</label>
                    <input
                      type="text"
                      value={editExpense.reference || ''}
                      onChange={(e) => setEditExpense({ ...editExpense, reference: e.target.value })}
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Notes & Descriptions</label>
                  <textarea
                    rows={3}
                    value={editExpense.description || ''}
                    onChange={(e) => setEditExpense({ ...editExpense, description: e.target.value })}
                    className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setEditExpense(null)} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" isLoading={isSaving}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </Modal>
          )}

        </div>
      </PageContainer>
    </AppShell>
  );
}