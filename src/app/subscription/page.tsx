'use client';

import React, { useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../components/layout/AppShell';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/ui/Button';
import { useAuthStore, useSubscriptionStore, useToastStore } from '../../lib/store';
import { 
  ShieldCheck, Zap, Lock, Key, Copy, CheckCircle2, 
  Sparkles, CreditCard, AlertCircle, ArrowRight, 
  Check, RefreshCw, Building2, HelpCircle, FileCheck
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const {
    isSubscribed,
    activationKey,
    expiryDate,
    activatedAt,
    planName,
    amount,
    activateSubscription,
    resetSubscription
  } = useSubscriptionStore();

  const [activeTab, setActiveTab] = useState<'razorpay' | 'manual'>('razorpay');
  const [inputKey, setInputKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [razorpayReady, setRazorpayReady] = useState(false);

  // Copy activation key to clipboard
  const handleCopyKey = () => {
    if (!activationKey) return;
    navigator.clipboard.writeText(activationKey);
    addToast('info', 'Code Copied', 'Activation key copied to clipboard.');
  };

  // Launch Razorpay Checkout
  const handleRazorpayPayment = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMessage('');

    try {
      if (typeof window === 'undefined' || !window.Razorpay) {
        throw new Error('Razorpay SDK is still loading. Please check your internet connection and try again.');
      }

      // Step 1: Create Order via Backend API
      const res = await fetch('/api/subscription/order', { method: 'POST' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create payment order with server.');
      }
      const orderData = await res.json();

      // Step 2: Configure Razorpay Checkout options
      const options = {
        key: orderData.keyId || 'rzp_test_T3yxQHxDAjRVvh',
        amount: orderData.amount || 599900,
        currency: orderData.currency || 'INR',
        name: 'POS ERP Enterprise',
        description: '1-Year Full Enterprise ERP License Subscription',
        order_id: orderData.orderId,
        handler: async function (response: any) {
          setLoading(true);
          try {
            const verifyRes = await fetch('/api/subscription/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                email: user?.email || 'admin@erp.com',
                businessName: 'Apex Enterprise',
                planName: '1-Year Full ERP License',
                amount: 5999
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              activateSubscription({
                activationKey: verifyData.activationKey,
                expiryDate: verifyData.expiryDate,
                activatedAt: verifyData.activatedAt,
                planName: '1-Year Full ERP License',
                amount: 5999
              });
              addToast('success', 'License Activated!', `Payment verified successfully! Activation Code: ${verifyData.activationKey}`);
            } else {
              throw new Error(verifyData.error || 'Payment signature verification failed.');
            }
          } catch (err: any) {
            setErrorMessage(err.message || 'Payment verification failed on server.');
            addToast('error', 'Verification Failed', err.message || 'Signature mismatch.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        },
        prefill: {
          name: user?.name || 'Super Admin',
          email: user?.email || 'admin@erp.com',
          contact: user?.phone || '9900001111'
        },
        theme: {
          color: '#7c3aed'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setLoading(false);
        setErrorMessage(`Payment failed: ${resp.error?.description || resp.error?.reason || 'Payment could not be completed.'}`);
      });
      rzp.open();
    } catch (err: any) {
      console.error('Razorpay Error:', err);
      setErrorMessage(err.message || 'Failed to initialize Razorpay checkout.');
      setLoading(false);
    }
  };

  // Manual Activation Code
  const handleManualActivate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;
    setErrorMessage('');

    const targetKey = inputKey.trim() || 'ERP-ACTV-8942-X92F-2026';
    setLoading(true);

    try {
      const res = await fetch('/api/subscription/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activationKey: targetKey,
          email: user?.email || 'admin@erp.com',
          businessName: 'Apex Enterprise'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        activateSubscription({
          activationKey: data.activationKey,
          expiryDate: data.expiryDate,
          activatedAt: data.activatedAt,
          planName: '1-Year Full ERP License',
          amount: 5999
        });
        addToast('success', 'ERP Unlocked!', `Activation verified in database. Code: ${data.activationKey}`);
        setInputKey('');
      } else {
        setErrorMessage(data.error || 'Invalid code. Code must start with ERP-ACTV-');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with verification API.');
    } finally {
      setLoading(false);
    }
  };

  const planFeatures = [
    'Unlimited Point of Sale (POS) Billing & Register Shifts',
    'Complete Inventory Management (Batches, Barcodes, Adjustments)',
    'Full Accounting Suite (Journals, Ledgers, Payables & Receivables)',
    'Purchase & Supplier Management with Goods Receiving',
    'Sales, Invoicing, E-Waybill & Delivery Challans',
    'HRM & Payroll (Employees, Attendance, Salary Processing)',
    'Multi-Warehouse Stock Transfers & Tracking',
    'Commercial Financial Reports (P&L, Balance Sheet, Tax Reports)',
    'Custom Roles, RBAC Permissions & Audit Logs',
    'MongoDB Database Sync & Cloud Backup Integration'
  ];

  const content = (
    <>
      {/* Load Razorpay Script cleanly via next/script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayReady(true)}
      />

      <div className="max-w-5xl mx-auto space-y-8 py-4">
        {/* Page Title & Breadcrumb header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
              <ShieldCheck className="h-4 w-4" /> Enterprise Licensing &amp; Billing
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              ERP Subscription &amp; Payment Portal
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your commercial license, pay securely with Razorpay, or enter your official activation code.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-1.5">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* ALREADY ACTIVE STATE */}
        {isSubscribed ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Active Status Card */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/30 shadow-lg relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/25">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500 text-white">
                        Active &amp; Licensed
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        Valid until {expiryDate || '2027-11-20'}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-foreground">
                      Enterprise Full Access Subscription
                    </h2>
                    <p className="text-xs text-muted-foreground max-w-xl">
                      Your POS &amp; ERP installation is fully activated in MongoDB. All modules, unlimited transactions, multi-warehouse features, and administrative controls are permanently unlocked.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/pos">
                    <Button variant="primary" className="gap-2 shadow-md">
                      Open POS Counter <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetSubscription();
                      addToast('warning', 'License Reset', 'Set subscription to unlicensed state for testing.');
                    }}
                    className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <RefreshCw className="h-4 w-4" /> Reset for Testing
                  </Button>
                </div>
              </div>
            </div>

            {/* License Details & Key Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary" /> Active Activation Key
                  </span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4" /> Verified MongoDB Record
                  </span>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 border border-border font-mono text-base md:text-lg font-black text-foreground tracking-wider select-all">
                  <span className="flex-1 truncate">{activationKey || 'ERP-ACTV-8942-X92F-2026'}</span>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="p-2.5 rounded-lg bg-card hover:bg-muted border border-border text-foreground transition-all cursor-pointer shadow-xs"
                    title="Copy Key"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs border-t border-border/50">
                  <div>
                    <div className="text-muted-foreground">Plan</div>
                    <div className="font-bold text-foreground mt-0.5">{planName || '1-Year Full License'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Amount Paid</div>
                    <div className="font-bold text-foreground mt-0.5">₹{amount || '5,999'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Activated On</div>
                    <div className="font-bold text-foreground mt-0.5">{activatedAt || '2026-11-20'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Expires On</div>
                    <div className="font-bold text-foreground mt-0.5">{expiryDate || '2027-11-20'}</div>
                  </div>
                </div>
              </div>

              {/* Quick Info Box */}
              <div className="p-6 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" /> License Registered To
                  </h3>
                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <div>User: <strong className="text-foreground">{user?.name || 'Super Admin'}</strong></div>
                    <div>Email: <strong className="text-foreground">{user?.email || 'admin@erp.com'}</strong></div>
                    <div>Role: <strong className="text-primary font-bold">{user?.role || 'Super Admin'}</strong></div>
                    <div>Status: <strong className="text-emerald-600 font-bold">Commercial License Active</strong></div>
                  </div>
                </div>

                <Link href="/dashboard" className="w-full">
                  <Button variant="outline" className="w-full text-xs">
                    View ERP Overview
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* NOT SUBSCRIBED - PURCHASE & ACTIVATE PORTAL */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
            {/* Left 7 Columns: Plan Features & Benefits */}
            <div className="lg:col-span-7 space-y-6">
              {/* Highlight Card */}
              <div className="p-8 rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/30 shadow-md space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="px-3.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" /> Full Enterprise Suite
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">
                    365 Days Access
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-foreground tracking-tight">
                    POS ERP Full Commercial License
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Unlock every module for your retail, wholesale, distribution, and warehouse business operations.
                  </p>
                </div>

                <div className="pt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-primary">₹5,999</span>
                  <span className="text-xs font-bold text-muted-foreground">/ Year (All Inclusive)</span>
                </div>
              </div>

              {/* What is Included Checklist */}
              <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-emerald-500" /> What's Included in Your 1-Year License:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {planFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-foreground/90 font-medium">
                      <div className="h-4 w-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security & Support Guarantee */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-xl bg-card border border-border/80 space-y-1">
                  <ShieldCheck className="h-5 w-5 text-primary mx-auto" />
                  <div className="text-xs font-bold text-foreground">100% Secure</div>
                  <div className="text-[10px] text-muted-foreground">256-bit SSL encrypted</div>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border/80 space-y-1">
                  <Zap className="h-5 w-5 text-amber-500 mx-auto" />
                  <div className="text-xs font-bold text-foreground">Instant Activation</div>
                  <div className="text-[10px] text-muted-foreground">Automatic Key delivery</div>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border/80 space-y-1">
                  <Building2 className="h-5 w-5 text-emerald-500 mx-auto" />
                  <div className="text-xs font-bold text-foreground">MongoDB Sync</div>
                  <div className="text-[10px] text-muted-foreground">Persistent cloud records</div>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Payment & Activation Box */}
            <div className="lg:col-span-5 space-y-5">
              <div className="p-6 rounded-3xl bg-card border border-border shadow-xl space-y-5">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-foreground">
                    Complete Activation
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Choose Razorpay for online checkout or enter an activation code.
                  </p>
                </div>

                {/* Tabs */}
                <div className="flex rounded-xl bg-muted/50 p-1 border border-border/60">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('razorpay'); setErrorMessage(''); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeTab === 'razorpay'
                        ? 'bg-card text-foreground shadow-xs font-black'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <CreditCard className="h-3.5 w-3.5" /> Razorpay Pay (₹5,999)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('manual'); setErrorMessage(''); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeTab === 'manual'
                        ? 'bg-card text-foreground shadow-xs font-black'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Key className="h-3.5 w-3.5" /> Activation Code
                  </button>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5 animate-in fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <div className="font-bold">Payment Notification</div>
                      <div className="text-[11px] leading-relaxed">{errorMessage}</div>
                    </div>
                  </div>
                )}

                {/* TAB 1: RAZORPAY PAYMENT */}
                {activeTab === 'razorpay' && (
                  <div className="space-y-4">
                    {/* Price Breakdown */}
                    <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>1-Year Enterprise ERP License</span>
                        <span>₹5,083.90</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>GST / Taxes (18%)</span>
                        <span>₹915.10</span>
                      </div>
                      <div className="border-t border-border/60 pt-2 flex justify-between font-black text-foreground text-sm">
                        <span>Total Payable</span>
                        <span className="text-primary text-base">₹5,999.00</span>
                      </div>
                    </div>

                    {/* Supported Payment Logos / Notice */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Supported Payment Methods:
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-muted-foreground">
                        <div className="p-2 rounded-lg bg-muted/40 border border-border/40">
                          UPI (GPay / PhonePe)
                        </div>
                        <div className="p-2 rounded-lg bg-muted/40 border border-border/40">
                          Debit &amp; Credit Cards
                        </div>
                        <div className="p-2 rounded-lg bg-muted/40 border border-border/40">
                          Net Banking (50+ Banks)
                        </div>
                      </div>
                    </div>

                    {/* Pay Button */}
                    <Button
                      type="button"
                      variant="primary"
                      isLoading={loading}
                      onClick={handleRazorpayPayment}
                      className="w-full h-12 text-sm font-black shadow-lg shadow-primary/20 rounded-xl cursor-pointer"
                    >
                      {!loading && <Zap className="h-4 w-4" />}
                      Pay ₹5,999 via Razorpay Online
                    </Button>

                    <div className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1 pt-1">
                      <Lock className="h-3 w-3 text-emerald-500" /> Powered by Razorpay Standard Secure Gateway
                    </div>
                  </div>
                )}

                {/* TAB 2: MANUAL ACTIVATION KEY */}
                {activeTab === 'manual' && (
                  <form onSubmit={handleManualActivate} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground flex items-center justify-between">
                        <span>Enter Official Activation Code</span>
                        <button
                          type="button"
                          onClick={() => setInputKey('ERP-ACTV-8942-X92F-2026')}
                          className="text-primary hover:underline text-[11px] font-semibold cursor-pointer"
                        >
                          Use Demo Code
                        </button>
                      </label>
                      <input
                        type="text"
                        value={inputKey}
                        onChange={(e) => { setInputKey(e.target.value); setErrorMessage(''); }}
                        placeholder="e.g. ERP-ACTV-8942-X92F-2026"
                        className="h-11 w-full rounded-xl border border-border px-4 font-mono text-sm uppercase bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 tracking-wider font-bold"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Format: <code className="font-mono font-bold text-foreground">ERP-ACTV-XXXX-XXXX-2026</code>
                      </p>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={loading}
                      className="w-full h-11 text-sm font-bold rounded-xl"
                    >
                      Verify &amp; Activate System
                    </Button>
                  </form>
                )}

                {/* Quick 1-Click Instant License for Admin & Demo */}
                <div className="pt-3 border-t border-border/50 text-center space-y-2">
                  <div className="text-[11px] text-muted-foreground">
                    Testing or offline installation?
                  </div>
                  <button
                    type="button"
                    onClick={() => handleManualActivate()}
                    disabled={loading}
                    className="text-xs font-bold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Zap className="h-3.5 w-3.5" /> 1-Click Instant License Activation (Demo / Test)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  // If user is authenticated, wrap in standard AppShell for seamless sidebar/header navigation
  if (user) {
    return (
      <AppShell>
        <PageContainer>
          {content}
        </PageContainer>
      </AppShell>
    );
  }

  // If accessed outside dashboard (e.g. direct link or fresh signup), render clean standalone layout
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center px-4 py-8">
      {content}
    </div>
  );
}
