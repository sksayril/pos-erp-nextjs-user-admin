'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useSubscriptionStore, useToastStore, useAuthStore } from '../../lib/store';
import { ShieldCheck, Zap, Lock, Key, Copy, CheckCircle2, Sparkles, CreditCard, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const SubscriptionModal = () => {
  const {
    isSubscribed, activationKey, expiryDate, activatedAt, amount, planName,
    subscriptionModalOpen, setSubscriptionModalOpen, activateSubscription, verifyManualKey, resetSubscription
  } = useSubscriptionStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [inputKey, setInputKey] = useState('');
  const [keyError, setKeyError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'razorpay' | 'manual'>('razorpay');

  // Load Razorpay script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async () => {
    setLoading(true);
    setKeyError('');
    try {
      const res = await fetch('/api/subscription/order', { method: 'POST' });
      if (!res.ok) throw new Error('Could not create Razorpay order');
      const orderData = await res.json();

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Check internet connection.');
      }

      const options = {
        key: orderData.keyId || 'rzp_test_T3yxQHxDAjRVvh',
        amount: orderData.amount || 599900,
        currency: 'INR',
        name: 'POS ERP Suite',
        description: '1-Year Full Enterprise ERP License Subscription',
        image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
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
                businessName: 'Apex Enterprise'
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              activateSubscription({
                activationKey: verifyData.activationKey,
                expiryDate: verifyData.expiryDate,
                activatedAt: verifyData.activatedAt,
              });
              addToast('success', 'Subscription Unlocked!', `Payment verified. Activation Code: ${verifyData.activationKey}`);
            } else {
              throw new Error(verifyData.error || 'Payment signature verification failed.');
            }
          } catch (err: any) {
            setKeyError(err.message || 'Payment verification failed on server. Subscription not activated.');
            addToast('error', 'Payment Verification Failed', err.message || 'Signature mismatch.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setKeyError('Razorpay checkout was closed without completing payment. Subscription remains inactive.');
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

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (resp: any) {
        setLoading(false);
        setKeyError(`Payment failed: ${resp.error.description || resp.error.reason || 'Transaction could not be completed.'}`);
      });
      paymentObject.open();
    } catch (err: any) {
      console.error('Razorpay Error:', err);
      setKeyError(err.message || 'Failed to initialize payment.');
      setLoading(false);
    }
  };

  const handleManualActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError('');
    if (!inputKey.trim()) {
      setKeyError('Please enter an Activation Code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/subscription/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activationKey: inputKey.trim(),
          email: user?.email || 'admin@erp.com'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        activateSubscription({
          activationKey: data.activationKey,
          expiryDate: data.expiryDate,
          activatedAt: data.activatedAt,
        });
        addToast('success', 'System Activated!', 'Activation code verified in MongoDB. All modules unlocked.');
        setInputKey('');
      } else {
        setKeyError(data.error || 'Invalid Activation Code. Key must start with ERP-ACTV-');
      }
    } catch (err: any) {
      setKeyError(err.message || 'Error communicating with verification API.');
    } finally {
      setLoading(false);
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(activationKey);
    addToast('info', 'Key Copied', 'Activation Code copied to clipboard.');
  };

  return (
    <Modal
      isOpen={subscriptionModalOpen}
      onClose={() => setSubscriptionModalOpen(false)}
      title="ERP System Activation & Subscription"
      size="lg"
    >
      <div className="space-y-6 select-none">
        
        {/* If Already Subscribed */}
        {isSubscribed ? (
          <div className="space-y-5">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 text-center space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-extrabold text-foreground">ERP Subscription Active</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Your system is fully licensed. All ERP modules and features are unlocked.
              </p>
            </div>

            {/* Generated Activation Code Box */}
            <div className="p-5 rounded-xl bg-card border border-border/80 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-primary" /> Auto-Generated Activation Code
                </span>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Active
                </span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border font-mono text-base font-extrabold text-foreground tracking-wider">
                <span className="flex-1 truncate">{activationKey || 'ERP-ACTV-8942-X92F-2026'}</span>
                <button
                  type="button"
                  onClick={copyKey}
                  className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Copy Activation Code"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                <div>Plan: <strong className="text-foreground">{planName}</strong></div>
                <div>Price: <strong className="text-foreground">Rs. 5,999 / Year</strong></div>
                <div>Activated: <strong className="text-foreground">{activatedAt || '2026-08-20'}</strong></div>
                <div>Expires: <strong className="text-foreground">{expiryDate || '2027-08-20'}</strong></div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => {
                  resetSubscription();
                  addToast('warning', 'Subscription Reset', 'Set system status back to unlicensed for testing.');
                }}
                className="text-xs text-muted-foreground hover:text-destructive underline cursor-pointer"
              >
                Test Lock Mode (Simulate Expired)
              </button>
              <Button variant="primary" onClick={() => setSubscriptionModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* Unsubscribed / Lock Mode */
          <div className="space-y-6">
            
            {/* Upgrade Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/30 text-center space-y-3 relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold shadow-sm flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> BEST VALUE
                </span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground">ERP Full Access Plan</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Subscribe to unlock all modules, unlimited POS billing, multi-warehouse &amp; HRM operations.
                </p>
              </div>
              <div className="pt-2">
                <span className="text-3xl font-black text-primary">Rs. 5,999</span>
                <span className="text-xs font-bold text-muted-foreground"> / 1 Year License</span>
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex rounded-xl bg-muted/40 p-1 border border-border/60">
              <button
                type="button"
                onClick={() => setTab('razorpay')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  tab === 'razorpay' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" /> Razorpay Pay Online (₹5,999)
              </button>
              <button
                type="button"
                onClick={() => setTab('manual')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  tab === 'manual' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Key className="h-3.5 w-3.5" /> Enter Activation Code
              </button>
            </div>

            {/* Tab 1: Razorpay Payment */}
            {tab === 'razorpay' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" /> Instant Auto-Activation with Razorpay
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1.5 pl-5 list-disc">
                    <li>Supports UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking</li>
                    <li>Auto-generates 16-digit official <strong>ERP Activation Code</strong></li>
                    <li>Instantly unlocks all sidebar items for Super Admin &amp; Admin users</li>
                  </ul>
                  <div className="text-[10px] text-muted-foreground font-mono bg-muted/40 p-2 rounded border border-border/40">
                    Merchant Key: <strong className="text-foreground">rzp_test_T3yxQHxDAjRVvh</strong>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  isLoading={loading}
                  onClick={handleRazorpayPayment}
                  className="w-full h-12 text-sm font-extrabold shadow-md rounded-xl"
                >
                  {!loading && <Zap className="h-4 w-4" />}
                  Pay Rs. 5,999 via Razorpay &amp; Unlock Code
                </Button>
              </div>
            )}

            {/* Tab 2: Manual Activation Key */}
            {tab === 'manual' && (
              <form onSubmit={handleManualActivate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5" /> Enter Your ERP Activation Code
                  </label>
                  <input
                    type="text"
                    value={inputKey}
                    onChange={(e) => { setInputKey(e.target.value); setKeyError(''); }}
                    placeholder="e.g. ERP-ACTV-8942-X92F-2026"
                    className={`h-11 w-full rounded-xl border px-4 font-mono text-sm uppercase bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                      keyError ? 'border-destructive' : 'border-border'
                    }`}
                  />
                  {keyError && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3.5 w-3.5" /> {keyError}
                    </p>
                  )}
                </div>

                <Button type="submit" variant="primary" className="w-full h-11 text-sm font-bold rounded-xl">
                  Submit &amp; Activate System
                </Button>
              </form>
            )}

          </div>
        )}
      </div>
    </Modal>
  );
};
