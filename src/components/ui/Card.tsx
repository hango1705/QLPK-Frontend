import React from 'react';
import { Card as AntCard, CardProps as AntCardProps } from 'antd';
import { cn } from '@/utils/cn';

export interface CardProps extends Omit<AntCardProps, 'bodyStyle' | 'variant'> {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hoverable = false, children, ...props }, ref) => {
    const baseClasses = 'transition-all duration-300';
    
    const variantClasses = {
      default: 'border-border bg-card shadow-soft',
      elevated: 'border-border bg-card shadow-medium hover:shadow-glow',
      outlined: 'border-2 border-primary/20 bg-card shadow-soft',
      filled: 'border-border bg-primary/5 shadow-soft',
    };

    const paddingClasses = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const hoverClasses = hoverable ? 'hover:shadow-medium hover:-translate-y-1 cursor-pointer' : '';

    return (
      <AntCard
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          hoverClasses,
          className
        )}
        bodyStyle={{ padding: padding === 'none' ? 0 : undefined }}
        {...props}
      >
        {children}
      </AntCard>
    );
  }
);

Card.displayName = 'Card';

export { Card };
