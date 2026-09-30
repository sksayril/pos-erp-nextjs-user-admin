'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { useToastStore } from '../../../lib/store';
import { 
  Percent, Plus, Edit3, Trash2, RefreshCw, 
  CheckCircle2, ShieldCheck, Search, Scale
} from 'lucide-react';

export default function TaxSettingsPage() {
  const { addToast } = useToastStore();
  const [taxes, setTaxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [name, setName] = useState('');
  const [rate, setRate] = useState('18');
  const [code, setCode] = useState('');
  const [type, setType] = useState('CGST+SGST');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchTaxes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/tax');
      const data = await res.json();
      if (Array.isArray(data)) setTaxes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  const handleOpenCreate = () => {
    setEditItem(null);
    setName('');
    setRate('18');
    setCode('');
    setType('CGST+SGST');
    setDescription('');
    setModalOpen(true);
  };

  const handleOpenEdit = (tax: any) => {
    setEditItem(tax);
    setName(tax.name);
    setRate(tax.rate.toString());
    setCode(tax.code);
    setType(tax.type || 'CGST+SGST');
    setDescription(tax.description || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('warning', 'Missing Name', 'Tax rate name is required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        rate: Number(rate),
        code: code.trim() || `TAX-${rate}`,
        type,
        description: description.trim()
      };

      let res;
      if (editItem) {
        res = await fetch('/api/settings/tax', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ _id: editItem._id, ...payload })
        });
      } else {
        res = await fetch('/api/settings/tax', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        addToast('success', editItem ? 'Tax Rate Updated' : 'Tax Rate Created', `${name} saved successfully.`);
        setModalOpen(false);
        fetchTaxes();
      } else {
        const err = await res.json();
        addToast('error', 'Error', err.error || 'Failed to save tax rate.');
      }
    } catch {
      addToast('error', 'Network Error', 'Failed to reach server.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (tax: any) => {
    if (!confirm(`Are you sure you want to remove ${tax.name}?`)) return;
    try {
      const res = await fetch(`/api/settings/tax?id=${tax._id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Tax Rate Deleted', `${tax.name} removed.`);
        fetchTaxes();
      }
    } catch {
      addToast('error', 'Error', 'Failed to delete tax rate.');
    }
  };

  const filteredTaxes = taxes.filter(t => {
    const q = searchQuery.toLowerCase().trim();
    return !q || t.name?.toLowerCase().includes(q) || t.code?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
  });

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6 select-none max-w-[1400px] mx-auto pb-12">
          
          {/* Top Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-teal-500/20">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold backdrop-blur-md">
                  <Percent className="h-3.5 w-3.5" />
                  <span>GST, VAT &amp; Indirect Tax Rules</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  Tax Rates Master
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
                  Manage GST slabs (0%, 5%, 12%, 18%, 28%), intra-state CGST+SGST breakups, IGST and customs duties.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchTaxes}
                  title="Reload Taxes"
                  className="h-11 w-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all cursor-pointer backdrop-blur-md"
                >
                  <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <Button
                  variant="primary"
                  onClick={handleOpenCreate}
                  className="h-11 px-6 rounded-2xl font-bold shadow-lg shadow-teal-500/25 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white cursor-pointer border-0 flex items-center gap-2"
                >
                  <Plus className="h-4.5 w-4.5" />
                  <span>Add Tax Rate</span>
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
                placeholder="Search tax slab name, percentage or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-muted/30 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
              />
            </div>

            <Badge variant="secondary" className="font-mono text-xs hidden sm:inline-flex">
              {filteredTaxes.length} tax slabs active
            </Badge>
          </div>

          {/* Tax Slabs Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTaxes.map((tax) => (
              <div key={tax._id || tax.code} className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs hover:shadow-md transition-all space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-foreground">{tax.name}</h4>
                      {tax.isDefault && (
                        <Badge variant="success" className="text-[9px] py-0.2">Default</Badge>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-muted-foreground">Code: {tax.code} • Type: {tax.type}</p>
                  </div>
                  <span className="text-2xl font-black font-mono text-teal-600 dark:text-teal-400">
                    {tax.rate}%
                  </span>
                </div>

                <p className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-xl border border-border/40">
                  {tax.description || 'Standard applicable sales tax on goods and services.'}
                </p>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-teal-500" /> Active in POS &amp; Sales
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(tax)}
                      title="Edit Slab"
                      className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white border border-amber-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                    >
                      <Edit3 className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(tax)}
                      title="Delete Slab"
                      className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Modal */}
          <Modal
            isOpen={modalOpen}
            onClose={() => !isSaving && setModalOpen(false)}
            title={editItem ? 'Edit Tax Rate' : 'Add New GST / Tax Slab'}
            size="md"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Tax Slab Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GST 18% (Standard High)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Percentage Rate (%) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    placeholder="18"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-sm font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Tax Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GST18"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Tax Structure Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full h-11 rounded-2xl border border-border bg-card px-4 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40 cursor-pointer"
                >
                  <option value="CGST+SGST">CGST + SGST (Intra-state Split)</option>
                  <option value="IGST">IGST (Inter-state Integrated)</option>
                  <option value="Flat">Flat VAT / Sales Tax</option>
                  <option value="Exempt">Exempt / Zero Rated</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Description / Applicability</label>
                <textarea
                  rows={2}
                  placeholder="Notes about which items fall under this slab..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-border bg-muted/20 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                />
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
                  className="rounded-xl font-bold px-6 shadow-md cursor-pointer bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white"
                >
                  {isSaving ? 'Saving...' : 'Save Tax Slab'}
                </Button>
              </div>
            </form>
          </Modal>

        </div>
      </PageContainer>
    </AppShell>
  );
}