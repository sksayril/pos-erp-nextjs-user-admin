'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { useToastStore } from '../../../lib/store';
import { 
  Receipt, Search, Filter, Calendar, Printer, 
  ArrowUpRight, ArrowDownRight, RefreshCw, CheckCircle2,
  Download, ArrowDownLeft, Eye, CreditCard, Banknote, ShieldCheck
} from 'lucide-react';

export default function PaymentsHistoryPage() {
  const { addToast } = useToastStore();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INFLOW' | 'OUTFLOW'>('ALL');
  const [viewTxn, setViewTxn] = useState<any>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/accounting/transactions');
      const data = await res.json();
      if (Array.isArray(data)) setTransactions(data);
    } catch (err) {
      addToast('error', 'Fetch Error', 'Failed to retrieve transaction payments data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredTxns = transactions.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      t.partyName?.toLowerCase().includes(q) || 
      t.transactionNumber?.toLowerCase().includes(q) || 
      t.reference?.toLowerCase().includes(q) || 
      t.category?.toLowerCase().includes(q) ||
      t.accountName?.toLowerCase().includes(q);
    const matchesMode = modeFilter === 'all' || t.paymentMethod === modeFilter;
    const matchesType = typeFilter === 'ALL' || 
      (typeFilter === 'INFLOW' && (t.type === 'Inflow' || t.type === 'Debit')) ||
      (typeFilter === 'OUTFLOW' && (t.type === 'Outflow' || t.type === 'Credit'));
    return matchesSearch && matchesMode && matchesType;
  });

  const totalCollected = transactions.filter(t => t.type === 'Inflow' || t.type === 'Debit').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalDisbursed = transactions.filter(t => t.type === 'Outflow' || t.type === 'Credit').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const exportToCSV = () => {
    const headers = ['Voucher No', 'Date', 'Type', 'Account', 'Particulars / Party', 'Payment Mode', 'Reference', 'Amount (₹)'];
    const rows = filteredTxns.map(t => [
      t.transactionNumber,
      t.date,
      t.type,
      `"${t.accountName}"`,
      `"${t.partyName || t.category || '-'}"`,
      t.paymentMethod,
      `"${t.reference || '-'}"`,
      t.amount
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Payments_History_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('info', 'Export Successful', 'Payments History downloaded as CSV.');
  };

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6 select-none max-w-[1600px] mx-auto pb-12">
          
          {/* Top Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
                  <Receipt className="h-3.5 w-3.5" />
                  <span>Omni-Channel Payment Audit Log</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  Payments History &amp; Receipts
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
                  Consolidated timeline of customer receivables collections, supplier payments, POS cash drops and UPI settlements.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => fetchPayments()}
                  title="Refresh Payments"
                  className="h-11 w-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all cursor-pointer backdrop-blur-md"
                >
                  <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={exportToCSV}
                  className="h-11 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center gap-2 text-xs font-bold text-white transition-all cursor-pointer backdrop-blur-md"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Metric Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="relative overflow-hidden p-6 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ArrowDownLeft className="h-6 w-6" />
                </div>
                <Badge variant="success" className="font-mono text-xs">
                  Collections
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Inflows Received</span>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono tracking-tight">
                  ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">POS counter, UPI &amp; bank credits</p>
              </div>
            </div>

            <div className="relative overflow-hidden p-6 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <ArrowUpRight className="h-6 w-6" />
                </div>
                <Badge variant="destructive" className="font-mono text-xs">
                  Disbursements
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Outflows Paid</span>
                <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono tracking-tight">
                  ₹{totalDisbursed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">Vendor wires, payroll &amp; expenses</p>
              </div>
            </div>

            <div className="relative overflow-hidden p-6 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Receipt className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  Records
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Transaction Logs</span>
                <p className="text-3xl font-black text-foreground mt-1 font-mono tracking-tight">
                  {transactions.length}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">Full immutable ledger audit logs</p>
              </div>
            </div>
          </div>

          {/* Filter Bar & Tabs */}
          <div className="p-4 rounded-3xl bg-card border border-border/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search transaction voucher, party, reference or head..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-muted/30 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center bg-muted/40 p-1 rounded-2xl border border-border">
                <button
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    typeFilter === 'ALL'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All ({transactions.length})
                </button>
                <button
                  onClick={() => setTypeFilter('INFLOW')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    typeFilter === 'INFLOW'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'
                  }`}
                >
                  Inflows
                </button>
                <button
                  onClick={() => setTypeFilter('OUTFLOW')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    typeFilter === 'OUTFLOW'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-rose-600 dark:text-rose-400 hover:text-rose-700'
                  }`}
                >
                  Outflows
                </button>
              </div>

              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="h-11 rounded-2xl border border-border bg-card px-4 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                <option value="all">All Payment Methods</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer / NEFT</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          {/* Payments Table */}
          <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border/60 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-indigo-500" />
                <h3 className="font-bold text-sm text-foreground">Transaction Logs</h3>
                <Badge variant="secondary" className="font-mono text-xs">
                  {filteredTxns.length} records
                </Badge>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-extrabold">
                  <tr>
                    <th className="py-4 px-5">Voucher &amp; Date</th>
                    <th className="py-4 px-5">Account Channel</th>
                    <th className="py-4 px-5">Particulars / Party</th>
                    <th className="py-4 px-5">Payment Mode</th>
                    <th className="py-4 px-5">Reference</th>
                    <th className="py-4 px-5 text-right">Amount (₹)</th>
                    <th className="py-4 px-5 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="h-7 w-7 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent" />
                          <span className="text-xs font-semibold">Loading Payments History...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTxns.length > 0 ? (
                    filteredTxns.map((t) => {
                      const isInflow = t.type === 'Inflow' || t.type === 'Debit';
                      return (
                        <tr key={t._id || t.transactionNumber} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-5">
                            <span className="font-mono font-bold text-foreground block text-xs">
                              {t.transactionNumber}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {t.date}
                            </span>
                          </td>

                          <td className="py-3.5 px-5">
                            <span className="font-semibold text-foreground text-xs block">{t.accountName}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">Type: {t.accountType || 'Asset'}</span>
                          </td>

                          <td className="py-3.5 px-5">
                            <span className="font-bold text-foreground text-xs block">{t.partyName || t.category || 'General Payment'}</span>
                            <span className="text-[11px] text-muted-foreground truncate max-w-[200px] block">
                              {t.description || t.category || '-'}
                            </span>
                          </td>

                          <td className="py-3.5 px-5">
                            <Badge variant="secondary" className="text-[10px] font-medium">
                              {t.paymentMethod || 'Cash'}
                            </Badge>
                          </td>

                          <td className="py-3.5 px-5 font-mono text-[11px] text-muted-foreground">
                            {t.reference || '—'}
                          </td>

                          <td className="py-3.5 px-5 text-right font-mono font-black text-xs">
                            {isInflow ? (
                              <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-lg">
                                +₹{Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1 rounded-lg">
                                -₹{Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-5 text-center">
                            <button
                              onClick={() => setViewTxn(t)}
                              title="View Payment Voucher"
                              className="h-8 w-8 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Receipt className="h-10 w-10 text-muted-foreground/30 stroke-1" />
                          <p className="font-bold text-sm text-foreground">No Payments Found</p>
                          <p className="text-xs text-muted-foreground">No transactions match your current filters.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* View Voucher Modal */}
          {viewTxn && (
            <Modal
              isOpen={true}
              onClose={() => setViewTxn(null)}
              title="Official Payment Voucher Receipt"
              size="md"
            >
              <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <h3 className="font-black text-lg text-foreground">PAYMENT RECEIPT</h3>
                    <p className="text-xs font-mono text-muted-foreground">Voucher: {viewTxn.transactionNumber}</p>
                  </div>
                  <Badge variant={viewTxn.type === 'Inflow' ? 'success' : 'destructive'} className="text-xs px-3 py-1 font-bold">
                    {viewTxn.type}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground font-semibold block">Date &amp; Time</span>
                    <p className="font-bold text-foreground font-mono mt-0.5">{viewTxn.date}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold block">Payment Mode</span>
                    <p className="font-bold text-foreground mt-0.5">{viewTxn.paymentMethod || 'Cash'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold block">Channel Account</span>
                    <p className="font-bold text-foreground mt-0.5">{viewTxn.accountName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold block">Reference / UTR</span>
                    <p className="font-bold text-foreground font-mono mt-0.5">{viewTxn.reference || 'N/A'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground font-bold block">Party / Category</span>
                    <p className="text-sm font-bold text-foreground mt-0.5">{viewTxn.partyName || viewTxn.category || 'General'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground font-bold block">Settled Amount</span>
                    <p className="text-2xl font-black font-mono text-foreground mt-0.5">
                      ₹{Number(viewTxn.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {viewTxn.description && (
                  <p className="text-xs text-muted-foreground italic">
                    Narration: {viewTxn.description}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                    className="gap-1.5 rounded-xl cursor-pointer"
                  >
                    <Printer className="h-4 w-4" /> Print
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setViewTxn(null)}
                    className="rounded-xl font-bold cursor-pointer"
                  >
                    Done
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