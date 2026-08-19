'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useToastStore } from '../../lib/store';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { UserRole } from '../../lib/types';
import { ShieldCheck, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { addToast } = useToastStore();
  
  const [email, setEmail] = useState('admin@erp.com');
  const [password, setPassword] = useState('password');
  const [role, setRole] = useState<UserRole>('Super Admin');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      login(email, role);
      setIsLoading(false);
      addToast('success', 'Welcome Back', `Logged in successfully as ${role}.`);
      router.push('/dashboard');
    }, 1000);
  };

  const simulationRoles: UserRole[] = [
    'Super Admin',
    'Admin',
    'Manager',
    'Cashier',
    'Accountant',
    'HR Manager',
    'Warehouse Manager',
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-6 select-none">
      <Card className="w-full max-w-md shadow-xl border-border/80">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm mb-2">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Sign In to POS <span className="text-primary">ERP</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            Choose a mock role below to test the permissions shell
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>
            </div>

            {/* Role Simulation Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Simulation Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              >
                {simulationRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Login button */}
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full mt-6 h-11"
            >
              Sign In to Dashboard
            </Button>

            {/* Auto fill credentials shortcut hint */}
            <div className="text-[10px] text-center text-muted-foreground/80 mt-4 leading-relaxed">
              Default password: <span className="font-semibold text-foreground">password</span>. No live backend connectivity is required.
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
