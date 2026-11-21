'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { useToastStore } from '../../../lib/store';
import { 
  Banknote, Plus, ArrowUpRight, ArrowDownRight, Search, 
  Filter, Calendar, Clock, RefreshCw, FileText, CheckCircle2,
  Wallet, ArrowDownLeft, Send, Download, ShieldCheck, Coins
} from 'lucide-react';

export default function CashJournalPage() {
  const { addToast } = useToastStore();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [cashAccount, setCashAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INFLOW' | 'OUTFLOW'>('ALL');

  // Modal
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [txnType, setTxnType] = useState<'Inflow' | 'Outflow'>('Inflow');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Sales Revenue');
  const [partyName, setPartyName] = useState('');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const [txRes, accRes] = await Promise.all([
        fetch('/api/accounting/transactions?type=Cash'),
        fetch('/api/accounting/accounts')
      ]);

      const txData = await txRes.json();
      const accData = await accRes.json();

      if (Array.isArray(txData)) setTransactions(txData);
      if (Array.isArray(accData)) {
        const cash = accData.find(a => a.name.toLowerCase().includes('cash') || a.subtype === 'Cash in Hand');
        setCashAccount(cash || null);
      }
    } catch (err) {
      addToast('error', 'Fetch Error', 'Failed to retrieve cash transactions from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleOpenModal = (type: 'Inflow' | 'Outflow') => {
    setTxnType(type);
    setCategory(type === 'Inflow' ? 'Cash Sales Revenue' : 'Petty Expense / Utility');
    setRecordModalOpen(true);
  };

  const handleRecordTxn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      addToast('warning', 'Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/accounting/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountType: 'Cash',
          accountName: cashAccount?.name || 'Main Cash in Hand',
          type: txnType,
          amount: Number(amount),
          category,
          partyName: partyName.trim() || undefined,
          paymentMethod: 'Cash',
          reference: reference.trim() || undefined,
          description: description.trim()
        })
      });

      if (res.ok) {
        addToast('success', 'Cash Entry Recorded', `Successfully recorded Cash ${txnType} of ₹${Number(amount).toLocaleString('en-IN')}.`);
        setRecordModalOpen(false);
        setAmount('');
        setPartyName('');
        setReference('');
        setDescription('');
        fetchTransactions();
      } else {
        const errorData = await res.json();
        addToast('error', 'Error', errorData.error || 'Failed to save transaction.');
      }
    } catch {
      addToast('error', 'Network Error', 'Failed to save transaction.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter list
  const filteredTxns = transactions.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      t.partyName?.toLowerCase().includes(q) || 
      t.category?.toLowerCase().includes(q) || 
      t.transactionNumber?.toLowerCase().includes(q) || 
      t.reference?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q);
    const matchesType = typeFilter === 'ALL' || 
      (typeFilter === 'INFLOW' && t.type === 'Inflow') || 
      (typeFilter === 'OUTFLOW' && t.type === 'Outflow');
    return matchesSearch && matchesType;
  });

  const totalInflows = transactions.filter(t => t.type === 'Inflow').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalOutflows = transactions.filter(t => t.type === 'Outflow').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const currentCashInHand = cashAccount?.currentBalance ?? (totalInflows - totalOutflows);

  const exportToCSV = () => {
    const headers = ['Date', 'Voucher Number', 'Type', 'Category', 'Party / Payer', 'Reference', 'Amount (₹)'];
    const rows = filteredTxns.map(t => [
      t.date,
      t.transactionNumber,
      t.type,
      `"${t.category || '-'}"`,
      `"${t.partyName || '-'}"`,
      `"${t.reference || '-'}"`,
      t.amount
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Cash_Journal_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('info', 'Export Successful', 'Cash Journal exported as CSV.');
  };

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6 select-none max-w-[1600px] mx-auto pb-12">
          
          {/* Top Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-emerald-500/20">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
                  <Coins className="h-3.5 w-3.5" />
                  <span>Petty Cash &amp; Vault Registry</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  Cash Journal &amp; Drawer
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
                  Real-time petty cash drawer management, walk-in counter sales collections, and daily expense disbursements.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => fetchTransactions()}
                  title="Refresh Cash Register"
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

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    onClick={() => handleOpenModal('Inflow')}
                    className="h-11 px-4 rounded-2xl font-bold shadow-lg shadow-emerald-500/25 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white cursor-pointer border-0 flex items-center gap-2"
                  >
                    <ArrowDownLeft className="h-4 w-4" />
                    <span>Cash In (+)</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleOpenModal('Outflow')}
                    className="h-11 px-4 rounded-2xl font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white cursor-pointer flex items-center gap-2"
                  >
                    <ArrowUpRight className="h-4 w-4 text-rose-300" />
                    <span>Cash Out (-)</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="relative overflow-hidden p-6 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Wallet className="h-6 w-6" />
                </div>
                <Badge variant="success" className="font-mono text-xs">
                  Physical Drawer
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Cash in Hand</span>
                <p className="text-3xl font-black text-foreground mt-1 font-mono tracking-tight">
                  ₹{Number(currentCashInHand).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Verified in Main Cash Ledger
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden p-6 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <ArrowDownLeft className="h-6 w-6" />
                </div>
                <Badge variant="success" className="font-mono text-xs">
                  Receipts
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Cash Receipts (+)</span>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono tracking-tight">
                  ₹{totalInflows.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">Direct sales, collections &amp; deposits</p>
              </div>
            </div>

            <div className="relative overflow-hidden p-6 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Send className="h-5 w-5" />
                </div>
                <Badge variant="destructive" className="font-mono text-xs">
                  Disbursements
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Cash Payments (-)</span>
                <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono tracking-tight">
                  ₹{totalOutflows.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">Petty expenses, vendor cash &amp; utility</p>
              </div>
            </div>
          </div>

          {/* Filter, Search & Tabs */}
          <div className="p-4 rounded-3xl bg-card border border-border/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search voucher, party, category or remarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-muted/30 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center bg-muted/40 p-1 rounded-2xl border border-border">
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === 'ALL'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Records ({transactions.length})
              </button>
              <button
                onClick={() => setTypeFilter('INFLOW')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  typeFilter === 'INFLOW'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'
                }`}
              >
                <ArrowDownLeft className="h-3.5 w-3.5" /> Cash Inflows
              </button>
              <button
                onClick={() => setTypeFilter('OUTFLOW')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  typeFilter === 'OUTFLOW'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-rose-600 dark:text-rose-400 hover:text-rose-700'
                }`}
              >
                <ArrowUpRight className="h-3.5 w-3.5" /> Cash Outflows
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border/60 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-emerald-500" />
                <h3 className="font-bold text-sm text-foreground">Cash Book Transactions</h3>
                <Badge variant="secondary" className="font-mono text-xs">
                  {filteredTxns.length} entries
                </Badge>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-extrabold">
                  <tr>
                    <th className="py-4 px-5">Date &amp; Voucher</th>
                    <th className="py-4 px-5">Category &amp; Head</th>
                    <th className="py-4 px-5">Party / Recipient</th>
                    <th className="py-4 px-5">Reference</th>
                    <th className="py-4 px-5 text-right">Cash Received (+)</th>
                    <th className="py-4 px-5 text-right">Cash Paid (-)</th>
                    <th className="py-4 px-5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="h-7 w-7 animate-spin rounded-full border-3 border-emerald-500 border-t-transparent" />
                          <span className="text-xs font-semibold">Loading Cash Journal...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTxns.length > 0 ? (
                    filteredTxns.map((t) => (
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
                          <span className="font-bold text-foreground text-xs block">{t.category || 'General Cash Entry'}</span>
                          <span className="text-[11px] text-muted-foreground truncate max-w-[200px] block">
                            {t.description || 'Cash Account'}
                          </span>
                        </td>

                        <td className="py-3.5 px-5">
                          <span className="font-semibold text-foreground text-xs">{t.partyName || 'Cash Counter Customer'}</span>
                        </td>

                        <td className="py-3.5 px-5 font-mono text-[11px] text-muted-foreground">
                          {t.reference || '—'}
                        </td>

                        <td className="py-3.5 px-5 text-right font-mono font-bold">
                          {t.type === 'Inflow' ? (
                            <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-lg">
                              +₹{Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-5 text-right font-mono font-bold">
                          {t.type === 'Outflow' ? (
                            <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1 rounded-lg">
                              -₹{Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-5 text-center">
                          <Badge variant="success" className="text-[10px] py-0.5 px-2 font-semibold">
                            Completed
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Banknote className="h-10 w-10 text-muted-foreground/30 stroke-1" />
                          <p className="font-bold text-sm text-foreground">No Cash Entries Found</p>
                          <p className="text-xs text-muted-foreground">No transactions match your current search criteria.</p>
                          <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={() => handleOpenModal('Inflow')} 
                            className="mt-3 rounded-xl gap-2 font-bold cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Plus className="h-3.5 w-3.5" /> Record Cash Inflow
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Record Cash Modal */}
          <Modal
            isOpen={recordModalOpen}
            onClose={() => !isSaving && setRecordModalOpen(false)}
            title={`Record Cash ${txnType === 'Inflow' ? 'Receipt / Inflow' : 'Payment / Outflow'}`}
            description="Log instantaneous physical cash movement into or out of the main cashier drawer."
            size="md"
          >
            <form onSubmit={handleRecordTxn} className="space-y-4">
              
              {/* Inflow / Outflow Switch */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-muted/40 rounded-2xl border border-border">
                <button
                  type="button"
                  onClick={() => {
                    setTxnType('Inflow');
                    setCategory('Cash Sales Revenue');
                  }}
                  className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    txnType === 'Inflow'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ArrowDownLeft className="h-4 w-4" /> Cash Inflow (+)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTxnType('Outflow');
                    setCategory('Office Petty Expense');
                  }}
                  className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    txnType === 'Outflow'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ArrowUpRight className="h-4 w-4" /> Cash Outflow (-)
                </button>
              </div>

              {/* Amount & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-sm font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Category Head *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-card px-4 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
                  >
                    {txnType === 'Inflow' ? (
                      <>
                        <option value="Cash Sales Revenue">Cash Sales Revenue</option>
                        <option value="Customer Debt Collection">Customer Debt Collection</option>
                        <option value="Owner Capital Contribution">Owner Capital Contribution</option>
                        <option value="Cash Bank Withdrawal Deposit">Bank Withdrawal to Cash</option>
                        <option value="Miscellaneous Receipt">Miscellaneous Receipt</option>
                      </>
                    ) : (
                      <>
                        <option value="Office Petty Expense">Office Petty Expense</option>
                        <option value="Tea & Refreshments">Tea &amp; Refreshments</option>
                        <option value="Stationery & Courier">Stationery &amp; Courier</option>
                        <option value="Supplier Cash Settlement">Supplier Cash Settlement</option>
                        <option value="Cash Deposit to Bank">Cash Deposit to Bank</option>
                        <option value="Employee Advance">Employee Advance</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Party & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">
                    {txnType === 'Inflow' ? 'Customer / Payer Name' : 'Recipient / Vendor Name'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Walk-in Customer"
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Cash Memo / Bill No</label>
                  <input
                    type="text"
                    placeholder="e.g. MEMO-9012"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Narration / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Notes about this cash movement..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-border bg-muted/20 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRecordModalOpen(false)}
                  disabled={isSaving}
                  className="rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSaving}
                  className="rounded-xl font-bold px-6 shadow-md cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                >
                  {isSaving ? 'Posting...' : `Post Cash ${txnType === 'Inflow' ? 'Receipt' : 'Payment'}`}
                </Button>
              </div>
            </form>
          </Modal>

        </div>
      </PageContainer>
    </AppShell>
  );
}