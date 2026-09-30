'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';

export const Breadcrumb = () => {
  const pathname = usePathname();
  const { t } = useTranslation();
  
  if (pathname === '/dashboard') {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground py-1">
        <Home className="h-3.5 w-3.5" />
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-semibold">{t('Dashboard')}</span>
      </div>
    );
  }

  const paths = pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground py-1">
      <Link href="/dashboard" className="flex items-center gap-1 hover:text-foreground transition-colors" title={t('Dashboard')}>
        <Home className="h-3.5 w-3.5" />
      </Link>
      
      {paths.map((path, idx) => {
        const routeTo = `/${paths.slice(0, idx + 1).join('/')}`;
        const isLast = idx === paths.length - 1;
        const rawName = path
          .replace(/-/g, ' ')
          .replace(/\[\w+\]/g, '') // strip brackets if dynamic
          .replace(/\b\w/g, (c) => c.toUpperCase());
        const name = t(rawName);

        return (
          <React.Fragment key={path}>
            <ChevronRight className="h-3 w-3 shrink-0" />
            {isLast ? (
              <span className="text-foreground font-semibold truncate max-w-[150px] sm:max-w-none">
                {name}
              </span>
            ) : (
              <Link 
                href={routeTo} 
                className="hover:text-foreground transition-colors truncate max-w-[120px] sm:max-w-none"
              >
                {name}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
