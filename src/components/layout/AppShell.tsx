'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore, usePermissionStore, useUIStore } from '../../lib/store';
import { useRouter } from 'next/navigation';
import { BottomTabBar } from './BottomTabBar';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  const [mounted, setMounted] = useState(false);
  const { user } = useAuthStore();
  const { loadPermissions } = usePermissionStore();
  const { colorTheme, applyColorTheme } = useUIStore();
  const router = useRouter();

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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Collapsible Left Navigation */}
      <Sidebar />

      {/* Main Right Content Panel */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Navigation Toolbar */}
        <Header />
        
        {/* Scrollable Viewport Wrapper */}
        <div className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/20 pb-16 lg:pb-0">
          {children}
        </div>
      </div>

      {/* Mobile Sticky Tab Bar layout */}
      <BottomTabBar />
    </div>
  );
};
