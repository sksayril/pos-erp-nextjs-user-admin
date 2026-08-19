'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigationConfig, getActiveParentName } from '../../lib/navigation';
import { useUIStore, useAuthStore, usePermissionStore } from '../../lib/store';
import { ChevronDown, ChevronRight, Menu, X } from 'lucide-react';

const permissionMap: Record<string, string> = {
  'Dashboard': 'dashboard',
  'POS': 'pos',
  'Product': 'products',
  'Purchase': 'purchases',
  'Sale': 'sales',
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
  'Documentation': 'documentation'
};

export const Sidebar = () => {
  const pathname = usePathname();
  const { sidebarCollapsed, sidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const { hasPermission } = usePermissionStore();
  
  const role = user?.role || 'Super Admin';

  // Track open states for expandable folders in the sidebar
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

      if (sidebarCollapsed) {
        // Collapsed mode: render icon + hover popover callout
        return (
          <div key={item.name} className="relative group/item w-full flex justify-center py-1 select-none">
            <Link
              href={item.href || (hasSubItems ? item.subItems![0].href : '#')}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-zinc-650 dark:text-zinc-400 hover:bg-primary/10 hover:text-primary'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
            </Link>

            {/* Hover Popover Callout */}
            <div className="absolute left-full top-1 ml-2 w-48 bg-card border border-border shadow-lg rounded-lg p-2 hidden group-hover/item:flex flex-col gap-1 z-50 pointer-events-auto animate-in fade-in slide-in-from-left-2 duration-150">
              <div className="px-2 py-1 text-xs font-bold text-foreground border-b border-border/50 mb-1">
                {item.name}
              </div>
              {hasSubItems && (
                <div className="flex flex-col gap-0.5">
                  {item.subItems!.map((sub) => {
                    const isSubActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.name}
                        href={sub.href}
                        className={`px-2 py-1 text-[11px] font-semibold rounded transition-colors ${
                          isSubActive
                            ? 'text-primary bg-primary/10 font-bold'
                            : 'text-zinc-650 dark:text-zinc-400 hover:text-primary hover:bg-primary/5'
                        }`}
                      >
                        {sub.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      }

      // Expanded mode: render normal collapsible items
      return (
        <div key={item.name} className="w-full select-none">
          {hasSubItems ? (
            <div>
              {/* Expandable Header */}
              <button
                onClick={() => toggleMenu(item.name)}
                className={`flex w-full items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer group ${
                  isActive 
                    ? 'bg-primary/10 text-primary font-bold' 
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-primary/5 hover:text-primary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-primary' : 'text-zinc-500 group-hover:text-primary'}`} />
                  <span>{item.name}</span>
                </div>
                <div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-zinc-500 group-hover:text-primary" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-primary" />
                  )}
                </div>
              </button>

              {/* Sub items dropdown */}
              {isExpanded && (
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
            /* Single leaf link */
            <Link
              href={item.href!}
              className={`flex w-full items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-primary/5 hover:text-primary'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-current' : 'text-zinc-500 hover:text-primary'}`} />
              <span>{item.name}</span>
            </Link>
          )}
        </div>
      );
    });
  };

  return (
    <>
      {/* Mobile Backdrop drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-xs lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main Sidebar Panel container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-card border-r border-border/80 transition-all duration-300 lg:static ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Sidebar Header Brand panel */}
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

        {/* Navigation list items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin scrollbar-thumb-zinc-300">
          {renderNavItems()}
        </div>

        {/* Sidebar user footer info box */}
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
    </>
  );
};
