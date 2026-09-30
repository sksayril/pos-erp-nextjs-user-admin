'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { 
  History, RefreshCw, Eye, Tag, CreditCard, 
  Calendar, Building2, TrendingDown, PieChart, DollarSign, ArrowUpRight
} from 'lucide-react';
import { useToastStore } from '../../../lib/store';

export default function HistoryPage() {
  const { addToast } = useToastStore();
  const [data, setData] = useState<{
    totalExpenseAmount: number;
    totalTaxPaid: number;
    totalTransactions: number;
    categoryBreakdown: Record<string, { total: number; count: number; budget: number }>;
    paymentMethodBreakdown: Record<string, number>;
    history: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [viewItem, setViewItem] = useState<any | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/expenses/history');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Fetch history error:', error);
      addToast('error', 'Fetch Error', 'Failed to retrieve expense history analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const columns = [
    {
      header: 'Expense ID / Title',
      accessor: 'expenseNumber',
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-xs text-primary">{row.expenseNumber}</span>
          <span className="font-semibold text-xs text-foreground mt-0.5">{row.title}</span>
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
      header: 'Disbursed Amount',
      accessor: 'amount',
      sortable: true,
      render: (row: any) => (
        <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
          ₹{Number(row.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Disbursement Date',
      accessor: 'date',
      sortable: true,
      render: (row: any) => (
        <span className="text-xs text-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3 text-muted-foreground" /> {row.date}
        </span>
      )
    },
    {
      header: 'Payment Mode',
      accessor: 'paymentMethod',
      render: (row: any) => (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground bg-muted/50 px-2 py-1 rounded-md border border-border">
          <CreditCard className="h-3 w-3 text-muted-foreground" /> {row.paymentMethod}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'paymentStatus',
      render: (row: any) => (
        <Badge variant={row.paymentStatus === 'Paid' ? 'success' : 'warning'} className="text-[11px]">
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
            onClick={() => setViewItem(row)}
            className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="View Voucher"
          >
            <Eye className="h-4.5 w-4.5" />
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
                <History className="h-6 w-6 text-primary" /> Expense History & Cost Analytics
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Historical record of operating expenses, department cost breakdowns, and payment method audit logs.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchHistory} disabled={loading} className="cursor-pointer">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>
          </div>

          {/* Analytics Summary */}
          {data && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              
              {/* Grand Total Spent */}
              <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card to-muted/20 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Historical Outflow</span>
                  <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                    <TrendingDown className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
                    ₹{Number(data.totalExpenseAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total cumulative expenses recorded across {data.totalTransactions} transactions.
                  </p>
                </div>
                <div className="pt-3 border-t border-border/60 flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Total GST/Tax Paid:</span>
                  <span className="font-mono font-bold text-foreground">
                    ₹{Number(data.totalTaxPaid || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Category Breakdown list */}
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-3 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <PieChart className="h-4 w-4 text-primary" /> Spend Distribution by Category
                  </span>
                  <span className="text-[11px] text-muted-foreground">{Object.keys(data.categoryBreakdown || {}).length} Cost Centers</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                  {Object.entries(data.categoryBreakdown || {}).map(([catName, info]) => {
                    const pct = data.totalExpenseAmount > 0 
                      ? Math.round((info.total / data.totalExpenseAmount) * 100) 
                      : 0;
                    return (
                      <div key={catName} className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1.5">
                        <div className="flex justify-between items-start text-xs">
                          <span className="font-semibold text-foreground truncate max-w-[150px]">{catName}</span>
                          <span className="font-mono font-bold text-rose-600 text-xs">
                            ₹{info.total.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{info.count} entries</span>
                          <span className="font-bold text-primary">{pct}% of total</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-primary h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* Detailed History Table */}
          <DataTable
            title="Complete Expense Audit Trail"
            data={data?.history || []}
            columns={columns}
            searchKey="title"
            searchPlaceholder="Search audit records by title, payee, or category..."
          />

          {/* View Voucher Modal */}
          {viewItem && (
            <Modal
              isOpen={Boolean(viewItem)}
              onClose={() => setViewItem(null)}
              title={`Expense Audit Voucher — ${viewItem.expenseNumber}`}
              size="md"
            >
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-muted/40 border border-border/70 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Expense Title</span>
                      <span className="text-sm font-bold text-foreground">{viewItem.title}</span>
                    </div>
                    <Badge variant={viewItem.paymentStatus === 'Paid' ? 'success' : 'warning'}>
                      {viewItem.paymentStatus}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                    <div>
                      <span className="text-muted-foreground block">Category</span>
                      <span className="font-semibold text-foreground">{viewItem.category}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Paid Amount</span>
                      <span className="font-mono font-bold text-rose-600 text-sm">
                        ₹{Number(viewItem.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Date Cleared</span>
                      <span className="font-medium text-foreground">{viewItem.date}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Payment Mode</span>
                      <span className="font-medium text-foreground">{viewItem.paymentMethod}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Payee / Vendor</span>
                      <span className="font-medium text-foreground">{viewItem.vendor || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Bill / Ref #</span>
                      <span className="font-mono font-medium text-foreground">{viewItem.reference || '—'}</span>
                    </div>
                  </div>

                  {viewItem.description && (
                    <div className="pt-2 border-t border-border/50">
                      <span className="text-muted-foreground block mb-1">Remarks</span>
                      <p className="text-foreground bg-card p-2 rounded-lg border border-border">
                        {viewItem.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="outline" size="sm" onClick={() => setViewItem(null)}>
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