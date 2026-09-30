'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { useToastStore } from '../../../lib/store';
import { 
  FileSpreadsheet, Plus, Search, Filter, Trash2, 
  RefreshCw, CheckCircle2, AlertCircle, FileText, Check,
  Scale, Download, Calendar, ArrowRightLeft, BookOpen, Layers
} from 'lucide-react';

export default function JournalEntriesPage() {
  const { addToast } = useToastStore();

  const [entries, setEntries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<any[]>([
    { accountId: '', accountName: '', debit: 0, credit: 0, notes: '' },
    { accountId: '', accountName: '', debit: 0, credit: 0, notes: '' }
  ]);
  const [isPosting, setIsPosting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchJournalData = async () => {
    setLoading(true);
    try {
      const [jrnRes, accRes] = await Promise.all([
        fetch('/api/accounting/journal'),
        fetch('/api/accounting/accounts')
      ]);

      const jrnData = await jrnRes.json();
      const accData = await accRes.json();

      if (Array.isArray(jrnData)) setEntries(jrnData);
      if (Array.isArray(accData)) {
        setAccounts(accData);
        if (accData.length >= 2) {
          setLines([
            { accountId: accData[0]._id, accountName: accData[0].name, debit: 0, credit: 0, notes: '' },
            { accountId: accData[1]._id, accountName: accData[1].name, debit: 0, credit: 0, notes: '' }
          ]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournalData();
  }, []);

  const handleAddLine = () => {
    setLines(prev => [...prev, { accountId: accounts[0]?._id || '', accountName: accounts[0]?.name || '', debit: 0, credit: 0, notes: '' }]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) {
      addToast('warning', 'Minimum Required', 'A double-entry voucher requires at least 2 accounts.');
      return;
    }
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    setLines(prev => prev.map((l, i) => {
      if (i === index) {
        if (field === 'accountName') {
          const found = accounts.find(a => a.name === value);
          return { ...l, accountName: value, accountId: found?._id || '' };
        }
        return { ...l, [field]: value };
      }
      return l;
    }));
  };

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handlePostJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!description.trim()) {
      setFormError('Please enter a description / narration for this journal voucher.');
      return;
    }

    if (!isBalanced) {
      setFormError(`Debit and Credit amounts must match. Current difference: ₹${Math.abs(totalDebit - totalCredit).toFixed(2)}`);
      return;
    }

    setIsPosting(true);
    try {
      const res = await fetch('/api/accounting/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          reference: reference.trim() || undefined,
          description: description.trim(),
          lines: lines.map(l => ({
            accountId: l.accountId,
            accountName: l.accountName,
            debit: Number(l.debit) || 0,
            credit: Number(l.credit) || 0,
            notes: l.notes
          }))
        })
      });

      if (res.ok) {
        addToast('success', 'Journal Voucher Posted', 'Balanced double-entry voucher recorded.');
        setCreateModalOpen(false);
        setDescription('');
        setReference('');
        fetchJournalData();
      } else {
        const err = await res.json();
        setFormError(err.error || 'Failed to post voucher.');
      }
    } catch {
      setFormError('Network error while posting voucher.');
    } finally {
      setIsPosting(false);
    }
  };

  // Filter list
  const filteredEntries = entries.filter((e) => {
    const q = searchQuery.toLowerCase().trim();
    return !q || 
      e.voucherNumber?.toLowerCase().includes(q) || 
      e.description?.toLowerCase().includes(q) || 
      e.reference?.toLowerCase().includes(q) ||
      e.lines?.some((l: any) => l.accountName?.toLowerCase().includes(q));
  });

  const totalPostedVolume = entries.reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0);

  const exportToCSV = () => {
    const headers = ['Voucher No', 'Date', 'Description', 'Reference', 'Total Debit (₹)', 'Total Credit (₹)', 'Status'];
    const rows = filteredEntries.map(e => [
      e.voucherNumber,
      e.date,
      `"${e.description || '-'}"`,
      `"${e.reference || '-'}"`,
      e.totalAmount,
      e.totalAmount,
      'Posted'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Journal_Vouchers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('info', 'Export Successful', 'Journal entries exported as CSV.');
  };

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6 select-none max-w-[1600px] mx-auto pb-12">
          
          {/* Top Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-violet-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-violet-500/20">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-semibold backdrop-blur-md">
                  <Scale className="h-3.5 w-3.5" />
                  <span>Double-Entry General Journal</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  Journal Entries &amp; Vouchers
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
                  Post compound adjusting entries, depreciation vouchers, equity settlements, and multi-line account transfers.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => fetchJournalData()}
                  title="Refresh Journals"
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

                <Button
                  variant="primary"
                  onClick={() => {
                    setFormError('');
                    setCreateModalOpen(true);
                  }}
                  className="h-11 px-5 rounded-2xl font-bold shadow-lg shadow-violet-500/25 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white cursor-pointer border-0 flex items-center gap-2"
                >
                  <Plus className="h-4.5 w-4.5" />
                  <span>Create Journal Voucher</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Metric Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="relative overflow-hidden p-6 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  Vouchers
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Journal Vouchers</span>
                <p className="text-3xl font-black text-foreground mt-1 font-mono tracking-tight">
                  {entries.length}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">General journal double-entries</p>
              </div>
            </div>

            <div className="relative overflow-hidden p-6 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <Badge variant="success" className="font-mono text-xs">
                  Balanced
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Debit / Credit Equilibrium</span>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono tracking-tight">
                  100%
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">Strict double-entry validation active</p>
              </div>
            </div>

            <div className="relative overflow-hidden p-6 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Scale className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  Turnover
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cumulative Journal Volume</span>
                <p className="text-3xl font-black text-foreground mt-1 font-mono tracking-tight">
                  ₹{totalPostedVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">Total value posted through journal</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4 rounded-3xl bg-card border border-border/80 shadow-xs flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search voucher number, account name or narration..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-muted/30 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            <span className="text-xs text-muted-foreground font-medium hidden sm:inline-block">
              Showing {filteredEntries.length} posted vouchers
            </span>
          </div>

          {/* Journal Entries Cards */}
          <div className="space-y-4">
            {loading ? (
              <div className="p-16 rounded-3xl border border-border/80 bg-card text-center text-muted-foreground">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="h-7 w-7 animate-spin rounded-full border-3 border-violet-500 border-t-transparent" />
                  <span className="text-xs font-semibold">Loading Journal Entries...</span>
                </div>
              </div>
            ) : filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => (
                <div key={entry._id || entry.voucherNumber} className="p-6 rounded-3xl border border-border/80 bg-card shadow-xs hover:shadow-md transition-all space-y-4">
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold flex items-center justify-center text-xs">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-foreground">{entry.voucherNumber}</span>
                          <Badge variant="success" className="text-[10px] py-0.5 px-2">Posted</Badge>
                        </div>
                        <span className="text-[11px] text-muted-foreground font-mono">Date: {entry.date} {entry.reference ? `• Ref: ${entry.reference}` : ''}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Voucher Total</span>
                      <span className="text-base font-black font-mono text-foreground">
                        ₹{Number(entry.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Narration */}
                  {entry.description && (
                    <p className="text-xs text-muted-foreground italic bg-muted/20 p-2.5 rounded-xl border border-border/40">
                      &quot;{entry.description}&quot;
                    </p>
                  )}

                  {/* Lines Table */}
                  <div className="overflow-x-auto rounded-2xl border border-border/60">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] font-extrabold">
                        <tr>
                          <th className="py-2.5 px-4">Account Head</th>
                          <th className="py-2.5 px-4">Notes</th>
                          <th className="py-2.5 px-4 text-right">Debit (Dr ₹)</th>
                          <th className="py-2.5 px-4 text-right">Credit (Cr ₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-medium">
                        {entry.lines?.map((line: any, idx: number) => (
                          <tr key={idx} className="hover:bg-muted/20 transition-colors">
                            <td className="py-2 px-4 font-bold text-foreground">
                              {line.accountName}
                            </td>
                            <td className="py-2 px-4 text-muted-foreground text-[11px]">
                              {line.notes || '—'}
                            </td>
                            <td className="py-2 px-4 text-right font-mono font-bold">
                              {Number(line.debit) > 0 ? (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  ₹{Number(line.debit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40">—</span>
                              )}
                            </td>
                            <td className="py-2 px-4 text-right font-mono font-bold">
                              {Number(line.credit) > 0 ? (
                                <span className="text-rose-600 dark:text-rose-400">
                                  ₹{Number(line.credit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-16 rounded-3xl border border-border/80 bg-card text-center text-muted-foreground">
                <div className="flex flex-col items-center justify-center gap-2">
                  <FileSpreadsheet className="h-10 w-10 text-muted-foreground/30 stroke-1" />
                  <p className="font-bold text-sm text-foreground">No Journal Entries Found</p>
                  <p className="text-xs text-muted-foreground">No vouchers match your current search.</p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setCreateModalOpen(true)}
                    className="mt-3 rounded-xl gap-2 font-bold cursor-pointer bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create Journal Voucher
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Create Journal Voucher Modal */}
          <Modal
            isOpen={createModalOpen}
            onClose={() => !isPosting && setCreateModalOpen(false)}
            title="Compose Double-Entry Journal Voucher"
            description="Add balanced debit and credit accounts to record compound general ledger transactions."
            size="lg"
          >
            <form onSubmit={handlePostJournal} className="space-y-5">
              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Voucher Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Reference / Doc No</label>
                  <input
                    type="text"
                    placeholder="e.g. JV-2026-009"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Description / Narration *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Month-end computer asset depreciation write-off"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                />
              </div>

              {/* Multi-Line Ledger Accounts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">Ledger Accounts &amp; Balances *</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddLine}
                    className="h-8 px-3 rounded-xl text-xs font-bold gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Line
                  </Button>
                </div>

                <div className="space-y-2">
                  {lines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-2xl bg-muted/30 border border-border/60">
                      <div className="col-span-5">
                        <select
                          value={line.accountName}
                          onChange={(e) => handleLineChange(idx, 'accountName', e.target.value)}
                          className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
                          required
                        >
                          {accounts.map(a => (
                            <option key={a._id || a.name} value={a.name}>
                              {a.name} ({a.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Debit (₹)"
                          value={line.debit || ''}
                          onChange={(e) => {
                            handleLineChange(idx, 'debit', Number(e.target.value));
                            if (Number(e.target.value) > 0) handleLineChange(idx, 'credit', 0);
                          }}
                          className="w-full h-10 rounded-xl border border-border bg-muted/20 px-3 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Credit (₹)"
                          value={line.credit || ''}
                          onChange={(e) => {
                            handleLineChange(idx, 'credit', Number(e.target.value));
                            if (Number(e.target.value) > 0) handleLineChange(idx, 'debit', 0);
                          }}
                          className="w-full h-10 rounded-xl border border-border bg-muted/20 px-3 text-xs font-mono font-bold text-rose-600 dark:text-rose-400 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>

                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                          title="Remove Line"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Balanced Check Bar */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isBalanced
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
              }`}>
                <div className="flex items-center gap-2 text-xs font-bold">
                  {isBalanced ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <span>{isBalanced ? 'Voucher is Perfectly Balanced' : `Imbalance: ₹${Math.abs(totalDebit - totalCredit).toFixed(2)}`}</span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono font-bold">
                  <span>Dr: ₹{totalDebit.toFixed(2)}</span>
                  <span>Cr: ₹{totalCredit.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={isPosting}
                  className="rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isPosting || !isBalanced}
                  className="rounded-xl font-bold px-6 shadow-md cursor-pointer bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white"
                >
                  {isPosting ? 'Posting Voucher...' : 'Post Journal Voucher'}
                </Button>
              </div>
            </form>
          </Modal>

        </div>
      </PageContainer>
    </AppShell>
  );
}