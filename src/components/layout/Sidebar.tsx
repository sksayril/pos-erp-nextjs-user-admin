'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { navigationConfig, getActiveParentName } from '../../lib/navigation';
import { useUIStore, useAuthStore, usePermissionStore, useSubscriptionStore } from '../../lib/store';
import { SubscriptionModal } from '../subscription/SubscriptionModal';
import { Button } from '../ui/Button';
import { ChevronDown, ChevronRight, Menu, X, Lock, Key, Sparkles, ShieldCheck } from 'lucide-react';

const permissionMap: Record<string, string> = {
  'Dashboard': 'dashboard',
  'POS': 'pos',
  'Product': 'products',
  'Purchase': 'purchases',
  'Sale': 'sales',
  'E-Waybill': 'waybill',
  'Expense': 'expenses',
  'Quotation': 'quotations',
  'Transfer': 'transfers',
  'Return': 'returns',
  'Accounting': 'accounting',
  'HRM': 'hrm',
  'People': 'people',
  'Reports': 'reports',
  'Settings': 'settings',
  'Distributor Users': 'distributorUsers',
  'Documentation': 'documentation',
  'Users': 'users',
};

// Always accessible without subscription
const UNLOCKED_ALWAYS = ['Dashboard', 'Documentation'];

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, sidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const { hasPermission } = usePermissionStore();
  const { isSubscribed, activationKey, setSubscriptionModalOpen } = useSubscriptionStore();
  
  const role = user?.role || 'Super Admin';

  const activeParent = getActiveParentName(pathname);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    [activeParent]: true,
  });

  const toggleMenu = (name: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const isLinkActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href !== '/dashboard' && pathname.startsWith(href)) return true;
    return false;
  };

  const handleLockedClick = (e: React.MouseEvent, itemName: string) => {
    if (!isSubscribed && !UNLOCKED_ALWAYS.includes(itemName)) {
      e.preventDefault();
      setSubscriptionModalOpen(true);
    }
  };

  const renderNavItems = () => {
    return navigationConfig
      .filter((item) => {
        const key = permissionMap[item.name] as any;
        return hasPermission(role, key);
      })
      .map((item) => {
        const Icon = item.icon;
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isExpanded = expandedMenus[item.name];
        const isActive = item.href ? isLinkActive(item.href) : getActiveParentName(pathname) === item.name;
        const isLocked = !isSubscribed && !UNLOCKED_ALWAYS.includes(item.name);

        if (sidebarCollapsed) {
          return (
            <div key={item.name} className="relative group/item w-full flex justify-center py-1 select-none">
              <Link
                href={isLocked ? '#' : (item.href || (hasSubItems ? item.subItems![0].href : '#'))}
                onClick={(e) => handleLockedClick(e, item.name)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors cursor-pointer relative ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-zinc-650 dark:text-zinc-400 hover:bg-primary/10 hover:text-primary'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {isLocked && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center">
                    <Lock className="h-2.5 w-2.5" />
                  </span>
                )}
              </Link>
            </div>
          );
        }

        return (
          <div key={item.name} className="w-full select-none">
            {hasSubItems ? (
              <div>
                <button
                  onClick={(e) => {
                    if (isLocked) {
                      handleLockedClick(e, item.name);
                    } else {
                      toggleMenu(item.name);
                    }
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer group ${
                    isActive 
                      ? 'bg-primary/10 text-primary font-bold' 
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-primary/5 hover:text-primary'
                  } ${isLocked ? 'opacity-80' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-primary' : 'text-zinc-500 group-hover:text-primary'}`} />
                    <span>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isLocked ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Lock className="h-2.5 w-2.5" /> Lock
                      </span>
                    ) : isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-zinc-500 group-hover:text-primary" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-primary" />
                    )}
                  </div>
                </button>

                {isExpanded && !isLocked && (
                  <div className="mt-1 ml-4 pl-3 border-l border-zinc-200 dark:border-zinc-800 space-y-0.5 animate-in slide-in-from-left-2 duration-150">
                    {item.subItems!.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className={`flex items-center w-full px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                            isSubActive
                              ? 'text-primary bg-primary/10 font-bold pl-4'
                              : 'text-zinc-650 dark:text-zinc-400 hover:text-primary hover:bg-primary/5 hover:pl-4'
                          }`}
                        >
                          {sub.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={isLocked ? '#' : item.href!}
                onClick={(e) => handleLockedClick(e, item.name)}
                className={`flex w-full items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-primary/5 hover:text-primary'
                } ${isLocked ? 'opacity-80' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-current' : 'text-zinc-500 hover:text-primary'}`} />
                  <span>{item.name}</span>
                </div>
                {isLocked && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Lock className="h-2.5 w-2.5" /> Lock
                  </span>
                )}
              </Link>
            )}
          </div>
        );
      });
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-xs lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-card border-r border-border/80 transition-all duration-300 lg:static ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-border/80 bg-card">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <span className="font-extrabold text-base">P</span>
            </div>
            {!sidebarCollapsed && (
              <span className="text-base font-bold tracking-tight text-foreground">
                POS <span className="text-primary">ERP</span>
              </span>
            )}
          </div>
          <button 
            className="lg:hidden text-zinc-500 hover:text-foreground cursor-pointer"
            onClick={toggleSidebar}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Subscription Lock Banner (when not subscribed) */}
        {!sidebarCollapsed && !isSubscribed && (
          <div className="m-3 p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-primary/10 border border-amber-500/30 text-xs space-y-2 select-none animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
              <Lock className="h-4 w-4 shrink-0" />
              <span>Subscription Required</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Modules are locked. Subscribe for ₹5,999/Yr to generate Activation Code &amp; unlock.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setSubscriptionModalOpen(true)}
              className="w-full h-8 text-xs font-bold gap-1 rounded-lg"
            >
              <Sparkles className="h-3.5 w-3.5" /> Unlock System
            </Button>
          </div>
        )}

        {/* Active Activation Code Banner (when subscribed) */}
        {!sidebarCollapsed && isSubscribed && (
          <div className="m-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1 select-none">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 text-[11px]">
                <ShieldCheck className="h-3.5 w-3.5" /> Active License
              </span>
              <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                1-YEAR
              </span>
            </div>
            <div className="font-mono text-[10px] font-bold text-foreground truncate">
              Key: {activationKey || 'ERP-ACTV-8942-X92F-2026'}
            </div>
          </div>
        )}

        {/* Navigation list items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 scrollbar-thin scrollbar-thumb-zinc-300">
          {renderNavItems()}
        </div>

        {/* User Footer Panel */}
        {!sidebarCollapsed && user && (
          <div className="p-4 border-t border-border/60 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate text-foreground leading-tight">{user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{user.role}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Activation & Subscription Modal */}
      <SubscriptionModal />
    </>
  );
};
