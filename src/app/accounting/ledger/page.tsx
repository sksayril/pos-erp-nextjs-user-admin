'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useToastStore } from '../../../lib/store';
import { 
  BookOpen, Search, Filter, Calendar, 
  ArrowUpRight, ArrowDownRight, RefreshCw, Printer,
  Download, Layers, Scale, CheckCircle2, FileText, Landmark
} from 'lucide-react';

export default function GeneralLedgerPage() {
  const { addToast } = useToastStore();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLedgerData = async () => {
    setLoading(true);
    try {
      const [accRes, txRes] = await Promise.all([
        fetch('/api/accounting/accounts'),
        fetch('/api/accounting/transactions')
      ]);

      const accData = await accRes.json();
      const txData = await txRes.json();

      if (Array.isArray(accData)) setAccounts(accData);
      if (Array.isArray(txData)) setTransactions(txData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
  }, []);

  // Filter ledger rows
  const filteredTxns = transactions.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      t.partyName?.toLowerCase().includes(q) || 
      t.accountName?.toLowerCase().includes(q) || 
      t.reference?.toLowerCase().includes(q) || 
      t.transactionNumber?.toLowerCase().includes(q) || 
      t.category?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q);
    const matchesAccount = selectedAccountId === 'all' || t.accountName === selectedAccountId;
    return matchesSearch && matchesAccount;
  });

  const selectedAccObj = accounts.find(a => a.name === selectedAccountId);

  // Total debits / credits in ledger
  const totalDebits = filteredTxns.filter(t => t.type === 'Inflow' || t.type === 'Debit').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalCredits = filteredTxns.filter(t => t.type === 'Outflow' || t.type === 'Credit').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const exportToCSV = () => {
    const headers = ['Date', 'Txn Voucher', 'Account Head', 'Particulars / Party', 'Payment Mode', 'Reference', 'Debit (Dr ₹)', 'Credit (Cr ₹)'];
    const rows = filteredTxns.map(t => [
      t.date,
      t.transactionNumber,
      `"${t.accountName}"`,
      `"${t.partyName || t.category || '-'}"`,
      t.paymentMethod || 'Manual',
      `"${t.reference || '-'}"`,
      (t.type === 'Inflow' || t.type === 'Debit') ? t.amount : 0,
      (t.type === 'Outflow' || t.type === 'Credit') ? t.amount : 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `General_Ledger_${selectedAccountId === 'all' ? 'All' : selectedAccountId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('info', 'Export Successful', 'General Ledger downloaded as CSV.');
  };

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6 select-none max-w-[1600px] mx-auto pb-12">
          
          {/* Top Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-sky-500/20">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold backdrop-blur-md">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Audit Trail &amp; General Ledger</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  General Ledger (T-Accounts)
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
                  Inspect running balances, debit &amp; credit audit trails, opening balance carryovers and financial movements.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => fetchLedgerData()}
                  title="Refresh Ledger"
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
                  <span>Print Ledger</span>
                </button>
              </div>
            </div>
          </div>

          {/* Metric Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="relative overflow-hidden p-6 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ArrowUpRight className="h-6 w-6" />
                </div>
                <Badge variant="success" className="font-mono text-xs">
                  Debit (Dr)
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Ledger Debits</span>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono tracking-tight">
                  ₹{totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">Asset additions &amp; expense postings</p>
              </div>
            </div>

            <div className="relative overflow-hidden p-6 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <ArrowDownRight className="h-6 w-6" />
                </div>
                <Badge variant="destructive" className="font-mono text-xs">
                  Credit (Cr)
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Ledger Credits</span>
                <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono tracking-tight">
                  ₹{totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">Revenue receipts &amp; liability credits</p>
              </div>
            </div>

            <div className="relative overflow-hidden p-6 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Scale className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  Net Ledger
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {selectedAccObj ? `${selectedAccObj.name} Balance` : 'Net Ledger Movement'}
                </span>
                <p className="text-3xl font-black text-foreground mt-1 font-mono tracking-tight">
                  ₹{selectedAccObj ? Number(selectedAccObj.currentBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : Math.abs(totalDebits - totalCredits).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {selectedAccObj ? `Classification: ${selectedAccObj.type} (${selectedAccObj.subtype || 'General'})` : 'Calculated running differential'}
                </p>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-3xl bg-card border border-border/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search ledger entries, party or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-muted/30 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            {/* Account Selector */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-bold text-muted-foreground whitespace-nowrap flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-primary" /> Select Account:
              </span>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="h-11 w-full md:w-80 rounded-2xl border border-border bg-card px-4 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                <option value="all">All Accounts (Consolidated Ledger)</option>
                {accounts.map((a) => (
                  <option key={a._id || a.name} value={a.name}>
                    {a.name} ({a.type}) — Bal: ₹{Number(a.currentBalance || 0).toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border/60 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-sky-500" />
                <h3 className="font-bold text-sm text-foreground">
                  {selectedAccountId === 'all' ? 'Consolidated General Ledger' : `${selectedAccountId} Account Statement`}
                </h3>
                <Badge variant="secondary" className="font-mono text-xs">
                  {filteredTxns.length} entries
                </Badge>
              </div>

              {selectedAccObj && (
                <div className="text-right">
                  <span className="text-[11px] text-muted-foreground font-semibold">Opening: ₹{Number(selectedAccObj.openingBalance || 0).toLocaleString('en-IN')} • Current: </span>
                  <span className="text-xs font-black font-mono text-foreground">
                    ₹{Number(selectedAccObj.currentBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-extrabold">
                  <tr>
                    <th className="py-4 px-5">Date</th>
                    <th className="py-4 px-5">Voucher / Txn</th>
                    <th className="py-4 px-5">Account Head</th>
                    <th className="py-4 px-5">Particulars / Party</th>
                    <th className="py-4 px-5">Mode &amp; Ref</th>
                    <th className="py-4 px-5 text-right">Debit (Dr ₹)</th>
                    <th className="py-4 px-5 text-right">Credit (Cr ₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="h-7 w-7 animate-spin rounded-full border-3 border-sky-500 border-t-transparent" />
                          <span className="text-xs font-semibold">Computing Ledger Balances...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTxns.length > 0 ? (
                    filteredTxns.map((t) => {
                      const isDr = t.type === 'Inflow' || t.type === 'Debit';
                      const isCr = t.type === 'Outflow' || t.type === 'Credit';
                      return (
                        <tr key={t._id || t.transactionNumber} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-5 font-mono text-[11px] text-muted-foreground">
                            {t.date}
                          </td>

                          <td className="py-3.5 px-5 font-mono font-bold text-foreground">
                            {t.transactionNumber}
                          </td>

                          <td className="py-3.5 px-5 font-semibold text-foreground">
                            {t.accountName}
                          </td>

                          <td className="py-3.5 px-5">
                            <span className="font-bold text-foreground text-xs block">{t.partyName || t.category || 'General Ledger Entry'}</span>
                            <span className="text-[11px] text-muted-foreground truncate max-w-[200px] block">
                              {t.description || '-'}
                            </span>
                          </td>

                          <td className="py-3.5 px-5 font-mono text-[11px] text-muted-foreground">
                            <Badge variant="secondary" className="text-[9px] mr-1.5">{t.paymentMethod || 'Journal'}</Badge>
                            {t.reference || '—'}
                          </td>

                          <td className="py-3.5 px-5 text-right font-mono font-bold">
                            {isDr ? (
                              <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-lg">
                                ₹{Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-5 text-right font-mono font-bold">
                            {isCr ? (
                              <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1 rounded-lg">
                                ₹{Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <BookOpen className="h-10 w-10 text-muted-foreground/30 stroke-1" />
                          <p className="font-bold text-sm text-foreground">No Ledger Entries Found</p>
                          <p className="text-xs text-muted-foreground">Try selecting another account head or resetting the search filter.</p>
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