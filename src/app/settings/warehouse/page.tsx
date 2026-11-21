'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { useToastStore } from '../../../lib/store';
import { 
  Building2, Plus, Edit3, Trash2, RefreshCw, 
  MapPin, Phone, Mail, Box, ShieldCheck, Search, CheckCircle2
} from 'lucide-react';

export default function WarehouseSettingsPage() {
  const { addToast } = useToastStore();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [managerName, setManagerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [capacity, setCapacity] = useState('50,000 Units');
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/warehouse');
      const data = await res.json();
      if (Array.isArray(data)) setWarehouses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleOpenCreate = () => {
    setEditItem(null);
    setName('');
    setCode(`WH-0${warehouses.length + 1}`);
    setManagerName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('Kolkata');
    setState('West Bengal');
    setPincode('');
    setCapacity('50,000 Units');
    setIsDefault(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (wh: any) => {
    setEditItem(wh);
    setName(wh.name);
    setCode(wh.code);
    setManagerName(wh.managerName || '');
    setPhone(wh.phone || '');
    setEmail(wh.email || '');
    setAddress(wh.address || '');
    setCity(wh.city || '');
    setState(wh.state || '');
    setPincode(wh.pincode || '');
    setCapacity(wh.capacity || '50,000 Units');
    setIsDefault(wh.isDefault || false);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('warning', 'Missing Name', 'Warehouse name is required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim() || `WH-${Date.now().toString().slice(-3)}`,
        managerName: managerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        capacity: capacity.trim(),
        isDefault
      };

      let res;
      if (editItem) {
        res = await fetch('/api/settings/warehouse', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ _id: editItem._id, ...payload })
        });
      } else {
        res = await fetch('/api/settings/warehouse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        addToast('success', editItem ? 'Warehouse Updated' : 'Warehouse Added', `${name} saved successfully.`);
        setModalOpen(false);
        fetchWarehouses();
      } else {
        const err = await res.json();
        addToast('error', 'Error', err.error || 'Failed to save warehouse.');
      }
    } catch {
      addToast('error', 'Network Error', 'Failed to reach server.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (wh: any) => {
    try {
      const res = await fetch(`/api/settings/warehouse?id=${wh._id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Warehouse Deleted', `${wh.name} removed.`);
        fetchWarehouses();
      }
    } catch {
      addToast('error', 'Error', 'Failed to delete warehouse.');
    }
  };

  const filteredWarehouses = warehouses.filter(w => {
    const q = searchQuery.toLowerCase().trim();
    return !q || w.name?.toLowerCase().includes(q) || w.code?.toLowerCase().includes(q) || w.city?.toLowerCase().includes(q) || w.managerName?.toLowerCase().includes(q);
  });

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6 select-none max-w-[1400px] mx-auto pb-12">
          
          {/* Top Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-amber-500/20">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold backdrop-blur-md">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Multi-Warehouse &amp; Depot Logistics</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  Warehouse Settings
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
                  Manage multiple physical warehouses, storage hubs, depot in-charges, capacities, and default dispatch locations.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchWarehouses}
                  title="Reload"
                  className="h-11 w-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all cursor-pointer backdrop-blur-md"
                >
                  <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <Button
                  variant="primary"
                  onClick={handleOpenCreate}
                  className="h-11 px-6 rounded-2xl font-bold shadow-lg shadow-amber-500/25 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white cursor-pointer border-0 flex items-center gap-2"
                >
                  <Plus className="h-4.5 w-4.5" />
                  <span>Add Warehouse</span>
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
                placeholder="Search warehouse code, name, city or manager..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-muted/30 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
              />
            </div>

            <Badge variant="secondary" className="font-mono text-xs hidden sm:inline-flex">
              {filteredWarehouses.length} active hubs
            </Badge>
          </div>

          {/* Warehouse Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredWarehouses.map((wh) => (
              <div key={wh._id || wh.code} className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs hover:shadow-md transition-all space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-foreground">{wh.name}</h4>
                        {wh.isDefault && (
                          <Badge variant="success" className="text-[9px] py-0.2">Default</Badge>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground">Code: {wh.code}</p>
                    </div>
                  </div>

                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {wh.capacity || '50K Units'}
                  </Badge>
                </div>

                <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 space-y-1 text-xs">
                  <p className="text-foreground font-semibold flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{wh.address || 'Industrial Area'}, {wh.city || 'Kolkata'}</span>
                  </p>
                  {wh.managerName && (
                    <p className="text-muted-foreground text-[11px] flex items-center gap-1.5">
                      <Box className="h-3.5 w-3.5 shrink-0" />
                      <span>Incharge: <strong className="text-foreground">{wh.managerName}</strong></span>
                    </p>
                  )}
                  {wh.phone && (
                    <p className="text-muted-foreground text-[11px] font-mono flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{wh.phone}</span>
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Active Inventory Node
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(wh)}
                      title="Edit Warehouse"
                      className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white border border-amber-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                    >
                      <Edit3 className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(wh)}
                      title="Delete Warehouse"
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
            title={editItem ? 'Edit Warehouse Depot' : 'Add New Warehouse Location'}
            size="md"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Warehouse Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. West Regional Hub"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Warehouse Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WH-04"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Manager / Incharge</label>
                  <input
                    type="text"
                    placeholder="e.g. Amitava Sen"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Helpline Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98300 44211"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Street Address</label>
                <input
                  type="text"
                  placeholder="Plot 12, Industrial Area, Sector V"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">City</label>
                  <input
                    type="text"
                    placeholder="Kolkata"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">State</label>
                  <input
                    type="text"
                    placeholder="West Bengal"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Capacity</label>
                  <input
                    type="text"
                    placeholder="100,000 Units"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 p-3 rounded-2xl border border-border bg-muted/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded accent-primary"
                />
                <span className="text-xs font-bold text-foreground">Set as Primary Default Warehouse for Sales &amp; POS</span>
              </label>

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
                  className="rounded-xl font-bold px-6 shadow-md cursor-pointer bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                >
                  {isSaving ? 'Saving...' : 'Save Warehouse'}
                </Button>
              </div>
            </form>
          </Modal>

        </div>
      </PageContainer>
    </AppShell>
  );
}