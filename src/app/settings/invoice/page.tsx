'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useToastStore } from '../../../lib/store';
import { 
  FileText, Save, RefreshCw, Printer, QrCode, 
  Landmark, ShieldCheck, CheckCircle2, Eye, Sliders, Palette
} from 'lucide-react';

export default function InvoiceSettingsPage() {
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    invoicePrefix: 'INV-2026-',
    invoiceSuffix: '',
    startingNumber: 1001,
    paperSize: 'A4',
    themeColor: '#7c3aed',
    showLogo: true,
    showQrCode: true,
    showTaxBreakup: true,
    showBankDetails: true,
    bankName: 'HDFC Corporate Current Account',
    bankAccountNumber: '50200088992211',
    bankIfsc: 'HDFC0000123',
    upiId: 'apexretail@hdfcbank',
    termsAndConditions: '1. Goods once sold will only be returned within 7 days with valid bill.\n2. Interest @ 18% p.a. will be charged for delayed payments after 30 days.',
    footerNote: 'Thank you for your business! For support call +91 98300 12345'
  });

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/invoice');
      const data = await res.json();
      if (data && !data.error) {
        setForm(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleChange = (field: string, val: any) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        addToast('success', 'Invoice Config Saved', 'Invoice template and printing parameters updated.');
      } else {
        addToast('error', 'Error', 'Failed to update invoice settings.');
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
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-purple-500/20">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold backdrop-blur-md">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Document Layout &amp; Invoice Designer</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  Invoice &amp; Bill Config
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
                  Design sales tax invoices, receipt templates, UPI QR codes, bank payment instructions and numbering prefixes.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={fetchConfig}
                  title="Reload"
                  className="h-11 w-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all cursor-pointer backdrop-blur-md"
                >
                  <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={isSaving || loading}
                  className="h-11 px-6 rounded-2xl font-bold shadow-lg shadow-purple-500/25 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white cursor-pointer border-0 flex items-center gap-2"
                >
                  <Save className="h-4.5 w-4.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Template'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Form & Live Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Form Fields (7 cols) */}
            <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
              
              {/* Numbering & Paper */}
              <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-5">
                <div className="flex items-center gap-2.5 pb-4 border-b border-border/60">
                  <div className="h-8 w-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Sliders className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Invoice Numbering &amp; Paper Size</h3>
                    <p className="text-[11px] text-muted-foreground">Set unique sequential identifier format and layout standard.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Prefix *</label>
                    <input
                      type="text"
                      required
                      value={form.invoicePrefix || ''}
                      onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                      className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Starting Counter</label>
                    <input
                      type="number"
                      required
                      value={form.startingNumber || 1001}
                      onChange={(e) => handleChange('startingNumber', Number(e.target.value))}
                      className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Default Format</label>
                    <select
                      value={form.paperSize || 'A4'}
                      onChange={(e) => handleChange('paperSize', e.target.value)}
                      className="w-full h-11 rounded-2xl border border-border bg-card px-4 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/40 cursor-pointer"
                    >
                      <option value="A4">A4 Corporate Sheet</option>
                      <option value="A5">A5 Compact Invoice</option>
                      <option value="Thermal 80mm">Thermal POS 80mm (3 Inch)</option>
                      <option value="Thermal 58mm">Thermal POS 58mm (2 Inch)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bank Details on Invoice */}
              <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-5">
                <div className="flex items-center gap-2.5 pb-4 border-b border-border/60">
                  <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Landmark className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Bank &amp; Instant UPI Payment Gateway</h3>
                    <p className="text-[11px] text-muted-foreground">Bank account details and UPI QR code printed at bottom of customer invoice.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Bank Name</label>
                    <input
                      type="text"
                      value={form.bankName || ''}
                      onChange={(e) => handleChange('bankName', e.target.value)}
                      className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Account Number</label>
                    <input
                      type="text"
                      value={form.bankAccountNumber || ''}
                      onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
                      className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">IFSC Code</label>
                    <input
                      type="text"
                      value={form.bankIfsc || ''}
                      onChange={(e) => handleChange('bankIfsc', e.target.value)}
                      className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">UPI ID (For Dynamic QR Code)</label>
                    <input
                      type="text"
                      value={form.upiId || ''}
                      onChange={(e) => handleChange('upiId', e.target.value)}
                      className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-mono text-purple-600 dark:text-purple-400 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                      placeholder="e.g. apexretail@hdfcbank"
                    />
                  </div>
                </div>
              </div>

              {/* Terms & Footer Note */}
              <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-5">
                <div className="flex items-center gap-2.5 pb-4 border-b border-border/60">
                  <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Terms, Policies &amp; Footer Note</h3>
                    <p className="text-[11px] text-muted-foreground">Standard legal conditions and customer greeting displayed on printed slips.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Terms &amp; Conditions</label>
                    <textarea
                      rows={3}
                      value={form.termsAndConditions || ''}
                      onChange={(e) => handleChange('termsAndConditions', e.target.value)}
                      className="w-full p-3 rounded-2xl border border-border bg-muted/20 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Footer Note / Greeting</label>
                    <input
                      type="text"
                      value={form.footerNote || ''}
                      onChange={(e) => handleChange('footerNote', e.target.value)}
                      className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                  </div>
                </div>
              </div>

            </form>

            {/* Right Column: Live Visual Invoice Preview (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-primary" /> Live Document Preview
                </span>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {form.paperSize}
                </Badge>
              </div>

              {/* Mock Invoice Card */}
              <div className="p-6 rounded-3xl bg-card border-2 border-dashed border-border shadow-md space-y-4 font-sans text-xs">
                {/* Header */}
                <div className="flex justify-between items-start pb-4 border-b border-border/80">
                  <div>
                    <h2 className="text-base font-black text-foreground">APEX RETAIL SOLUTIONS</h2>
                    <p className="text-[10px] text-muted-foreground font-mono">GSTIN: 19AAACA9928P1Z8</p>
                    <p className="text-[10px] text-muted-foreground">Kolkata, West Bengal • +91 98300 12345</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-primary font-mono block">TAX INVOICE</span>
                    <span className="text-xs font-black font-mono text-foreground">{form.invoicePrefix}{form.startingNumber}</span>
                    <p className="text-[10px] text-muted-foreground font-mono">Date: 2026-10-01</p>
                  </div>
                </div>

                {/* Bill To */}
                <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground block">Billed To:</span>
                  <p className="font-bold text-foreground text-xs">Walk-in Retail Client</p>
                  <p className="text-[10px] text-muted-foreground">Mobile: +91 98765 43210</p>
                </div>

                {/* Items Table Mock */}
                <table className="w-full text-left text-[11px]">
                  <thead className="border-b border-border text-muted-foreground uppercase text-[9px] font-bold">
                    <tr>
                      <th className="py-1">Item</th>
                      <th className="py-1 text-center">Qty</th>
                      <th className="py-1 text-right">Price</th>
                      <th className="py-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    <tr>
                      <td className="py-1.5 font-medium">Dell 27&quot; IPS 4K Monitor</td>
                      <td className="py-1.5 text-center font-mono">1</td>
                      <td className="py-1.5 text-right font-mono">₹24,500</td>
                      <td className="py-1.5 text-right font-mono font-bold">₹24,500</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-medium">Logitech MX Master 3S</td>
                      <td className="py-1.5 text-center font-mono">1</td>
                      <td className="py-1.5 text-right font-mono">₹7,200</td>
                      <td className="py-1.5 text-right font-mono font-bold">₹7,200</td>
                    </tr>
                  </tbody>
                </table>

                {/* Totals */}
                <div className="pt-2 border-t border-border space-y-1 text-[11px] text-right font-mono">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxable Subtotal:</span>
                    <span>₹31,700.00</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>GST (18%):</span>
                    <span>₹5,706.00</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-foreground pt-1 border-t border-border">
                    <span>Grand Total:</span>
                    <span>₹37,406.00</span>
                  </div>
                </div>

                {/* Bank / QR Mock */}
                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                  <div className="space-y-0.5 text-[10px]">
                    <span className="font-bold text-purple-700 dark:text-purple-400 block">Bank Payment Info</span>
                    <p className="text-muted-foreground">{form.bankName}</p>
                    <p className="font-mono text-foreground font-bold">A/C: {form.bankAccountNumber}</p>
                    <p className="font-mono text-muted-foreground">IFSC: {form.bankIfsc}</p>
                  </div>
                  <div className="h-14 w-14 rounded-xl bg-white p-1 border border-border shadow-xs flex items-center justify-center shrink-0">
                    <QrCode className="h-12 w-12 text-slate-800" />
                  </div>
                </div>

                {/* Footer Note */}
                <p className="text-[10px] text-center text-muted-foreground italic pt-1">
                  &quot;{form.footerNote}&quot;
                </p>
              </div>
            </div>

          </div>

        </div>
      </PageContainer>
    </AppShell>
  );
}