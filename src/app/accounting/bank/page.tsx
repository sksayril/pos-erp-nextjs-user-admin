'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { useToastStore } from '../../../lib/store';
import { 
  CreditCard, Plus, ArrowUpRight, ArrowDownRight, Search, 
  Filter, Building2, RefreshCw, CheckCircle2, ShieldCheck,
  Send, ArrowDownLeft, Wallet, Landmark, Eye, Download, Printer
} from 'lucide-react';

const BANK_THEMES = [
  {
    bg: 'from-slate-900 via-indigo-950 to-slate-900 text-white border-indigo-500/30 shadow-indigo-500/10',
    accent: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
    glow: 'from-indigo-500/20 to-transparent'
  },
  {
    bg: 'from-slate-900 via-emerald-950 to-slate-900 text-white border-emerald-500/30 shadow-emerald-500/10',
    accent: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    glow: 'from-emerald-500/20 to-transparent'
  },
  {
    bg: 'from-slate-900 via-cyan-950 to-slate-900 text-white border-cyan-500/30 shadow-cyan-500/10',
    accent: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
    glow: 'from-cyan-500/20 to-transparent'
  },
  {
    bg: 'from-slate-900 via-purple-950 to-slate-900 text-white border-purple-500/30 shadow-purple-500/10',
    accent: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
    glow: 'from-purple-500/20 to-transparent'
  }
];

