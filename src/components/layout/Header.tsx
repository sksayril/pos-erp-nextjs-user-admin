'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUIStore, useAuthStore, useToastStore } from '../../lib/store';
import { Breadcrumb } from './Breadcrumb';
import { Button } from '../ui/Button';
import { UserRole } from '../../lib/types';
import { 
  Menu, Moon, Sun, Maximize, ShoppingCart, 
  Printer, Globe, User, LogOut, ChevronDown, Check 
} from 'lucide-react';

export const Header = () => {
  const router = useRouter();
  const { toggleSidebar, theme, toggleTheme, language, setLanguage } = useUIStore();
  const { user, logout, switchRole } = useAuthStore();
  const { addToast } = useToastStore();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        addToast('error', 'Fullscreen Error', 'Could not activate fullscreen mode.');
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleLogout = () => {
    logout();
    addToast('info', 'Logged Out', 'Successfully logged out of your session.');
    router.push('/login');
  };

  const handleRoleSwitch = (role: UserRole) => {
    switchRole(role);
    addToast('success', 'Role Updated', `Switched workspace permissions to: ${role}`);
    setProfileDropdownOpen(false);
  };

  const rolesList: UserRole[] = [
    'Super Admin', 'Admin', 'Manager', 'Cashier', 
    'Accountant', 'HR Manager', 'Warehouse Manager'
  ];

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'bn', label: 'বাংলা' }
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/80 bg-card px-4 sm:px-6 shadow-xs select-none">
      
      {/* Left side: Hamburger and Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-zinc-500 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:block">
          <Breadcrumb />
        </div>
      </div>

      {/* Right side: Actions panel */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* POS Fast Access */}
        <Link href="/pos">
          <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-1.5 h-9 rounded-full bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary">
            <ShoppingCart className="h-4 w-4" />
            <span className="font-semibold text-xs">POS Billing</span>
          </Button>
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-full p-2 text-zinc-500 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title="Toggle Dark Mode"
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        {/* Fullscreen */}
        <button
          onClick={handleFullscreen}
          className="hidden md:block rounded-full p-2 text-zinc-500 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title="Toggle Fullscreen"
        >
          <Maximize className="h-4.5 w-4.5" />
        </button>

        {/* Print Trigger */}
        <button
          onClick={handlePrint}
          className="hidden md:block rounded-full p-2 text-zinc-500 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title="Print Page"
        >
          <Printer className="h-4.5 w-4.5" />
        </button>

        {/* Language Select Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setLangDropdownOpen(!langDropdownOpen);
              setProfileDropdownOpen(false);
            }}
            className="rounded-full p-2 text-zinc-500 hover:bg-muted hover:text-foreground transition-colors cursor-pointer flex items-center gap-1"
            title="Switch Language"
          >
            <Globe className="h-4.5 w-4.5" />
            <span className="text-xs uppercase font-semibold">{language}</span>
          </button>
          
          {langDropdownOpen && (
            <div className="absolute right-0 mt-2 w-36 rounded-xl border border-border bg-card p-1 shadow-lg animate-in fade-in slide-in-from-top-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setLangDropdownOpen(false);
                    addToast('info', 'Language Swapped', `Display language configured to: ${lang.label}`);
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg hover:bg-muted text-foreground cursor-pointer"
                >
                  <span>{lang.label}</span>
                  {language === lang.code && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Profile and Role Selection Dropdown */}
        {user && (
          <div className="relative">
            <button
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
                setLangDropdownOpen(false);
              }}
              className="flex items-center gap-2 rounded-full border border-border hover:border-zinc-300 dark:hover:border-zinc-700 bg-card/50 p-1 pr-3 transition-colors cursor-pointer"
            >
              <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
                {user.name.charAt(0)}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-foreground leading-none">{user.name}</span>
                <span className="text-[9px] text-muted-foreground mt-0.5">{user.role}</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card p-1 shadow-lg animate-in fade-in slide-in-from-top-1">
                {/* Profile header */}
                <div className="px-3 py-2 border-b border-border/50 mb-1">
                  <p className="text-xs font-bold text-foreground">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
                
                {/* Role Switcher sub-panel */}
                <div className="px-3 py-1.5">
                  <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                    Simulation Roles
                  </p>
                  <div className="max-h-36 overflow-y-auto space-y-0.5 scrollbar-thin">
                    {rolesList.map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRoleSwitch(r)}
                        className="flex w-full items-center justify-between px-2.5 py-1 text-[11px] font-medium rounded-md hover:bg-muted text-foreground cursor-pointer text-left"
                      >
                        <span className={user.role === r ? 'text-primary font-bold' : ''}>{r}</span>
                        {user.role === r && <Check className="h-3 w-3 text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border/50 my-1" />
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Logout Session
                </button>
              </div>
            )}
          </div>
        )}
        
      </div>
    </header>
  );
};
