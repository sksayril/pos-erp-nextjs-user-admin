'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { useToastStore } from '../../../lib/store';
import { 
  Building2, Plus, Search, Filter, 
  Trash2, Edit3, ArrowUpRight, ArrowDownRight, RefreshCw, 
  CheckCircle2, ShieldAlert, BookOpen, Layers, Download,
  Wallet, Landmark, TrendingUp, TrendingDown, Scale
} from 'lucide-react';

const TYPE_CONFIG: Record<string, { label: string; color: string; badge: any; icon: any }> = {
  Asset: { label: 'Assets', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20', badge: 'success', icon: Wallet },
  Liability: { label: 'Liabilities', color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20', badge: 'destructive', icon: Scale },
  Equity: { label: 'Equity', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20', badge: 'secondary', icon: Building2 },
  Revenue: { label: 'Revenue', color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20', badge: 'info', icon: TrendingUp },
  Expense: { label: 'Expenses', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20', badge: 'warning', icon: TrendingDown },
};

export default function AccountsPage() {
  const { addToast } = useToastStore();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('Asset');
  const [subtype, setSubtype] = useState('Current Asset');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [description, setDescription] = useState('');

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/accounting/accounts');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAccounts(data);
      }
    } catch (err) {
      addToast('error', 'Fetch Error', 'Failed to retrieve accounts from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('warning', 'Missing Name', 'Account Name is required.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/accounting/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim(),
          type,
          subtype,
          openingBalance: Number(openingBalance) || 0,
          bankName: bankName.trim() || undefined,
          accountNumber: accountNumber.trim() || undefined,
          description: description.trim()
        })
      });

      if (res.ok) {
        addToast('success', 'Account Created', `${name} added to Chart of Accounts.`);
        setCreateModalOpen(false);
        setName('');
        setCode('');
        setOpeningBalance('0');
        setDescription('');
        fetchAccounts();
      } else {
        const errorData = await res.json();
        addToast('error', 'Creation Error', errorData.error || 'Failed to create account.');
      }
    } catch {
      addToast('error', 'Network Error', 'Failed to connect to the server.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/accounting/accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editAccount)
      });
      const updated = await res.json();
      if (res.ok) {
        setAccounts(prev => prev.map(a => a._id === updated._id ? updated : a));
        addToast('success', 'Saved', `${updated.name} updated.`);
        setEditAccount(null);
      }
    } catch {
      addToast('error', 'Error', 'Failed to update account.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (acc: any) => {
    try {
      const res = await fetch(`/api/accounting/accounts?id=${acc._id}`, { method: 'DELETE' });
      if (res.ok) {
        setAccounts(prev => prev.filter(a => a._id !== acc._id));
        addToast('success', 'Deleted', `${acc.name} removed from accounts.`);
      }
    } catch {
      addToast('error', 'Error', 'Failed to delete account.');
    }
  };

  // Filter list
  const filteredAccounts = accounts.filter((acc) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || acc.name?.toLowerCase().includes(q) || acc.code?.toLowerCase().includes(q) || acc.subtype?.toLowerCase().includes(q);
    const matchesType = typeFilter === 'all' || acc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalAssets = accounts.filter(a => a.type === 'Asset').reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);
  const totalLiabilities = accounts.filter(a => a.type === 'Liability').reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);
  const totalEquity = accounts.filter(a => a.type === 'Equity').reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);

  const exportToCSV = () => {
    const headers = ['Account Code', 'Account Name', 'Type', 'Subtype', 'Opening Balance', 'Current Balance'];
    const rows = filteredAccounts.map(a => [
      `"${a.code || '-'}"`,
      `"${a.name}"`,
      a.type,
      `"${a.subtype || '-'}"`,
      a.openingBalance || 0,
      a.currentBalance || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Chart_of_Accounts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('info', 'Export Successful', 'Chart of accounts downloaded as CSV.');
  };

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6 select-none max-w-[1600px] mx-auto pb-12">
          
          {/* Top Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-purple-500/20">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold backdrop-blur-md">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>General Ledger Chart of Accounts (COA)</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  Accounts &amp; Head Master
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
                  Enterprise double-entry ledger accounts: Assets, Liabilities, Equities, Incomes and Operational Expenses.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => fetchAccounts()}
                  title="Refresh Accounts"
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
                  onClick={() => setCreateModalOpen(true)}
                  className="h-11 px-5 rounded-2xl font-bold shadow-lg shadow-purple-500/25 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white cursor-pointer border-0 flex items-center gap-2"
                >
                  <Plus className="h-4.5 w-4.5" />
                  <span>Add New Account</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Metric Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="relative overflow-hidden p-6 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Wallet className="h-6 w-6" />
                </div>
                <Badge variant="success" className="font-mono text-xs">
                  Asset Value
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Assets</span>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono tracking-tight">
                  ₹{totalAssets.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">Bank, Cash, Inventory &amp; Debtors</p>
              </div>
            </div>

            <div className="relative overflow-hidden p-6 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Scale className="h-6 w-6" />
                </div>
                <Badge variant="destructive" className="font-mono text-xs">
                  Liabilities
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Liabilities</span>
                <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono tracking-tight">
                  ₹{totalLiabilities.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">Trade Payables &amp; Short-term Debts</p>
              </div>
            </div>

            <div className="relative overflow-hidden p-6 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Building2 className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  Net Worth
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Owner&apos;s Equity</span>
                <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1 font-mono tracking-tight">
                  ₹{totalEquity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">Retained Earnings &amp; Capital</p>
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
                placeholder="Search by code, account name or subtype..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-muted/30 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            {/* Type Filter Tabs */}
            <div className="flex flex-wrap items-center bg-muted/40 p-1 rounded-2xl border border-border">
              {['all', 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].map((cat) => {
                const isSelected = typeFilter === cat;
                const count = cat === 'all' ? accounts.length : accounts.filter(a => a.type === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setTypeFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>{cat === 'all' ? 'All' : cat}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-muted font-mono">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accounts List Table */}
          <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border/60 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-purple-500" />
                <h3 className="font-bold text-sm text-foreground">Chart of Accounts Ledger</h3>
                <Badge variant="secondary" className="font-mono text-xs">
                  {filteredAccounts.length} heads
                </Badge>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-extrabold">
                  <tr>
                    <th className="py-4 px-5">Code</th>
                    <th className="py-4 px-5">Account Name</th>
                    <th className="py-4 px-5">Classification</th>
                    <th className="py-4 px-5">Subtype</th>
                    <th className="py-4 px-5 text-right">Opening Balance</th>
                    <th className="py-4 px-5 text-right">Current Balance</th>
                    <th className="py-4 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="h-7 w-7 animate-spin rounded-full border-3 border-purple-500 border-t-transparent" />
                          <span className="text-xs font-semibold">Loading Chart of Accounts...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredAccounts.length > 0 ? (
                    filteredAccounts.map((acc) => {
                      const cfg = TYPE_CONFIG[acc.type] || TYPE_CONFIG.Asset;
                      const Icon = cfg.icon;
                      return (
                        <tr key={acc._id || acc.code} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-5 font-mono font-bold text-foreground">
                            {acc.code || '—'}
                          </td>

                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-2.5">
                              <div className={`h-7 w-7 rounded-xl flex items-center justify-center ${cfg.color} shrink-0`}>
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <span className="font-bold text-foreground text-xs block">{acc.name}</span>
                                {acc.bankName && (
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    {acc.bankName} • A/C: {acc.accountNumber || '—'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-5">
                            <Badge variant={cfg.badge} className="text-[10px] py-0.5 px-2 font-bold">
                              {acc.type}
                            </Badge>
                          </td>

                          <td className="py-3.5 px-5 text-muted-foreground text-xs">
                            {acc.subtype || 'General'}
                          </td>

                          <td className="py-3.5 px-5 text-right font-mono text-muted-foreground">
                            ₹{Number(acc.openingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="py-3.5 px-5 text-right font-mono font-black text-xs text-foreground">
                            ₹{Number(acc.currentBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="py-3.5 px-5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setEditAccount({ ...acc })}
                                title="Edit Account"
                                className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white border border-amber-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                              >
                                <Edit3 className="h-4.5 w-4.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(acc)}
                                title="Delete Account"
                                className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <BookOpen className="h-10 w-10 text-muted-foreground/30 stroke-1" />
                          <p className="font-bold text-sm text-foreground">No Accounts Found</p>
                          <p className="text-xs text-muted-foreground">No accounts match your filter criteria.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create Modal */}
          <Modal
            isOpen={createModalOpen}
            onClose={() => !isSaving && setCreateModalOpen(false)}
            title="Create New Ledger Account"
            description="Add a new account head to your double-entry Chart of Accounts."
            size="md"
          >
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Account Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Axis Bank Corporate"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Account Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 1040"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Classification Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-card px-4 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  >
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Subtype / Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Bank Account or Current Asset"
                    value={subtype}
                    onChange={(e) => setSubtype(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Opening Balance (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={isSaving}
                  className="rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSaving}
                  className="rounded-xl font-bold px-6 shadow-md cursor-pointer bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                >
                  {isSaving ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Edit Modal */}
          {editAccount && (
            <Modal
              isOpen={true}
              onClose={() => !isSaving && setEditAccount(null)}
              title={`Edit Account: ${editAccount.name}`}
              size="md"
            >
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Account Name *</label>
                  <input
                    type="text"
                    required
                    value={editAccount.name}
                    onChange={(e) => setEditAccount({ ...editAccount, name: e.target.value })}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Account Code</label>
                    <input
                      type="text"
                      value={editAccount.code || ''}
                      onChange={(e) => setEditAccount({ ...editAccount, code: e.target.value })}
                      className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Subtype</label>
                    <input
                      type="text"
                      value={editAccount.subtype || ''}
                      onChange={(e) => setEditAccount({ ...editAccount, subtype: e.target.value })}
                      className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditAccount(null)}
                    disabled={isSaving}
                    className="rounded-xl cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSaving}
                    className="rounded-xl font-bold px-6 shadow-md cursor-pointer"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
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