export default function BankJournalPage() {
  const { addToast } = useToastStore();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | 'INFLOW' | 'OUTFLOW'>('ALL');

  // Modal
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [txnType, setTxnType] = useState<'Inflow' | 'Outflow'>('Inflow');
  const [bankName, setBankName] = useState('HDFC Corporate Current Account');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [partyName, setPartyName] = useState('');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchBankData = async () => {
    setLoading(true);
    try {
      const [txRes, accRes] = await Promise.all([
        fetch('/api/accounting/transactions?type=Bank'),
        fetch('/api/accounting/accounts')
      ]);

      const txData = await txRes.json();
      const accData = await accRes.json();

      if (Array.isArray(txData)) setTransactions(txData);
      if (Array.isArray(accData)) {
        // Only actual bank accounts (exclude Accounts Receivable / Payable)
        const banks = accData.filter(a => 
          a.subtype === 'Bank Account' || 
          (a.type === 'Asset' && !a.name.toLowerCase().includes('receivable') && !a.name.toLowerCase().includes('debtor') && (
            a.name.toLowerCase().includes('bank') || 
            a.name.toLowerCase().includes('hdfc') || 
            a.name.toLowerCase().includes('sbi') || 
            a.name.toLowerCase().includes('icici') || 
            a.name.toLowerCase().includes('axis') ||
            a.name.toLowerCase().includes('corporate account')
          ))
        );
        setBankAccounts(banks);
        if (banks.length > 0 && !bankName) setBankName(banks[0].name);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankData();
  }, []);

  const handleOpenModal = (type: 'Inflow' | 'Outflow', targetBank?: string) => {
    setTxnType(type);
    if (targetBank) setBankName(targetBank);
    setDepositModalOpen(true);
  };

  const handleRecordBankTxn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      addToast('warning', 'Invalid Amount', 'Please enter a valid transfer amount.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/accounting/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountType: 'Bank',
          accountName: bankName,
          type: txnType,
          amount: Number(amount),
          category: txnType === 'Inflow' ? 'Bank Deposit / Customer Credit' : 'Vendor Wire / Operating Outflow',
          partyName: partyName.trim() || undefined,
          paymentMethod,
          reference: reference.trim() || undefined,
          description: description.trim()
        })
      });

      if (res.ok) {
        addToast('success', 'Bank Entry Confirmed', `Successfully recorded ${txnType} of ₹${Number(amount).toLocaleString('en-IN')} for ${bankName}.`);
        setDepositModalOpen(false);
        setAmount('');
        setPartyName('');
        setReference('');
        setDescription('');
        fetchBankData();
      } else {
        const errorData = await res.json();
        addToast('error', 'Error Recording Entry', errorData.error || 'Failed to save transaction.');
      }
    } catch {
      addToast('error', 'Network Error', 'Failed to connect to the server.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter list
  const filteredTxns = transactions.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      t.partyName?.toLowerCase().includes(q) || 
      t.accountName?.toLowerCase().includes(q) || 
      t.reference?.toLowerCase().includes(q) || 
      t.transactionNumber?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q);
    const matchesBank = selectedBank === 'all' || t.accountName === selectedBank;
    const matchesType = selectedTypeFilter === 'ALL' || 
      (selectedTypeFilter === 'INFLOW' && t.type === 'Inflow') ||
      (selectedTypeFilter === 'OUTFLOW' && t.type === 'Outflow');
    return matchesSearch && matchesBank && matchesType;
  });

  const totalBankInflows = transactions.filter(t => t.type === 'Inflow').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalBankOutflows = transactions.filter(t => t.type === 'Outflow').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalBankBalance = bankAccounts.reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);

  const exportToCSV = () => {
    const headers = ['Date', 'Txn Number', 'Bank Account', 'Party', 'Reference', 'Mode', 'Type', 'Amount'];
    const rows = filteredTxns.map(t => [
      t.date,
      t.transactionNumber,
      `"${t.accountName}"`,
      `"${t.partyName || '-'}"`,
      `"${t.reference || '-'}"`,
      t.paymentMethod,
      t.type,
      t.amount
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bank_Journal_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('info', 'Export Successful', 'Bank Journal downloaded as CSV.');
  };

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6 select-none max-w-[1600px] mx-auto pb-12">
          
          {/* Top Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
                  <Landmark className="h-3.5 w-3.5" />
                  <span>Corporate Banking &amp; Treasury</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  Bank Journal &amp; Accounts
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
                  Real-time synchronization for corporate checking, RTGS/NEFT wires, online merchant gateways, and vendor settlements.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => fetchBankData()}
                  title="Refresh Data"
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
                  onClick={() => handleOpenModal('Inflow')}
                  className="h-11 px-5 rounded-2xl font-bold shadow-lg shadow-indigo-500/25 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white cursor-pointer border-0 flex items-center gap-2"
                >
                  <Plus className="h-4.5 w-4.5" />
                  <span>Record Bank Entry</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Metric KPI Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="relative overflow-hidden p-6 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Landmark className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {bankAccounts.length} Connected Accounts
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Liquid Bank Balance</span>
                <p className="text-3xl font-black text-foreground mt-1 font-mono tracking-tight">
                  ₹{totalBankBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Fully balanced with General Ledger
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden p-6 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ArrowDownLeft className="h-6 w-6" />
                </div>
                <Badge variant="success" className="font-mono text-xs flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" /> Inflow
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Bank Receipts (+)</span>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono tracking-tight">
                  ₹{totalBankInflows.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">Customer RTGS, NEFT, UPI &amp; Cheques</p>
              </div>
            </div>

            <div className="relative overflow-hidden p-6 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Send className="h-5 w-5" />
                </div>
                <Badge variant="destructive" className="font-mono text-xs flex items-center gap-1">
                  <ArrowDownRight className="h-3 w-3" /> Outflow
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Withdrawals &amp; Wires (-)</span>
                <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono tracking-tight">
                  ₹{totalBankOutflows.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">Vendor settlements, payroll &amp; charges</p>
              </div>
            </div>
          </div>

          {/* Premium Bank Virtual Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-foreground tracking-tight">Corporate Bank Cards</h3>
                <p className="text-xs text-muted-foreground">Select an account to view dedicated statements or record swift funds.</p>
              </div>
              <Badge variant="outline" className="font-medium text-xs">
                Active Banking Nodes
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {bankAccounts.map((b, idx) => {
                const theme = BANK_THEMES[idx % BANK_THEMES.length];
                const isSelected = selectedBank === b.name;

                return (
                  <div
                    key={b._id || b.code || idx}
                    onClick={() => setSelectedBank(selectedBank === b.name ? 'all' : b.name)}
                    className={`relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br ${theme.bg} border shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02] ${
                      isSelected ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900 shadow-2xl' : ''
                    }`}
                  >
                    {/* Chip & Brand */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* Golden Chip */}
                        <div className="w-10 h-7 rounded-lg bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/50 shadow-inner flex items-center justify-center">
                          <div className="w-6 h-4 border border-amber-700/30 rounded-xs opacity-70" />
                        </div>
                        <span className="text-[11px] font-mono tracking-widest text-slate-400 uppercase">
                          {b.bankName || 'BANK'}
                        </span>
                      </div>

                      <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md ${theme.accent}`}>
                        {isSelected ? '✓ Selected' : 'Active'}
                      </div>
                    </div>

                    {/* Account Name & Masked Number */}
                    <div className="mt-5 space-y-1">
                      <h4 className="text-base font-bold text-white tracking-wide truncate">
                        {b.name}
                      </h4>
                      <p className="text-xs font-mono text-slate-400 tracking-wider">
                        •••• •••• {b.accountNumber ? b.accountNumber.slice(-4) : '9211'}
                      </p>
                    </div>

                    {/* Balance */}
                    <div className="mt-6 pt-4 border-t border-white/10 flex items-end justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Available Balance</span>
                        <p className="text-xl font-black text-white font-mono tracking-tight mt-0.5">
                          ₹{Number(b.currentBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenModal('Inflow', b.name)}
                          title="Deposit Funds"
                          className="h-8 w-8 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-400/30 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal('Outflow', b.name)}
                          title="Withdraw / Wire Funds"
                          className="h-8 w-8 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-400/30 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filter, Search & Tabs */}
          <div className="p-4 rounded-3xl bg-card border border-border/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search transaction number, party, bank or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-muted/30 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            {/* Type Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center bg-muted/40 p-1 rounded-2xl border border-border">
                <button
                  onClick={() => setSelectedTypeFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedTypeFilter === 'ALL'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All Entries ({transactions.length})
                </button>
                <button
                  onClick={() => setSelectedTypeFilter('INFLOW')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    selectedTypeFilter === 'INFLOW'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'
                  }`}
                >
                  <ArrowDownLeft className="h-3 w-3" /> Receipts
                </button>
                <button
                  onClick={() => setSelectedTypeFilter('OUTFLOW')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    selectedTypeFilter === 'OUTFLOW'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-rose-600 dark:text-rose-400 hover:text-rose-700'
                  }`}
                >
                  <ArrowUpRight className="h-3 w-3" /> Wires
                </button>
              </div>

              {/* Bank Selector */}
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="h-11 rounded-2xl border border-border bg-card px-4 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                <option value="all">All Bank Accounts</option>
                {bankAccounts.map((b) => (
                  <option key={b._id || b.code} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Transactions Register Table */}
          <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border/60 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Bank Ledger Entries</h3>
                <Badge variant="secondary" className="font-mono text-xs">
                  {filteredTxns.length} records
                </Badge>
              </div>

              {selectedBank !== 'all' && (
                <button
                  onClick={() => setSelectedBank('all')}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  Clear Bank Filter
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-extrabold">
                  <tr>
                    <th className="py-4 px-5">Date &amp; Voucher</th>
                    <th className="py-4 px-5">Bank Account</th>
                    <th className="py-4 px-5">Party / Beneficiary</th>
                    <th className="py-4 px-5">Payment Mode</th>
                    <th className="py-4 px-5">Reference / UTR</th>
                    <th className="py-4 px-5 text-right">Inflow (+)</th>
                    <th className="py-4 px-5 text-right">Outflow (-)</th>
                    <th className="py-4 px-5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="h-7 w-7 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                          <span className="text-xs font-semibold">Synchronizing Bank Records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTxns.length > 0 ? (
                    filteredTxns.map((t) => (
                      <tr key={t._id || t.transactionNumber} className="hover:bg-muted/30 transition-colors group">
                        <td className="py-3.5 px-5">
                          <span className="font-mono font-bold text-foreground block text-xs">
                            {t.transactionNumber}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {t.date}
                          </span>
                        </td>

                        <td className="py-3.5 px-5 font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                              <Landmark className="h-3.5 w-3.5" />
                            </div>
                            <span className="truncate max-w-[200px]">{t.accountName}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-5">
                          <p className="font-bold text-foreground text-xs">{t.partyName || 'Direct Bank Posting'}</p>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                            {t.description || t.category || '-'}
                          </p>
                        </td>

                        <td className="py-3.5 px-5">
                          <Badge variant="secondary" className="text-[10px] font-medium">
                            {t.paymentMethod || 'Bank Transfer'}
                          </Badge>
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
                            Reconciled
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <CreditCard className="h-10 w-10 text-muted-foreground/30 stroke-1" />
                          <p className="font-bold text-sm text-foreground">No Bank Transactions Found</p>
                          <p className="text-xs text-muted-foreground">Try adjusting your filters or record a new bank entry.</p>
                          <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={() => handleOpenModal('Inflow')} 
                            className="mt-3 rounded-xl gap-2 font-bold cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" /> Record Bank Entry
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Record Bank Transaction Modal */}
          <Modal
            isOpen={depositModalOpen}
            onClose={() => !isSaving && setDepositModalOpen(false)}
            title={`Record Bank ${txnType === 'Inflow' ? 'Deposit / Receipt' : 'Withdrawal / Wire'}`}
            description="Post dynamic credit or debit transactions directly to your corporate bank ledger."
            size="md"
          >
            <form onSubmit={handleRecordBankTxn} className="space-y-4">
              
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-muted/40 rounded-2xl border border-border">
                <button
                  type="button"
                  onClick={() => setTxnType('Inflow')}
                  className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    txnType === 'Inflow'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ArrowDownLeft className="h-4 w-4" /> Deposit / Inflow (+)
                </button>
                <button
                  type="button"
                  onClick={() => setTxnType('Outflow')}
                  className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    txnType === 'Outflow'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ArrowUpRight className="h-4 w-4" /> Wire / Outflow (-)
                </button>
              </div>

              {/* Target Bank */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Bank Account *</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full h-11 rounded-2xl border border-border bg-card px-4 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  required
                >
                  {bankAccounts.map((b) => (
                    <option key={b._id || b.code} value={b.name}>
                      {b.name} (Balance: ₹{Number(b.currentBalance || 0).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount & Mode */}
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
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-sm font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Transfer Mode</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-card px-4 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  >
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="RTGS">RTGS Wire</option>
                    <option value="IMPS">IMPS Instant</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Cheque">Cheque Deposit</option>
                    <option value="Card">Debit / Credit Card</option>
                  </select>
                </div>
              </div>

              {/* Party & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">
                    {txnType === 'Inflow' ? 'Sender / Customer' : 'Beneficiary / Vendor'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Retailers or Vendor"
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">UTR / Cheque Ref No</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR-882910384"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Narration / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional transfer notes or invoice reference..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-border bg-muted/20 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDepositModalOpen(false)}
                  disabled={isSaving}
                  className="rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSaving}
                  className="rounded-xl font-bold px-6 shadow-md cursor-pointer bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white"
                >
                  {isSaving ? 'Recording Entry...' : `Confirm ${txnType === 'Inflow' ? 'Deposit' : 'Withdrawal'}`}
                </Button>
              </div>
            </form>
          </Modal>

        </div>
      </PageContainer>
    </AppShell>
  );
}