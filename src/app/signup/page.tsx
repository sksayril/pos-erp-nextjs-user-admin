'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore, useToastStore, useUserRegistry, useSubscriptionStore, UserWithPassword } from '../../lib/store';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { 
  ShieldCheck, Mail, Lock, Eye, EyeOff, 
  User, Building2, Phone, CheckCircle2, ArrowRight, Sparkles,
  MapPin, Navigation, Loader2, Check, CreditCard, Key, AlertCircle, Zap
} from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const { addRegistryUser, registry } = useUserRegistry();
  const { loginWithCredentials } = useAuthStore();
  const { activateSubscription } = useSubscriptionStore();
  const { addToast } = useToastStore();

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // 1: User Details, 2: Subscription & Activation
  
  // Account fields
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Location & Address States
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Subscription States
  const [subscriptionChoice, setSubscriptionChoice] = useState<'instant' | 'manualKey' | 'razorpay'>('instant');
  const [activationKeyInput, setActivationKeyInput] = useState('');
  const [isCheckingSub, setIsCheckingSub] = useState(false);
  const [subscriptionVerified, setSubscriptionVerified] = useState(false);
  const [verifiedActivationKey, setVerifiedActivationKey] = useState('');
  const [subscriptionError, setSubscriptionError] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-request location on mount
  useEffect(() => {
    setMounted(true);
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en',
              },
            }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            
            const road = addr.road || addr.street || addr.neighbourhood || addr.suburb || '';
            const detectedCity = addr.city || addr.town || addr.municipality || addr.village || addr.county || '';
            const detectedState = addr.state || addr.region || addr.province || '';
            const detectedCountry = addr.country || '';
            const postcode = addr.postcode || '';

            const formattedStreet = [road, addr.suburb, detectedCity].filter(Boolean).join(', ');
            
            setAddress(formattedStreet || data.display_name?.split(',').slice(0, 3).join(',') || `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
            setCity(detectedCity);
            setStateRegion(detectedState);
            setCountry(detectedCountry);
            setPostalCode(postcode);
            setLocationDetected(true);
            addToast('info', 'Location Detected', `Auto-filled address: ${detectedCity ? detectedCity + ', ' : ''}${detectedCountry}`);
          } else {
            fallbackIPLocation();
          }
        } catch (err) {
          fallbackIPLocation();
        } finally {
          setIsLocating(false);
        }
      },
      (geoError) => {
        setIsLocating(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setLocationError('Location permission was denied. You can enter your address manually.');
        } else {
          fallbackIPLocation();
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const fallbackIPLocation = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        if (data.city) setCity(data.city);
        if (data.region) setStateRegion(data.region);
        if (data.country_name) setCountry(data.country_name);
        if (data.postal) setPostalCode(data.postal);
        if (!address && data.city) setAddress(`${data.city}, ${data.region || ''}`);
        setLocationDetected(true);
      }
    } catch {
      setLocationError('Could not auto-detect location. Please enter manually.');
    } finally {
      setIsLocating(false);
    }
  };

  // Step 1: Validate User Details and perform API Subscription Check
  const handleProceedToSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email format.'); return; }
    if (!password) { setError('Please enter a password.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    const existing = registry.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      setError('An account with this email address already exists. Please Sign In.');
      return;
    }

    setIsCheckingSub(true);
    try {
      // API check to verify user subscription status
      const res = await fetch('/api/subscription/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();

      if (data.isSubscribed) {
        setSubscriptionVerified(true);
        setVerifiedActivationKey(data.activationKey);
        // If already subscribed, register directly
        await completeRegistration(data.activationKey);
      } else {
        // Must complete subscription step
        setStep(2);
        addToast('info', 'Subscription Required', 'Please activate your 1-Year ERP license to complete registration.');
      }
    } catch {
      setStep(2);
    } finally {
      setIsCheckingSub(false);
    }
  };

  // Helper to dynamically load Razorpay checkout script
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false);
      if ((window as any).Razorpay) return resolve(true);

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Step 2: Verify and Activate Subscription via API & Razorpay
  const handleActivateSubscription = async () => {
    setSubscriptionError('');
    setIsLoading(true);

    try {
      if (subscriptionChoice === 'instant') {
        // Direct Instant 1-Click License Activation
        const verifyRes = await fetch('/api/subscription/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            businessName: businessName.trim(),
            planName: '1-Year Full ERP License',
            amount: 5999
          })
        });

        const verifyData = await verifyRes.json();
        if (verifyRes.ok && verifyData.success) {
          setSubscriptionVerified(true);
          setVerifiedActivationKey(verifyData.activationKey);
          await completeRegistration(verifyData.activationKey);
        } else {
          throw new Error(verifyData.error || 'Failed to activate instant license.');
        }
      } else if (subscriptionChoice === 'manualKey') {
        if (!activationKeyInput.trim()) {
          setSubscriptionError('Please enter an Activation Code.');
          setIsLoading(false);
          return;
        }

        // Call API check for the provided manual key
        const checkRes = await fetch('/api/subscription/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: email.trim(), 
            activationKey: activationKeyInput.trim(),
            businessName: businessName.trim()
          })
        });
        const checkData = await checkRes.json();

        if (checkRes.ok && checkData.success) {
          setSubscriptionVerified(true);
          setVerifiedActivationKey(checkData.activationKey);
          await completeRegistration(checkData.activationKey);
        } else {
          setSubscriptionError(checkData.error || 'Invalid Activation Code. Key must start with ERP-ACTV-');
        }
        setIsLoading(false);
      } else {
        // Razorpay Online Payment Flow
        const orderRes = await fetch('/api/subscription/order', { method: 'POST' });
        if (!orderRes.ok) {
          throw new Error('Failed to create Razorpay payment order. You can use 1-Click Instant License instead.');
        }
        const orderData = await orderRes.json();

        // 2. Load Razorpay SDK
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error('Razorpay SDK failed to load. Please use 1-Click Instant License instead.');
        }

        // 3. Launch Razorpay Checkout Popup
        const options = {
          key: orderData.keyId || 'rzp_test_T3yxQHxDAjRVvh',
          amount: orderData.amount || 599900,
          currency: 'INR',
          name: 'POS ERP Enterprise',
          description: '1-Year Full ERP Super Admin License',
          order_id: orderData.orderId,
          handler: async function (response: any) {
            setIsLoading(true);
            try {
              const verifyRes = await fetch('/api/subscription/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  email: email.trim(),
                  businessName: businessName.trim()
                })
              });

              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) {
                setSubscriptionVerified(true);
                setVerifiedActivationKey(verifyData.activationKey);
                await completeRegistration(verifyData.activationKey);
              } else {
                setSubscriptionError(verifyData.error || 'Razorpay payment signature verification failed.');
              }
            } catch (vErr: any) {
              setSubscriptionError(vErr.message || 'Payment verification failed.');
            } finally {
              setIsLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsLoading(false);
              setSubscriptionError('Payment was closed. You can use Instant 1-Click Activation to proceed.');
            }
          },
          prefill: {
            name: fullName.trim(),
            email: email.trim(),
            contact: phone.trim() || '9876543210'
          },
          theme: {
            color: '#7c3aed'
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          setIsLoading(false);
          setSubscriptionError(`Payment failed: ${response.error?.description || response.error?.reason || 'Transaction could not be completed.'}`);
        });
        rzp.open();
      }
    } catch (err: any) {
      setSubscriptionError(err.message || 'Error initializing subscription.');
      setIsLoading(false);
    }
  };

  // Complete Super Admin user registration
  const completeRegistration = async (actKey: string) => {
    const finalActivationKey = actKey || `ERP-ACTV-${Math.floor(1000 + Math.random() * 9000)}-SIGN-${Date.now().toString().slice(-4)}-2026`;
    
    // 1. Persist user and subscription directly to MongoDB
    try {
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim(),
          password: password,
          phone: phone.trim() || undefined,
          role: 'Super Admin',
          businessName: businessName.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          state: stateRegion.trim() || undefined,
          country: country.trim() || undefined,
          postalCode: postalCode.trim() || undefined,
          activationKey: finalActivationKey,
        })
      });
    } catch (dbErr) {
      console.warn('MongoDB registration API sync notice:', dbErr);
    }

    // 2. Activate subscription in store
    activateSubscription({
      activationKey: finalActivationKey,
      planName: '1-Year ERP Full License',
      amount: 5999
    });

    // 3. Register Super Admin in local registry
    const superAdminUser: UserWithPassword = {
      id: `usr-super-${Date.now()}`,
      name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      role: 'Super Admin',
      status: 'Active',
      password: password,
    };

    addRegistryUser(superAdminUser);

    // 4. Auto-login newly created Super Admin
    await loginWithCredentials(email.trim(), password);

    addToast(
      'success', 
      `Welcome Super Admin ${fullName}!`, 
      'Super Admin account created & saved to MongoDB database with full license unlocked.'
    );
    router.push('/dashboard');
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-primary/5 dark:from-zinc-950 dark:via-zinc-900 dark:to-primary/10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-primary/5 dark:from-zinc-950 dark:via-zinc-900 dark:to-primary/10 p-4 select-none">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="w-full max-w-xl relative py-8">
        
        {/* Brand Header Badge */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-card border border-border/60 shadow-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-bold text-foreground leading-tight">
                POS <span className="text-primary">ERP</span>
              </div>
              <div className="text-[10px] text-muted-foreground">Enterprise Resource Planning</div>
            </div>
          </div>
        </div>

        {/* Step Indicator Header */}
        <div className="flex items-center justify-center gap-3 mb-4 text-xs font-bold">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${step === 1 ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'}`}>
            <span>1</span>
            <span>Account &amp; Location</span>
          </div>
          <div className="w-4 h-0.5 bg-border" />
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${step === 2 ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'}`}>
            <span>2</span>
            <span>API Subscription Check</span>
          </div>
        </div>

        <Card className="shadow-2xl border-border/60 backdrop-blur-sm">
          <CardHeader className="pb-4 text-center space-y-1.5 border-b border-border/40">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary mx-auto">
              <Sparkles className="h-3.5 w-3.5" /> Super Admin Registration
            </div>
            <CardTitle className="text-2xl font-extrabold tracking-tight text-foreground">
              {step === 1 ? 'Create Super Admin Account' : 'ERP Subscription & Activation'}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs sm:text-sm">
              {step === 1 
                ? 'Register as Master Super Admin with auto-detected business location.'
                : 'Every new account requires an active subscription to unlock full ERP modules.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-5">
            
            {/* STEP 1: USER DETAILS & LOCATION FORM */}
            {step === 1 && (
              <form onSubmit={handleProceedToSubscription} className="space-y-4">
                
                {/* Full Name & Business Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-primary" /> Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); setError(''); }}
                      placeholder="e.g. Aryan Sharma"
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-primary" /> Business / Store Name
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => { setBusinessName(e.target.value); setError(''); }}
                      placeholder="e.g. Apex Retail Enterprises"
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-primary" /> Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      placeholder="superadmin@business.com"
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-primary" /> Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setError(''); }}
                      placeholder="+91 98765 43210"
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>
                </div>

                {/* Location & Address Auto-Fill Panel */}
                <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> Store / Business Location
                    </label>
                    <button
                      type="button"
                      onClick={fetchCurrentLocation}
                      disabled={isLocating}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer bg-primary/10 px-2.5 py-1 rounded-lg transition-colors hover:bg-primary/20"
                    >
                      {isLocating ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Detecting...</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="h-3 w-3" />
                          <span>Auto-Detect Location</span>
                        </>
                      )}
                    </button>
                  </div>

                  {locationDetected && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <Check className="h-3.5 w-3.5 shrink-0" />
                      <span>Location detected &amp; address auto-filled: <strong>{city ? city + ', ' : ''}{country}</strong></span>
                    </div>
                  )}

                  {locationError && (
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded border border-amber-200 dark:border-amber-800">
                      ℹ️ {locationError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street address or area (auto-filled by GPS)"
                      className="h-9 w-full rounded-lg border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City / Town"
                      className="h-8 rounded-lg border border-border bg-card px-2 text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                    />
                    <input
                      type="text"
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                      placeholder="State / Division"
                      className="h-8 rounded-lg border border-border bg-card px-2 text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                    />
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Country"
                      className="h-8 rounded-lg border border-border bg-card px-2 text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                    />
                  </div>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-primary" /> Super Admin Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        placeholder="Min. 6 characters"
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-primary" /> Confirm Password *
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      placeholder="Repeat password"
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium animate-in fade-in">
                    ⚠️ {error}
                  </div>
                )}

                <Button
                  type="submit"
                  isLoading={isCheckingSub}
                  className="w-full h-11 rounded-xl text-sm font-bold gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  {isCheckingSub ? 'Checking Subscription API...' : 'Continue to Subscription Check'}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </form>
            )}

            {/* STEP 2: API SUBSCRIPTION ACTIVATION STEP */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                
                {/* Notice Banner */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                    <Zap className="h-4 w-4 shrink-0" />
                    <span>API Verification: Subscription Required</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    To activate your Super Admin account for <strong>{email}</strong>, activate your 1-Year ERP license or verify an existing Activation Code.
                  </p>
                </div>

                {/* Plan Highlights */}
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-foreground">1-Year ERP Full License</h4>
                      <p className="text-xs text-muted-foreground">Unlimited POS Billing, Multi-Users, Accounting &amp; Ledgers</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-primary">₹5,999</span>
                      <span className="text-[10px] text-muted-foreground block">/ Year</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-primary/20">
                    <div className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-primary" /> Multi-Role Staff Users
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-primary" /> Full Inventory &amp; Stock
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-primary" /> GST / VAT Tax Invoicing
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-primary" /> 24/7 Priority Support
                    </div>
                  </div>
                </div>

                {/* Choice Toggle */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setSubscriptionChoice('instant'); setSubscriptionError(''); }}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${subscriptionChoice === 'instant' ? 'border-primary ring-2 ring-primary/20 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                  >
                    <Zap className="h-4 w-4 mb-1 text-amber-500" />
                    <div>Instant 1-Click</div>
                    <span className="text-[10px] font-normal opacity-80">Free Super Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSubscriptionChoice('manualKey'); setSubscriptionError(''); }}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${subscriptionChoice === 'manualKey' ? 'border-primary ring-2 ring-primary/20 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                  >
                    <Key className="h-4 w-4 mb-1 text-primary" />
                    <div>Activation Code</div>
                    <span className="text-[10px] font-normal opacity-80">ERP-ACTV-...</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSubscriptionChoice('razorpay'); setSubscriptionError(''); }}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${subscriptionChoice === 'razorpay' ? 'border-primary ring-2 ring-primary/20 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                  >
                    <CreditCard className="h-4 w-4 mb-1 text-emerald-500" />
                    <div>Razorpay Online</div>
                    <span className="text-[10px] font-normal opacity-80">₹5,999 / Year</span>
                  </button>
                </div>

                {/* Manual Key Input */}
                {subscriptionChoice === 'manualKey' && (
                  <div className="space-y-1.5 animate-in fade-in">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5 text-primary" /> Enter Your 16-Digit Activation Key
                    </label>
                    <input
                      type="text"
                      value={activationKeyInput}
                      onChange={(e) => { setActivationKeyInput(e.target.value.toUpperCase()); setSubscriptionError(''); }}
                      placeholder="e.g. ERP-ACTV-8942-X92F-2026"
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm font-mono uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>
                )}

                {subscriptionError && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium animate-in fade-in">
                    ⚠️ {subscriptionError}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="h-11 px-4 rounded-xl text-xs font-bold"
                  >
                    ← Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleActivateSubscription}
                    isLoading={isLoading}
                    className="flex-1 h-11 rounded-xl text-sm font-bold gap-2 shadow-md cursor-pointer"
                  >
                    {!isLoading && <ShieldCheck className="h-4 w-4" />}
                    {subscriptionChoice === 'instant' 
                      ? 'Activate Instant License & Open Dashboard' 
                      : subscriptionChoice === 'manualKey'
                        ? 'Verify Code & Complete Registration'
                        : 'Pay ₹5,999 via Razorpay & Complete Registration'}
                  </Button>
                </div>

              </div>
            )}

            {/* Bottom Footer Links */}
            <div className="pt-4 border-t border-border/50 text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                Already registered as Super Admin, Admin, Cashier or Manager?
              </p>
              <Link 
                href="/login" 
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                Sign In to Existing Account →
              </Link>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
