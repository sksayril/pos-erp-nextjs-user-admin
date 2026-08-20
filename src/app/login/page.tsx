'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useToastStore, usePermissionStore, useUserRegistry } from '../../lib/store';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle, Users } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithCredentials } = useAuthStore();
  const { loadPermissions } = usePermissionStore();
  const { registry } = useUserRegistry();
  const { addToast } = useToastStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Quick-fill for demo users
  const quickFillUsers = [
    { label: 'Super Admin', email: 'aryan@erp.com', password: 'password123' },
    { label: 'Admin', email: 'priya@erp.com', password: 'password123' },
    { label: 'Cashier', email: 'sneha@erp.com', password: 'password123' },
    { label: 'Accountant', email: 'karan@erp.com', password: 'password123' },
    { label: 'HR Manager', email: 'ananya@erp.com', password: 'password123' },
    { label: 'Manager', email: 'rahul@erp.com', password: 'password123' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!password.trim()) { setError('Please enter your password.'); return; }

    setIsLoading(true);
    // Small delay for UX
    await new Promise(r => setTimeout(r, 600));

    const result = loginWithCredentials(email.trim(), password);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Login failed');
      return;
    }

    // Load permissions for this session
    await loadPermissions();

    // Find the logged-in user info
    const found = registry.find(u => u.email.toLowerCase() === email.toLowerCase());
    addToast('success', `Welcome back, ${found?.name || 'User'}!`, `Signed in as ${found?.role}.`);
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-primary/5 dark:from-zinc-950 dark:via-zinc-900 dark:to-primary/10 p-4">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/8 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Brand Badge */}
        <div className="flex justify-center mb-8">
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
              Sign In
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Use your credentials created by the administrator
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                className="w-full h-11 rounded-xl text-sm font-semibold"
              >
                {!isLoading && <ShieldCheck className="h-4 w-4" />}
                Sign In to Dashboard
              </Button>
            </form>

            {/* Quick Fill Demo Users */}
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center gap-1.5 mb-3">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Fill — Demo Accounts</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {quickFillUsers.map(u => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => {
                      setEmail(u.email);
                      setPassword(u.password);
                      setError('');
                    }}
                    className="text-left px-3 py-2 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <div className="text-xs font-bold text-foreground group-hover:text-primary truncate">{u.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{u.email}</div>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-3">
                All demo accounts use password: <code className="font-mono font-bold text-foreground bg-muted px-1 py-0.5 rounded">password123</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
