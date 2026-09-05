import React from 'react';
import { cn } from '../../utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'primary' | 'neutral' | 'error' | 'info';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'sm', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center font-medium rounded-full';
    
    const variants: Record<string, string> = {
      default: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
      neutral: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
      secondary: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
      primary: 'bg-primary/10 text-primary',
      success: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
      warning: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
      danger: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
      error: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
      info: 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300',
    };
    
    const sizes = {
      sm: 'px-2.5 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';