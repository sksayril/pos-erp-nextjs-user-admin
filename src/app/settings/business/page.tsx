'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useToastStore } from '../../../lib/store';
import { 
  Building2, Save, RefreshCw, Globe, Mail, Phone, 
  MapPin, ShieldCheck, DollarSign, Calendar, Clock, Image as ImageIcon
} from 'lucide-react';

export default function BusinessSettingsPage() {
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    companyName: '',
    tradeName: '',
    gstin: '',
    pan: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    currency: 'INR (₹)',
    currencySymbol: '₹',
    timezone: 'Asia/Kolkata (GMT+5:30)',
    fiscalYearStart: 'April',
    tagline: ''
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/business');
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
    fetchSettings();
  }, []);

  const handleChange = (field: string, val: string) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        addToast('success', 'Profile Updated', 'Business and enterprise profile saved to database.');
      } else {
        addToast('error', 'Save Failed', 'Could not update business settings.');
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
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Enterprise Profile &amp; GST Identity</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  Business Settings
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
                  Configure your company registered details, GSTIN/PAN legal identifiers, contact information, and fiscal year.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={fetchSettings}
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
                  <span>{isSaving ? 'Saving Changes...' : 'Save Profile'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Form Grid */}
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* General & Legal Information */}
            <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-border/60">
                <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Company &amp; Legal Identity</h3>
                  <p className="text-[11px] text-muted-foreground">Official registered business details used across invoices and tax forms.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Legal Company Name *</label>
                  <input
                    type="text"
                    required
                    value={form.companyName || ''}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="e.g. Apex Enterprise POS & ERP"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Trade / Store Name</label>
                  <input
                    type="text"
                    value={form.tradeName || ''}
                    onChange={(e) => handleChange('tradeName', e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="e.g. Apex Retail Solutions"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Company Tagline</label>
                  <input
                    type="text"
                    value={form.tagline || ''}
                    onChange={(e) => handleChange('tagline', e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="e.g. Smart Retail & ERP"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">GSTIN Number *</label>
                  <input
                    type="text"
                    required
                    value={form.gstin || ''}
                    onChange={(e) => handleChange('gstin', e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="e.g. 19AAACA9928P1Z8"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">PAN Card Number</label>
                  <input
                    type="text"
                    value={form.pan || ''}
                    onChange={(e) => handleChange('pan', e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="e.g. AAACA9928P"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Corporate Website</label>
                  <input
                    type="text"
                    value={form.website || ''}
                    onChange={(e) => handleChange('website', e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="https://apexretail.in"
                  />
                </div>
              </div>
            </div>

            {/* Contact & Location Details */}
            <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-border/60">
                <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Registered Office &amp; Communication</h3>
                  <p className="text-[11px] text-muted-foreground">Location and communication lines for invoices, bills, and customers.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Official Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="contact@apexretail.in"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Helpline Phone *</label>
                  <input
                    type="text"
                    required
                    value={form.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="+91 98300 12345"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">City</label>
                  <input
                    type="text"
                    value={form.city || ''}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Kolkata"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-foreground block mb-1.5">Full Street Address *</label>
                  <input
                    type="text"
                    required
                    value={form.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="74/B Sector V, Salt Lake Electronics Complex"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">State &amp; Pincode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={form.state || ''}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="West Bengal"
                    />
                    <input
                      type="text"
                      value={form.pincode || ''}
                      onChange={(e) => handleChange('pincode', e.target.value)}
                      className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="700091"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Currency & Localization */}
            <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-border/60">
                <div className="h-8 w-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <DollarSign className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Currency &amp; Regional Localization</h3>
                  <p className="text-[11px] text-muted-foreground">Currency symbol, accounting timezone, and financial year definition.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Base Currency</label>
                  <select
                    value={form.currency || 'INR (₹)'}
                    onChange={(e) => {
                      handleChange('currency', e.target.value);
                      handleChange('currencySymbol', e.target.value.includes('₹') ? '₹' : '$');
                    }}
                    className="w-full h-11 rounded-2xl border border-border bg-card px-4 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  >
                    <option value="INR (₹)">Indian Rupee (INR ₹)</option>
                    <option value="USD ($)">US Dollar (USD $)</option>
                    <option value="EUR (€)">Euro (EUR €)</option>
                    <option value="GBP (£)">British Pound (GBP £)</option>
                    <option value="AED (د.إ)">UAE Dirham (AED د.إ)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Currency Symbol</label>
                  <input
                    type="text"
                    value={form.currencySymbol || '₹'}
                    onChange={(e) => handleChange('currencySymbol', e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">System Timezone</label>
                  <select
                    value={form.timezone || 'Asia/Kolkata (GMT+5:30)'}
                    onChange={(e) => handleChange('timezone', e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-card px-4 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  >
                    <option value="Asia/Kolkata (GMT+5:30)">Asia/Kolkata (GMT+5:30)</option>
                    <option value="Asia/Dubai (GMT+4:00)">Asia/Dubai (GMT+4:00)</option>
                    <option value="Asia/Dhaka (GMT+6:00)">Asia/Dhaka (GMT+6:00)</option>
                    <option value="UTC (GMT+0:00)">UTC (GMT+0:00)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Fiscal Year Starts</label>
                  <select
                    value={form.fiscalYearStart || 'April'}
                    onChange={(e) => handleChange('fiscalYearStart', e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-card px-4 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  >
                    <option value="April">April (Indian Standard)</option>
                    <option value="January">January (Calendar Year)</option>
                    <option value="July">July</option>
                    <option value="October">October</option>
                  </select>
                </div>
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
                <span>{isSaving ? 'Saving...' : 'Save All Changes'}</span>
              </Button>
            </div>

          </form>

        </div>
      </PageContainer>
    </AppShell>
  );
}