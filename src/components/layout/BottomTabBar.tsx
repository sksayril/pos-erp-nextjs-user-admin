'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, Settings, Menu } from 'lucide-react';
import { useUIStore } from '../../lib/store';

export const BottomTabBar = () => {
  const pathname = usePathname();
  const { toggleSidebar } = useUIStore();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'POS Terminal', href: '/pos', icon: ShoppingCart },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Settings', href: '/settings/system', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href !== '/dashboard' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-card/85 backdrop-blur-lg border-t border-border/80 flex items-center justify-around z-30 lg:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.05)] select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all active:scale-95 ${
              active 
                ? 'text-primary font-extrabold' 
                : 'text-zinc-500 dark:text-zinc-400 hover:text-primary'
            }`}
          >
            <Icon className={`h-5 w-5 shrink-0 transition-transform ${active ? 'scale-110' : ''}`} />
            <span className="text-[10px] tracking-tight">{item.name}</span>
          </Link>
        );
      })}
      
      {/* Mobile Drawer Trigger Menu */}
      <button
        onClick={toggleSidebar}
        className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-zinc-500 dark:text-zinc-400 hover:text-primary cursor-pointer border-0 bg-transparent focus:outline-none active:scale-95 transition-all"
      >
        <Menu className="h-5 w-5 shrink-0" />
        <span className="text-[10px] tracking-tight">Menu</span>
      </button>
    </div>
  );
};
