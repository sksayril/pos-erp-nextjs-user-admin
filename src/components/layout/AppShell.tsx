'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore, usePermissionStore, useUIStore } from '../../lib/store';
import { useTranslation } from '../../lib/i18n';
import { useRouter, usePathname } from 'next/navigation';
import { BottomTabBar } from './BottomTabBar';
import { ShieldAlert, ArrowLeft, ShoppingCart, LayoutDashboard } from 'lucide-react';
import { Button } from '../ui/Button';

interface AppShellProps {
  children: React.ReactNode;
}

const routePermissionMap: Array<{ prefix: string; moduleKey: string }> = [
  { prefix: '/dashboard', moduleKey: 'dashboard' },
  { prefix: '/pos', moduleKey: 'pos' },
  { prefix: '/products', moduleKey: 'products' },
  { prefix: '/purchases', moduleKey: 'purchases' },
  { prefix: '/sales', moduleKey: 'sales' },
  { prefix: '/expenses', moduleKey: 'expenses' },
  { prefix: '/quotations', moduleKey: 'quotations' },
  { prefix: '/transfers', moduleKey: 'transfers' },
  { prefix: '/warehouses', moduleKey: 'transfers' },
  { prefix: '/returns', moduleKey: 'returns' },
  { prefix: '/accounting', moduleKey: 'accounting' },
  { prefix: '/hrm', moduleKey: 'hrm' },
  { prefix: '/people', moduleKey: 'people' },
  { prefix: '/reports', moduleKey: 'reports' },
  { prefix: '/settings/users', moduleKey: 'users' },
  { prefix: '/settings/roles', moduleKey: 'users' },
  { prefix: '/settings/permissions', moduleKey: 'users' },
  { prefix: '/distributor-users', moduleKey: 'distributorUsers' },
  { prefix: '/settings', moduleKey: 'settings' },
  { prefix: '/documentation', moduleKey: 'documentation' },
];

export const AppShell = ({ children }: AppShellProps) => {
  const [mounted, setMounted] = useState(false);
  const { user } = useAuthStore();
  const { loadPermissions, hasPermission } = usePermissionStore();
  const { colorTheme, applyColorTheme } = useUIStore();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply visual theme color variables on mount / change
  useEffect(() => {
    if (mounted) {
      applyColorTheme(colorTheme);
    }
  }, [mounted, colorTheme, applyColorTheme]);

  // Load live permissions from MongoDB
  useEffect(() => {
    if (mounted) {
      loadPermissions();
    }
  }, [mounted, loadPermissions]);

  // Auth guard check
  useEffect(() => {
    if (mounted && !user) {
      router.push('/login');
    }
  }, [mounted, user, router]);

  if (!mounted || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // RBAC Permission Check
  let isUnauthorized = false;
  if (user.role !== 'Super Admin') {
    const matched = routePermissionMap.find(r => pathname === r.prefix || pathname.startsWith(r.prefix + '/'));
    if (matched && !hasPermission(user.role, matched.moduleKey as any)) {
      isUnauthorized = true;
    }
  }

  const defaultHomeRoute = hasPermission(user.role, 'dashboard')
    ? '/dashboard'
    : hasPermission(user.role, 'pos')
      ? '/pos'
      : hasPermission(user.role, 'hrm')
        ? '/hrm/employees'
        : '/login';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background select-none">
      {/* Collapsible Left Navigation */}
      <Sidebar />

      {/* Main Right Content Panel */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Navigation Toolbar */}
        <Header />
        
        {/* Scrollable Viewport Wrapper */}
        <div className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/20 pb-16 lg:pb-0">
          {isUnauthorized ? (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center animate-in fade-in">
              <div className="max-w-md w-full p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 mx-auto">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Access Restricted</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Your assigned role <span className="font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">🛡 {user.role}</span> does not have permission to access this module.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => router.push(defaultHomeRoute)}
                    className="gap-1.5"
                  >
                    {defaultHomeRoute === '/pos' ? <ShoppingCart className="h-4 w-4" /> : <LayoutDashboard className="h-4 w-4" />}
                    Return to Permitted Area
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </div>

      {/* Mobile Sticky Tab Bar layout */}
      <BottomTabBar />
    </div>
  );
};
