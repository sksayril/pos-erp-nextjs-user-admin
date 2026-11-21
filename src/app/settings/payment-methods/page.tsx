'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { useToastStore } from '../../../lib/store';
import { 
  CreditCard, Plus, Edit3, Trash2, RefreshCw, 
  CheckCircle2, ShieldCheck, Search, Banknote, QrCode, Landmark, FileCheck
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  CreditCard,
  Banknote,
  QrCode,
  Landmark,
  FileCheck
};

export default function PaymentMethodsPage() {
  const { addToast } = useToastStore();
  const [methods, setMethods] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [accountLinked, setAccountLinked] = useState('Main Cash in Hand');
  const [enabledForPOS, setEnabledForPOS] = useState(true);
  const [enabledForSales, setEnabledForSales] = useState(true);
  const [fee, setFee] = useState('0');
  const [icon, setIcon] = useState('CreditCard');
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, aRes] = await Promise.all([
        fetch('/api/settings/payment-methods'),
        fetch('/api/accounting/accounts')
      ]);
      const mData = await mRes.json();
      const aData = await aRes.json();
      if (Array.isArray(mData)) setMethods(mData);
      if (Array.isArray(aData)) setAccounts(aData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditItem(null);
    setName('');
    setCode('');
    setAccountLinked(accounts[0]?.name || 'Main Cash in Hand');
    setEnabledForPOS(true);
    setEnabledForSales(true);
    setFee('0');
    setIcon('CreditCard');
    setModalOpen(true);
  };

  const handleOpenEdit = (m: any) => {
    setEditItem(m);
    setName(m.name);
    setCode(m.code);
    setAccountLinked(m.accountLinked || 'Main Cash in Hand');
    setEnabledForPOS(m.enabledForPOS ?? true);
    setEnabledForSales(m.enabledForSales ?? true);
    setFee(m.processingFeePercent?.toString() || '0');
    setIcon(m.icon || 'CreditCard');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('warning', 'Missing Name', 'Payment method name is required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim() || name.toUpperCase().replace(/\s+/g, '_'),
        accountLinked,
        enabledForPOS,
        enabledForSales,
        processingFeePercent: Number(fee) || 0,
        icon
      };

      let res;
      if (editItem) {
        res = await fetch('/api/settings/payment-methods', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ _id: editItem._id, ...payload })
        });
      } else {
        res = await fetch('/api/settings/payment-methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        addToast('success', editItem ? 'Method Updated' : 'Method Added', `${name} saved successfully.`);
        setModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        addToast('error', 'Error', err.error || 'Failed to save payment method.');
      }
    } catch {
      addToast('error', 'Network Error', 'Failed to reach server.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (m: any) => {
    try {
      const res = await fetch(`/api/settings/payment-methods?id=${m._id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Method Removed', `${m.name} deleted.`);
        fetchData();
      }
    } catch {
      addToast('error', 'Error', 'Failed to delete payment method.');
    }
  };

  const filteredMethods = methods.filter(m => {
    const q = searchQuery.toLowerCase().trim();
    return !q || m.name?.toLowerCase().includes(q) || m.code?.toLowerCase().includes(q) || m.accountLinked?.toLowerCase().includes(q);
  });

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6 select-none max-w-[1400px] mx-auto pb-12">
          
          {/* Top Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-sky-500/20">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold backdrop-blur-md">
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Omni-Channel Payment Gateways</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  Payment Methods
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
                  Configure active payment modes for POS checkout &amp; wholesale invoices with automated ledger account routing.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchData}
                  title="Reload"
                  className="h-11 w-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all cursor-pointer backdrop-blur-md"
                >
                  <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <Button
                  variant="primary"
                  onClick={handleOpenCreate}
                  className="h-11 px-6 rounded-2xl font-bold shadow-lg shadow-sky-500/25 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white cursor-pointer border-0 flex items-center gap-2"
                >
                  <Plus className="h-4.5 w-4.5" />
                  <span>Add Payment Method</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4 rounded-3xl bg-card border border-border/80 shadow-xs flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search payment mode, account or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-muted/30 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all"
              />
            </div>

            <Badge variant="secondary" className="font-mono text-xs hidden sm:inline-flex">
              {filteredMethods.length} gateways configured
            </Badge>
          </div>

          {/* Methods Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMethods.map((m) => {
              const IconComp = ICON_MAP[m.icon] || CreditCard;
              return (
                <div key={m._id || m.code} className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs hover:shadow-md transition-all space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                        <IconComp className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-foreground">{m.name}</h4>
                        <p className="text-[11px] font-mono text-muted-foreground">Code: {m.code}</p>
                      </div>
                    </div>

                    <Badge variant="success" className="text-[9px] py-0.2">
                      {m.status || 'Active'}
                    </Badge>
                  </div>

                  <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-semibold">Routed Ledger:</span>
                      <span className="font-bold text-foreground truncate max-w-[150px]">{m.accountLinked}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-semibold">POS Terminal:</span>
                      <span className={m.enabledForPOS ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-muted-foreground'}>
                        {m.enabledForPOS ? '✓ Enabled' : '✗ Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-semibold">Processing Surcharge:</span>
                      <span className="font-mono font-bold text-foreground">{m.processingFeePercent || 0}%</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5 text-sky-500" /> Auto Account Sync
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        title="Edit Method"
                        className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white border border-amber-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                      >
                        <Edit3 className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(m)}
                        title="Delete Method"
                        className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal */}
          <Modal
            isOpen={modalOpen}
            onClose={() => !isSaving && setModalOpen(false)}
            title={editItem ? 'Edit Payment Method' : 'Configure Payment Method'}
            size="md"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Method Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Razorpay Online / QR"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Code Identifier</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI_GATEWAY"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Processing Fee (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Destination Accounting Head *</label>
                <select
                  value={accountLinked}
                  onChange={(e) => setAccountLinked(e.target.value)}
                  className="w-full h-11 rounded-2xl border border-border bg-card px-4 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/40 cursor-pointer"
                  required
                >
                  {accounts.map(a => (
                    <option key={a._id || a.name} value={a.name}>
                      {a.name} ({a.type}) — Bal: ₹{Number(a.currentBalance || 0).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 p-3 rounded-2xl border border-border bg-muted/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabledForPOS}
                    onChange={(e) => setEnabledForPOS(e.target.checked)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span className="text-xs font-bold text-foreground">Enable in POS Terminal</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-2xl border border-border bg-muted/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabledForSales}
                    onChange={(e) => setEnabledForSales(e.target.checked)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span className="text-xs font-bold text-foreground">Enable in Sales Invoices</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  disabled={isSaving}
                  className="rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSaving}
                  className="rounded-xl font-bold px-6 shadow-md cursor-pointer bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white"
                >
                  {isSaving ? 'Saving...' : 'Save Method'}
                </Button>
              </div>
            </form>
          </Modal>

        </div>
      </PageContainer>
    </AppShell>
  );
}