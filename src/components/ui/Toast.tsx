'use client';

import React, { useEffect } from 'react';
import { useToastStore, showToast } from '../../lib/store';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastProvider = () => {
  const { toasts, removeToast } = useToastStore();

  // Intercept any unhandled browser/network error or residual alert()/confirm() calls so they show via React Toast instead of console
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Safety: convert any residual window.alert and window.confirm to React toast
    const originalAlert = window.alert;
    const originalConfirm = window.confirm;
    window.alert = (message?: any) => {
      showToast.warning('System Notice', String(message || ''));
    };
    window.confirm = (message?: string) => {
      showToast.info('Notice', String(message || ''));
      return true;
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg = reason?.message || (typeof reason === 'string' ? reason : null);
      if (msg && !msg.includes('ResizeObserver') && !msg.includes('canceled')) {
        showToast.error('Operation Notice', msg);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.alert = originalAlert;
      window.confirm = originalConfirm;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    error: <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />,
    info: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />,
  };

  const cardStyles = {
    success: 'border-emerald-500/30 bg-white dark:bg-zinc-900 border-l-[5px] border-l-emerald-500 shadow-xl shadow-emerald-500/5',
    error: 'border-rose-500/30 bg-white dark:bg-zinc-900 border-l-[5px] border-l-rose-500 shadow-xl shadow-rose-500/5',
    warning: 'border-amber-500/30 bg-white dark:bg-zinc-900 border-l-[5px] border-l-amber-500 shadow-xl shadow-amber-500/5',
    info: 'border-blue-500/30 bg-white dark:bg-zinc-900 border-l-[5px] border-l-blue-500 shadow-xl shadow-blue-500/5',
  };

  return (
    <div className="fixed top-5 right-5 z-[99999] flex w-full max-w-sm flex-col gap-2.5 pointer-events-none select-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-2xl border p-4 shadow-xl transition-all duration-300 pointer-events-auto animate-in slide-in-from-top-3 fade-in ${cardStyles[toast.type]}`}
        >
          <div className="mt-0.5">{icons[toast.type]}</div>
          <div className="flex-1 min-w-0 pr-1">
            <h5 className="font-bold text-xs text-foreground tracking-tight leading-snug">{toast.title}</h5>
            {toast.description && (
              <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed break-words font-medium">
                {toast.description}
              </p>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 rounded-lg p-1 text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            aria-label="Dismiss toast"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
