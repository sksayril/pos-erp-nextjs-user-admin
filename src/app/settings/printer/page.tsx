'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { useToastStore } from '../../../lib/store';
import { 
  Printer, Plus, Edit3, Trash2, RefreshCw, 
  Wifi, Usb, Bluetooth, ShieldCheck, Play, CheckCircle2, Sliders
} from 'lucide-react';

export default function PrinterSettingsPage() {
  const { addToast } = useToastStore();
  const [printers, setPrinters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [printerName, setPrinterName] = useState('');
  const [type, setType] = useState('Thermal POS 80mm');
  const [connectionType, setConnectionType] = useState('Browser Print Dialog');
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('9100');
  const [isDefault, setIsDefault] = useState(false);
  const [autoPrintOnSale, setAutoPrintOnSale] = useState(true);
  const [openCashDrawerOnSale, setOpenCashDrawerOnSale] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPrinters = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/printer');
      const data = await res.json();
      if (Array.isArray(data)) setPrinters(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrinters();
  }, []);

  const handleOpenCreate = () => {
    setEditItem(null);
    setPrinterName('');
    setType('Thermal POS 80mm');
    setConnectionType('Browser Print Dialog');
    setIpAddress('');
    setPort('9100');
    setIsDefault(false);
    setAutoPrintOnSale(true);
    setOpenCashDrawerOnSale(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (p: any) => {
    setEditItem(p);
    setPrinterName(p.printerName);
    setType(p.type || 'Thermal POS 80mm');
    setConnectionType(p.connectionType || 'Browser Print Dialog');
    setIpAddress(p.ipAddress || '');
    setPort(p.port?.toString() || '9100');
    setIsDefault(p.isDefault || false);
    setAutoPrintOnSale(p.autoPrintOnSale ?? true);
    setOpenCashDrawerOnSale(p.openCashDrawerOnSale ?? true);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!printerName.trim()) {
      addToast('warning', 'Missing Name', 'Printer title is required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        printerName: printerName.trim(),
        type,
        connectionType,
        ipAddress: ipAddress.trim() || undefined,
        port: Number(port) || 9100,
        isDefault,
        autoPrintOnSale,
        openCashDrawerOnSale
      };

      let res;
      if (editItem) {
        res = await fetch('/api/settings/printer', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ _id: editItem._id, ...payload })
        });
      } else {
        res = await fetch('/api/settings/printer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        addToast('success', editItem ? 'Printer Updated' : 'Printer Connected', `${printerName} saved successfully.`);
        setModalOpen(false);
        fetchPrinters();
      } else {
        const err = await res.json();
        addToast('error', 'Error', err.error || 'Failed to save printer configuration.');
      }
    } catch {
      addToast('error', 'Network Error', 'Failed to reach server.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (p: any) => {
    try {
      const res = await fetch(`/api/settings/printer?id=${p._id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Printer Removed', `${p.printerName} removed.`);
        fetchPrinters();
      }
    } catch {
      addToast('error', 'Error', 'Failed to delete printer.');
    }
  };

  const handleTestPrint = (p: any) => {
    addToast('info', 'Printing Test Slip', `Sending test command to ${p.printerName}...`);
    window.print();
  };

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6 select-none max-w-[1400px] mx-auto pb-12">
          
          {/* Top Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-rose-500/20">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-pink-500/15 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-semibold backdrop-blur-md">
                  <Printer className="h-3.5 w-3.5" />
                  <span>Hardware &amp; POS Peripherals</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  Printers &amp; Peripherals Setup
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
                  Configure thermal 80mm/58mm receipt printers, A4 invoices, barcode label sticker machines and automatic cash drawer trigger.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchPrinters}
                  title="Reload"
                  className="h-11 w-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all cursor-pointer backdrop-blur-md"
                >
                  <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <Button
                  variant="primary"
                  onClick={handleOpenCreate}
                  className="h-11 px-6 rounded-2xl font-bold shadow-lg shadow-rose-500/25 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white cursor-pointer border-0 flex items-center gap-2"
                >
                  <Plus className="h-4.5 w-4.5" />
                  <span>Add Printer</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Printers Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {printers.map((p) => (
              <div key={p._id || p.printerName} className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs hover:shadow-md transition-all space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <Printer className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-foreground">{p.printerName}</h4>
                        {p.isDefault && (
                          <Badge variant="success" className="text-[9px] py-0.2">Default</Badge>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground">{p.type}</p>
                    </div>
                  </div>

                  <Badge variant="secondary" className="text-[10px]">
                    {p.connectionType}
                  </Badge>
                </div>

                <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Auto-Print on Checkout:</span>
                    <span className={p.autoPrintOnSale ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-muted-foreground'}>
                      {p.autoPrintOnSale ? '✓ Active' : '✗ Off'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Auto Kick Cash Drawer:</span>
                    <span className={p.openCashDrawerOnSale ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-muted-foreground'}>
                      {p.openCashDrawerOnSale ? '✓ Enabled' : '✗ Off'}
                    </span>
                  </div>
                  {p.ipAddress && (
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-muted-foreground">Network IP:</span>
                      <span className="font-bold text-foreground">{p.ipAddress}:{p.port || 9100}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestPrint(p)}
                    className="h-8 px-3 rounded-xl text-xs font-bold gap-1 cursor-pointer"
                  >
                    <Play className="h-3 w-3 text-emerald-500" /> Test Print
                  </Button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      title="Edit Configuration"
                      className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white border border-amber-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                    >
                      <Edit3 className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      title="Delete Printer"
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
            title={editItem ? 'Edit Printer Configuration' : 'Connect New Printer'}
            size="md"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Printer Label / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Counter 1 Thermal 80mm"
                  value={printerName}
                  onChange={(e) => setPrinterName(e.target.value)}
                  className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Hardware Format *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-card px-4 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/40 cursor-pointer"
                  >
                    <option value="Thermal POS 80mm">Thermal POS 80mm (Standard)</option>
                    <option value="Thermal POS 58mm">Thermal POS 58mm (Mini)</option>
                    <option value="A4 Laser / Inkjet">A4 Laser / Inkjet Invoice</option>
                    <option value="Barcode Label Printer">Barcode Sticker Printer</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Connection Interface</label>
                  <select
                    value={connectionType}
                    onChange={(e) => setConnectionType(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-card px-4 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/40 cursor-pointer"
                  >
                    <option value="Browser Print Dialog">Browser Print Dialog (Direct OS)</option>
                    <option value="USB / Direct">USB Direct Raw ESC/POS</option>
                    <option value="Network IP / Wi-Fi">Network Ethernet / Wi-Fi IP</option>
                    <option value="Bluetooth">Bluetooth Mobile POS</option>
                  </select>
                </div>
              </div>

              {connectionType === 'Network IP / Wi-Fi' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Printer IP Address</label>
                    <input
                      type="text"
                      placeholder="192.168.1.100"
                      value={ipAddress}
                      onChange={(e) => setIpAddress(e.target.value)}
                      className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Port</label>
                    <input
                      type="text"
                      placeholder="9100"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 p-3 rounded-2xl border border-border bg-muted/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span className="text-xs font-bold text-foreground">Set as Default POS Counter Printer</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-2xl border border-border bg-muted/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPrintOnSale}
                    onChange={(e) => setAutoPrintOnSale(e.target.checked)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span className="text-xs font-bold text-foreground">Automatically trigger receipt on POS checkout complete</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-2xl border border-border bg-muted/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openCashDrawerOnSale}
                    onChange={(e) => setOpenCashDrawerOnSale(e.target.checked)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span className="text-xs font-bold text-foreground">Send ESC/POS signal to kick physical Cash Drawer</span>
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
                  className="rounded-xl font-bold px-6 shadow-md cursor-pointer bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white"
                >
                  {isSaving ? 'Saving...' : 'Save Printer'}
                </Button>
              </div>
            </form>
          </Modal>

        </div>
      </PageContainer>
    </AppShell>
  );
}