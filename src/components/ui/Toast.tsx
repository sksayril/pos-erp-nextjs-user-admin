'use client';

import React from 'react';
import { useToastStore } from '../../lib/store';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastProvider = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-success" />,
    error: <XCircle className="h-5 w-5 text-destructive" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning" />,
    info: <Info className="h-5 w-5 text-info" />,
  };

  const borderColors = {
    success: 'border-success/30 bg-white dark:bg-zinc-900 border-l-4 border-l-success',
    error: 'border-destructive/30 bg-white dark:bg-zinc-900 border-l-4 border-l-destructive',
    warning: 'border-warning/30 bg-white dark:bg-zinc-900 border-l-4 border-l-warning',
    info: 'border-info/30 bg-white dark:bg-zinc-900 border-l-4 border-l-info',
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex w-full max-w-sm flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300 pointer-events-auto animate-in slide-in-from-bottom-5 ${borderColors[toast.type]}`}
        >
          <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
          <div className="flex-1">
            <h5 className="font-semibold text-sm text-foreground">{toast.title}</h5>
            {toast.description && (
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{toast.description}</p>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 rounded-md p-1 text-muted-foreground/60 hover:text-foreground transition-colors hover:bg-muted cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
