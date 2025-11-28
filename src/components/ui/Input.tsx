import React from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = 'default', size = 'md', error, helperText, type = 'text', ...props }, ref) => {
    const baseClasses = 'w-full transition-all duration-300 focus:outline-none rounded-md border';
    
    const variantClasses = {
      default: 'border-border bg-background hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20',
      filled: 'border-border bg-muted hover:bg-muted/80 focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20',
      outlined: 'border-2 border-primary/30 bg-background hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20',
    };

    const sizeClasses = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-11 px-4 text-base',
      lg: 'h-14 px-5 text-lg',
    };

    const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : '';

    return (
      <div className="space-y-1">
        <input
          ref={ref}
          type={type}
          className={cn(
            baseClasses,
            variantClasses[variant],
            sizeClasses[size],
            errorClasses,
            className
          )}
          {...props}
        />
        {helperText && (
          <p className={cn(
            'text-sm',
            error ? 'text-red-500' : 'text-muted-foreground'
          )}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
