'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUIStore, useAuthStore, useToastStore, useSubscriptionStore, usePOSStore } from '../../lib/store';
import { useTranslation, SupportedLanguage } from '../../lib/i18n';
import { Breadcrumb } from './Breadcrumb';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { 
  Menu, Moon, Sun, Maximize, ShoppingCart, 
  Printer, Globe, User, LogOut, ChevronDown, Check,
  Key, ShieldCheck, Lock, Sparkles, Trash2, Settings, AlertTriangle
} from 'lucide-react';

export const Header = () => {
  const router = useRouter();
  const { toggleSidebar, theme, toggleTheme } = useUIStore();
  const { language, setLanguage, t, supportedLanguages, currentLanguageOption } = useTranslation();
  const { user, logout } = useAuthStore();
  const { isSubscribed, activationKey, setSubscriptionModalOpen } = useSubscriptionStore();
  const { addToast } = useToastStore();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClearDummyData = async () => {
    setIsClearing(true);
    try {
      const res = await fetch('/api/system/clear-dummy-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user?.email })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        usePOSStore.getState().clearAllPOSData();
        addToast('success', t('Dummy Data Removed'), t('All demo data has been cleared. The system is completely fresh for production!'));
        setConfirmClearOpen(false);
        setTimeout(() => {
          window.location.reload();
        }, 700);
      } else {
        addToast('error', t('Error'), data.error || t('Failed to clear dummy data.'));
      }
    } catch {
      addToast('error', t('Error'), t('Failed to connect to backend server.'));
    } finally {
      setIsClearing(false);
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        addToast('error', 'Fullscreen Error', 'Could not activate fullscreen mode.');
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleLogout = () => {
    logout();
    addToast('info', t('Logged Out'), t('Successfully logged out of your session.'));
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/80 bg-card/85 backdrop-blur-lg px-4 sm:px-6 shadow-xs select-none">
      
      {/* Left side: Hamburger and Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-zinc-500 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:block">
          <Breadcrumb />
        </div>
      </div>

      {/* Right side: Actions panel */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Subscription Key Badge Trigger */}
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => setSubscriptionModalOpen(true)}
          className={`hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-bold transition-all border cursor-pointer ${
            mounted && isSubscribed
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 hover:bg-amber-100 animate-pulse'
          }`}
          title={mounted && isSubscribed ? `Activation Key: ${activationKey}` : 'Click to subscribe & unlock ERP'}
        >
          {mounted && isSubscribed ? (
            <>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-mono text-[11px]" suppressHydrationWarning>{activationKey ? activationKey.slice(0, 13) + '...' : t('ERP ACTIVE')}</span>
            </>
          ) : (
            <>
              <Lock className="h-3.5 w-3.5 text-amber-600" />
              <span suppressHydrationWarning>{t('Unlock ERP (₹5,999)')}</span>
            </>
          )}
        </button>

        {/* POS Fast Access */}
        <Link href="/pos">
          <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-1.5 h-9 rounded-full bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary">
            <ShoppingCart className="h-4 w-4" />
            <span className="font-semibold text-xs">{t('POS Billing')}</span>
          </Button>
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-full p-2 text-zinc-500 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title={t('Toggle Dark Mode')}
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        {/* Fullscreen */}
        <button
          onClick={handleFullscreen}
          className="hidden md:block rounded-full p-2 text-zinc-500 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title={t('Toggle Fullscreen')}
        >
          <Maximize className="h-4.5 w-4.5" />
        </button>

        {/* Print Trigger */}
        <button
          onClick={() => window.print()}
          className="hidden md:block rounded-full p-2 text-zinc-500 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title={t('Print Page')}
        >
          <Printer className="h-4.5 w-4.5" />
        </button>

        {/* Language Select Dropdown */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => {
              setLangDropdownOpen(!langDropdownOpen);
              setProfileDropdownOpen(false);
            }}
            className="rounded-full p-2 px-2.5 text-zinc-600 dark:text-zinc-300 hover:bg-muted hover:text-foreground transition-all cursor-pointer flex items-center gap-1.5 border border-border/60 bg-card/60 shadow-xs"
            title="Switch Language"
          >
            <Globe className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider">{currentLanguageOption.code}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
          
          {langDropdownOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-border bg-card p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 z-50">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 mb-1">
                Select Language
              </div>
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setLangDropdownOpen(false);
                    addToast('info', t('Language Swapped'), `${t('Configured to:')} ${lang.nativeLabel} (${lang.label})`);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    language === lang.code
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.nativeLabel}</span>
                  </span>
                  {language === lang.code && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        {mounted && user && (
          <div className="relative" ref={profileRef}>
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
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-card p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 z-50">
                {/* Profile header */}
                <div className="px-3 py-3 border-b border-border/50 mb-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground font-bold text-base">
                      {user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground leading-none truncate">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{user.email}</p>
                    </div>
                  </div>
                  <div className="px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold text-center">
                    🛡 {user.role}
                  </div>
                </div>

                {/* Activation Key & Subscription Panel inside profile dropdown */}
                <div className="p-2.5 mx-1 mb-1 rounded-lg bg-muted/40 border border-border/60 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Key className="h-3 w-3 text-primary" /> {t('Activation Code:')}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isSubscribed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>
                      {isSubscribed ? t('Fully Unlocked') : t('Locked Preview')}
                    </span>
                  </div>
                  {isSubscribed ? (
                    <div className="font-mono text-[10px] font-bold text-foreground truncate bg-card p-1.5 rounded border border-border">
                      {activationKey || 'ERP-ACTV-8942-X92F-2026'}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setSubscriptionModalOpen(true);
                      }}
                      className="w-full py-1.5 px-2 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Sparkles className="h-3 w-3" /> {t('Unlock ERP (₹5,999)')}
                    </button>
                  )}
                </div>

                {/* Clear Dummy Data Action Button */}
                <div className="px-1 py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setConfirmClearOpen(true);
                    }}
                    className="flex w-full items-center justify-between px-2.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50/80 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 rounded-lg transition-colors cursor-pointer border border-rose-200/80 dark:border-rose-900/50"
                  >
                    <span className="flex items-center gap-2">
                      <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                      <span>{t('Clear All Dummy Data')}</span>
                    </span>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-rose-200/70 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                      Reset
                    </span>
                  </button>
                </div>

                {/* Profile link */}
                <Link
                  href="/settings/users"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted rounded-lg cursor-pointer"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  {t('Users List')}
                </Link>

                {/* System Settings link */}
                <Link
                  href="/settings/system"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted rounded-lg cursor-pointer"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  {t('System Settings')}
                </Link>

                <div className="border-t border-border/50 my-1" />
                
                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  {t('Sign Out')}
                </button>
              </div>
            )}
          </div>
        )}
        
      </div>

      {/* Clear Dummy Data Confirmation Modal */}
      <Modal
        isOpen={confirmClearOpen}
        onClose={() => !isClearing && setConfirmClearOpen(false)}
        title={t('Clear All Dummy / Demo Data?')}
        size="md"
        footer={
          <>
            <Button 
              variant="outline" 
              onClick={() => setConfirmClearOpen(false)}
              disabled={isClearing}
            >
              {t('Cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearDummyData}
              disabled={isClearing}
              className="flex items-center gap-2 font-bold"
            >
              <Trash2 className="h-4 w-4" />
              <span>{isClearing ? t('Clearing Data...') : t('Yes, Clear All Dummy Data')}</span>
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-1">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200">
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">{t('This action will wipe all mock demo data to give you a clean slate.')}</p>
              <p className="text-muted-foreground dark:text-rose-300/80 leading-relaxed">
                {t('All demo products, dummy sales orders, purchases, quotations, expenses, and demo customers will be completely cleared.')}
              </p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-muted/40 border border-border/70 text-xs space-y-2">
            <p className="font-bold text-foreground">🛡 {t('What is preserved safe:')}</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground text-[11px]">
              <li>{t('Your Super Admin user account & credentials')}</li>
              <li>{t('Your ERP 1-Year subscription license key')}</li>
              <li>{t('Default POS Walk-In Customer & store configurations')}</li>
            </ul>
          </div>
        </div>
      </Modal>
    </header>
  );
};
