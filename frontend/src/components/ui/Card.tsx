'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered';
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, variant = 'default', hover = false, ...props }, ref) => {
    const variants = {
      default: 'bg-white dark:bg-slate-900',
      elevated: 'bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50',
      bordered: 'bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800',
    };

    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-2xl overflow-hidden',
          variants[variant],
          hover && 'transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;


