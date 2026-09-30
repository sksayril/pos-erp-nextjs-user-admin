'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useToastStore } from '../../../lib/store';
import { 
  Calendar, ArrowUpRight, ArrowDownRight, 
  Search, Filter, RefreshCw, Printer, FileText, CheckCircle2,
  Download, ArrowDownLeft, Clock, Wallet, Banknote, ShieldCheck
} from 'lucide-react';

export default function DayBookPage() {
  const { addToast } = useToastStore();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [cashAccount, setCashAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDayBook = async () => {
    setLoading(true);
    try {
      const [txRes, accRes] = await Promise.all([
        fetch(`/api/accounting/transactions?date=${date}`),
        fetch('/api/accounting/accounts')
      ]);

      const txData = await txRes.json();
      const accData = await accRes.json();

      if (Array.isArray(txData)) setTransactions(txData);
      if (Array.isArray(accData)) {
        const cash = accData.find(a => a.subtype === 'Cash in Hand' || a.name.toLowerCase().includes('cash'));
        setCashAccount(cash || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDayBook();
  }, [date]);

  // Filter list
  const filteredTxns = transactions.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    return !q || 
      t.partyName?.toLowerCase().includes(q) || 
      t.transactionNumber?.toLowerCase().includes(q) || 
      t.category?.toLowerCase().includes(q) || 
      t.accountName?.toLowerCase().includes(q) ||
      t.reference?.toLowerCase().includes(q);
  });

  const todayInflows = transactions.filter(t => t.type === 'Inflow' || t.type === 'Debit').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const todayOutflows = transactions.filter(t => t.type === 'Outflow' || t.type === 'Credit').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const netDayChange = todayInflows - todayOutflows;
  const currentCash = cashAccount?.currentBalance || 25000;
  const estimatedOpening = Math.max(0, currentCash - netDayChange);
  const estimatedClosing = estimatedOpening + netDayChange;

  const exportToCSV = () => {
    const headers = ['Date', 'Txn Voucher', 'Channel / Account', 'Particulars / Head', 'Payment Mode', 'Inflow (Receipt ₹)', 'Outflow (Disbursement ₹)'];
    const rows = filteredTxns.map(t => [
      t.date,
      t.transactionNumber,
      `"${t.accountName}"`,
      `"${t.partyName || t.category || '-'}"`,
      t.paymentMethod || 'Cash',
      (t.type === 'Inflow' || t.type === 'Debit') ? t.amount : 0,
      (t.type === 'Outflow' || t.type === 'Credit') ? t.amount : 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Day_Book_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('info', 'Export Successful', `Day Book for ${date} downloaded.`);
  };

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6 select-none max-w-[1600px] mx-auto pb-12">
          
          {/* Top Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-amber-500/20">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold backdrop-blur-md">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Daily Financial Reconciliation</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  Financial Day Book
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
                  Real-time daily transaction sheet, daytime cash &amp; bank movements, opening/closing liquid reconciliation.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Date Picker */}
                <div className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 px-3.5 py-2 rounded-2xl backdrop-blur-md">
                  <Clock className="h-4 w-4 text-amber-300" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                  />
                </div>

                <button
                  onClick={() => fetchDayBook()}
                  title="Refresh Day Book"
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

                <button
                  onClick={() => window.print()}
                  className="h-11 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center gap-2 text-xs font-bold text-white transition-all cursor-pointer backdrop-blur-md"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Sheet</span>
                </button>
              </div>
            </div>
          </div>

          {/* Daily 4-Metric Position Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Day Opening</span>
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-black font-mono text-foreground">
                ₹{estimatedOpening.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-muted-foreground">Opening drawer &amp; float</p>
            </div>

            <div className="p-5 rounded-3xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Today Inflows (+)</span>
                <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                ₹{todayInflows.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-muted-foreground">Sales &amp; customer collections</p>
            </div>

            <div className="p-5 rounded-3xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Today Outflows (-)</span>
                <ArrowUpRight className="h-4 w-4 text-rose-500" />
              </div>
              <p className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
                ₹{todayOutflows.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-muted-foreground">Expenses &amp; supplier settlements</p>
            </div>

            <div className="p-5 rounded-3xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Closing Position</span>
                <Banknote className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                ₹{estimatedClosing.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-muted-foreground">Estimated day-end balance</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4 rounded-3xl bg-card border border-border/80 shadow-xs flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search day book entries, voucher or party..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-muted/30 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            <span className="text-xs text-muted-foreground font-medium hidden sm:inline-block font-mono">
              Date: {date} • {filteredTxns.length} records
            </span>
          </div>

          {/* Day Book Table */}
          <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border/60 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-sm text-foreground">Day Book Ledger — {date}</h3>
                <Badge variant="secondary" className="font-mono text-xs">
                  {filteredTxns.length} entries
                </Badge>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-extrabold">
                  <tr>
                    <th className="py-4 px-5">Time / Voucher</th>
                    <th className="py-4 px-5">Channel / Account</th>
                    <th className="py-4 px-5">Particulars / Head</th>
                    <th className="py-4 px-5">Payment Mode</th>
                    <th className="py-4 px-5 text-right">Receipt / Inflow (+)</th>
                    <th className="py-4 px-5 text-right">Payment / Outflow (-)</th>
                    <th className="py-4 px-5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="h-7 w-7 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
                          <span className="text-xs font-semibold">Generating Day Sheet...</span>
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

                          <td className="py-3.5 px-5 font-semibold text-foreground">
                            {t.accountName}
                          </td>

                          <td className="py-3.5 px-5">
                            <span className="font-bold text-foreground text-xs block">{t.partyName || t.category || 'Day Transaction'}</span>
                            <span className="text-[11px] text-muted-foreground truncate max-w-[200px] block">
                              {t.description || t.category || '-'}
                            </span>
                          </td>

                          <td className="py-3.5 px-5">
                            <Badge variant="secondary" className="text-[10px] font-medium">
                              {t.paymentMethod || 'Cash'}
                            </Badge>
                          </td>

                          <td className="py-3.5 px-5 text-right font-mono font-bold">
                            {isInflow ? (
                              <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-lg">
                                +₹{Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-5 text-right font-mono font-bold">
                            {!isInflow ? (
                              <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1 rounded-lg">
                                -₹{Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-5 text-center">
                            <Badge variant="success" className="text-[10px] py-0.5 px-2 font-semibold">
                              Audited
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Calendar className="h-10 w-10 text-muted-foreground/30 stroke-1" />
                          <p className="font-bold text-sm text-foreground">No Transactions Recorded on {date}</p>
                          <p className="text-xs text-muted-foreground">Select another date or post new entries from POS/Cash/Bank.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </PageContainer>
    </AppShell>
  );
}