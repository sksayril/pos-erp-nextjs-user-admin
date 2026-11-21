'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { useToastStore, useAuthStore, usePOSStore } from '../../../lib/store';
import { 
  Settings, Save, RefreshCw, Sliders, ShieldCheck, 
  Bell, Scan, AlertTriangle, Lock, Server, Cpu, Trash2, Database
} from 'lucide-react';

export default function SystemSettingsPage() {
  const { addToast } = useToastStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const [form, setForm] = useState({
    lowStockThreshold: 10,
    enableSoundAlerts: true,
    enableBarcodeScanner: true,
    enableNegativeStockSale: false,
    enableCreditSales: true,
    taxInclusivePricing: false,
    defaultWarehouse: 'Main Central Hub',
    defaultPaymentMethod: 'Cash',
    sessionTimeoutMinutes: 60,
    maintenanceMode: false
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sysRes, whRes] = await Promise.all([
        fetch('/api/settings/system'),
        fetch('/api/settings/warehouse')
      ]);
      const sysData = await sysRes.json();
      const whData = await whRes.json();

      if (sysData && !sysData.error) setForm(sysData);
      if (Array.isArray(whData)) setWarehouses(whData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (field: string, val: any) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleClearDummyData = async () => {
    setIsClearing(true);
    try {
      const res = await fetch('/api/system/clear-dummy-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user?.email })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        usePOSStore.getState().clearAllPOSData();
        addToast('success', 'Dummy Data Purged', 'All mock products, demo invoices, purchases, and expenses have been completely deleted.');
        setClearModalOpen(false);
        setTimeout(() => {
          window.location.reload();
        }, 700);
      } else {
        addToast('error', 'Error', data.error || 'Failed to clear dummy data.');
      }
    } catch {
      addToast('error', 'Error', 'Failed to reach backend server.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        addToast('success', 'System Parameters Saved', 'Global POS & ERP rules updated successfully.');
      } else {
        addToast('error', 'Error', 'Failed to save system settings.');
      }
    } catch {
      addToast('error', 'Network Error', 'Failed to reach backend.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6 select-none max-w-[1400px] mx-auto pb-12">
          
          {/* Top Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-slate-700/40">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-slate-700/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold backdrop-blur-md">
                  <Cpu className="h-3.5 w-3.5" />
                  <span>Global Application Engine Rules</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  System Settings
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
                  Configure global inventory thresholds, POS scanner triggers, credit limits, sound effects, and server maintenance modes.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={fetchData}
                  title="Reload"
                  className="h-11 w-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all cursor-pointer backdrop-blur-md"
                >
                  <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={isSaving || loading}
                  className="h-11 px-6 rounded-2xl font-bold shadow-lg shadow-indigo-500/25 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white cursor-pointer border-0 flex items-center gap-2"
                >
                  <Save className="h-4.5 w-4.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Form Settings */}
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* POS & Inventory Operational Rules */}
            <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-border/60">
                <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Sliders className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">POS &amp; Stock Operations</h3>
                  <p className="text-[11px] text-muted-foreground">Control billing flow, negative stock restrictions, and low quantity alert triggers.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Low Stock Warning Limit</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.lowStockThreshold}
                    onChange={(e) => handleChange('lowStockThreshold', Number(e.target.value))}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Default Sales Warehouse</label>
                  <select
                    value={form.defaultWarehouse}
                    onChange={(e) => handleChange('defaultWarehouse', e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-card px-4 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  >
                    {warehouses.map(w => (
                      <option key={w._id || w.code} value={w.name}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Default POS Payment Mode</label>
                  <select
                    value={form.defaultPaymentMethod}
                    onChange={(e) => handleChange('defaultPaymentMethod', e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-card px-4 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / QR</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Bank Transfer">Bank Wire</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.enableSoundAlerts}
                    onChange={(e) => handleChange('enableSoundAlerts', e.target.checked)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <div>
                    <span className="text-xs font-bold text-foreground block">Audio / Beep Feedback on POS Scan</span>
                    <span className="text-[10px] text-muted-foreground">Play success sound when product barcode is scanned</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.enableBarcodeScanner}
                    onChange={(e) => handleChange('enableBarcodeScanner', e.target.checked)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <div>
                    <span className="text-xs font-bold text-foreground block">Continuous Barcode Scanner Listener</span>
                    <span className="text-[10px] text-muted-foreground">Auto-focus product search input on POS checkout screen</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.enableNegativeStockSale}
                    onChange={(e) => handleChange('enableNegativeStockSale', e.target.checked)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <div>
                    <span className="text-xs font-bold text-foreground block">Allow Negative Stock Invoicing</span>
                    <span className="text-[10px] text-muted-foreground">Allow sales even if recorded quantity is 0 or below</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.enableCreditSales}
                    onChange={(e) => handleChange('enableCreditSales', e.target.checked)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <div>
                    <span className="text-xs font-bold text-foreground block">Enable Customer Credit / Due Sales</span>
                    <span className="text-[10px] text-muted-foreground">Permit partial payment and outstanding debtor ledger entries</span>
                  </div>
                </label>
              </div>
            </div>

            {/* System Security & Maintenance */}
            <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-border/60">
                <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-foreground flex items-center justify-center">
                  <Server className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Session &amp; Server Maintenance</h3>
                  <p className="text-[11px] text-muted-foreground">Security session lifespan and system override modes.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">User Inactivity Session Timeout (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    value={form.sessionTimeoutMinutes}
                    onChange={(e) => handleChange('sessionTimeoutMinutes', Number(e.target.value))}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.maintenanceMode}
                    onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                    className="h-4 w-4 rounded accent-rose-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-foreground block">System Maintenance Mode</span>
                    <span className="text-[10px] text-muted-foreground">Temporarily lock non-admin user logouts and POS terminals</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Production Reset & Dummy Data Purge Card */}
            <div className="p-6 rounded-3xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-rose-200/60 dark:border-rose-900/40">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                      Database &amp; Dummy Data Clean Slate
                      <Badge variant="destructive" className="text-[10px] py-0 px-2">Production Ready</Badge>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Permanently wipe all demo products, sample sales, purchase orders, expenses, and quotations to start with a fresh clean business system.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setClearModalOpen(true)}
                  disabled={isClearing}
                  className="rounded-2xl font-bold h-10 px-5 flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{isClearing ? 'Clearing Data...' : 'Clear All Dummy Data'}</span>
                </Button>
              </div>
              <div className="text-[11px] text-muted-foreground">
                <span className="font-bold text-foreground">Note:</span> Your admin account credentials, custom users, business profile, and ERP 1-Year subscription license key will be safely preserved.
              </div>
            </div>

            {/* Bottom Save Action */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isSaving || loading}
                className="h-11 px-8 rounded-2xl font-bold shadow-lg shadow-indigo-500/25 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white cursor-pointer border-0 flex items-center gap-2"
              >
                <Save className="h-4.5 w-4.5" />
                <span>{isSaving ? 'Saving...' : 'Save System Rules'}</span>
              </Button>
            </div>

          </form>

          {/* Clean Slate Confirmation Modal */}
          <Modal
            isOpen={clearModalOpen}
            onClose={() => !isClearing && setClearModalOpen(false)}
            title="Wipe & Reset All Dummy Data?"
            size="md"
            footer={
              <>
                <Button
                  variant="outline"
                  onClick={() => setClearModalOpen(false)}
                  disabled={isClearing}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleClearDummyData}
                  disabled={isClearing}
                  className="flex items-center gap-2 font-bold"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{isClearing ? 'Clearing Data...' : 'Yes, Wipe All Dummy Data'}</span>
                </Button>
              </>
            }
          >
            <div className="space-y-4 py-1">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200">
                <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold">Are you sure you want to remove all dummy data?</p>
                  <p className="text-muted-foreground dark:text-rose-300/80 leading-relaxed">
                    This will permanently clear all demo products, dummy sales transactions, purchase orders, expenses, quotations, and dummy customers. The system will start fresh for your business.
                  </p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 text-xs space-y-2">
                <p className="font-bold text-foreground">🛡 Safe &amp; Preserved Items:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-[11px]">
                  <li>Current Super Admin account &amp; custom registered staff</li>
                  <li>ERP 1-Year subscription activation license</li>
                  <li>Default POS Walk-In Customer &amp; store configuration</li>
                </ul>
              </div>
            </div>
          </Modal>

        </div>
      </PageContainer>
    </AppShell>
  );
}