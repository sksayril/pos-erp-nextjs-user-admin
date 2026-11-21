'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore, useToastStore, usePermissionStore, useUserRegistry } from '../../lib/store';
import { useTranslation } from '../../lib/i18n';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { 
  ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle, 
  UserPlus, Sparkles, Globe 
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithCredentials } = useAuthStore();
  const { loadPermissions, hasPermission } = usePermissionStore();
  const { registry } = useUserRegistry();
  const { addToast } = useToastStore();
  const { t, language, setLanguage, supportedLanguages, currentLanguageOption } = useTranslation();

  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [langOpen, setLangOpen] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!password.trim()) { setError('Please enter your password.'); return; }

    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600));

    const result = await loginWithCredentials(email.trim(), password);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Login failed');
      return;
    }

    // Load permissions for this session
    await loadPermissions();

    // Find the logged-in user info
    const found = registry.find(u => u.email.toLowerCase() === email.toLowerCase());
    const role = found?.role || 'Super Admin';
    addToast('success', `Welcome back, ${found?.name || 'User'}!`, `Signed in as ${role}.`);

    // Intelligent role-based starting landing page
    if (role === 'Cashier' || (!hasPermission(role, 'dashboard') && hasPermission(role, 'pos'))) {
      router.push('/pos');
    } else if (!hasPermission(role, 'dashboard') && hasPermission(role, 'hrm')) {
      router.push('/hrm/employees');
    } else {
      router.push('/dashboard');
    }
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
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/8 blur-3xl" />
      </div>

      {/* Floating Language Switcher */}
      <div className="fixed top-4 right-4 z-20">
        <div className="relative">
          <button
            type="button"
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-md border border-border shadow-sm text-xs font-semibold text-foreground hover:bg-card transition-all cursor-pointer"
          >
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span>{currentLanguageOption.flag} {currentLanguageOption.nativeLabel}</span>
          </button>
          {langOpen && (
            <div className="absolute right-0 mt-2 w-36 rounded-xl border border-border bg-card p-1 shadow-lg z-50">
              {supportedLanguages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => { setLanguage(l.code); setLangOpen(false); }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg text-foreground hover:bg-muted cursor-pointer ${language === l.code ? 'bg-primary/10 text-primary font-bold' : ''}`}
                >
                  <span>{l.flag}</span>
                  <span>{l.nativeLabel}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-md relative py-6">
        
        {/* Brand Badge */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-card border border-border/60 shadow-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-bold text-foreground leading-tight">POS <span className="text-primary">ERP</span></div>
              <div className="text-[10px] text-muted-foreground">Enterprise Resource Planning</div>
            </div>
          </div>
        </div>

        <Card className="shadow-2xl border-border/60">
          <CardHeader className="pb-4 text-center space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              {t('Sign Out') === 'Sign Out' ? 'Sign In' : (language === 'bn' ? 'সাইন ইন করুন' : 'Iniciar Sesión')}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs sm:text-sm">
              Enter your credentials to access the ERP dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="Enter your email"
                    className={`h-11 w-full rounded-xl border bg-card pl-4 pr-4 text-sm text-foreground transition focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary ${error ? 'border-destructive' : 'border-border'}`}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> Password
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Enter your password"
                    className={`h-11 w-full rounded-xl border bg-card pl-4 pr-10 text-sm text-foreground transition focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary ${error ? 'border-destructive' : 'border-border'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full h-11 rounded-xl text-sm font-semibold cursor-pointer shadow-md"
              >
                {!isLoading && <ShieldCheck className="h-4 w-4" />}
                Sign In to System
              </Button>
            </form>

            {/* Prominent Super Admin Signup CTA */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 text-center space-y-1.5">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-primary">
                <Sparkles className="h-3.5 w-3.5" /> New Business Owner?
              </div>
              <p className="text-[11px] text-muted-foreground">
                Register as Super Admin to manage Admins, Cashiers, Staff &amp; Billing.
              </p>
              <Link href="/signup">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs font-bold gap-1 rounded-lg border-primary/30 text-primary hover:bg-primary/10 mt-1 cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Create Super Admin Account
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

