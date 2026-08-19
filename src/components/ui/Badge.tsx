import React, { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'destructive' | 'info' | 'warning';
}

export const Badge = ({ className = '', variant = 'default', ...props }: BadgeProps) => {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors focus:outline-none';
  
  const variants = {
    default: 'border-transparent bg-foreground text-background',
    secondary: 'border-transparent bg-secondary/15 text-secondary',
    outline: 'text-foreground border-border bg-card',
    success: 'border-transparent bg-success/15 text-success dark:bg-success/20',
    destructive: 'border-transparent bg-destructive/15 text-destructive dark:bg-destructive/20',
    info: 'border-transparent bg-info/15 text-info dark:bg-info/20',
    warning: 'border-transparent bg-warning/15 text-warning dark:bg-warning/20',
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    />
  );
};
