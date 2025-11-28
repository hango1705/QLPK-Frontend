import React from 'react';
import { Spin } from 'antd';
import { cn } from '@/utils/cn';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
  text?: string;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  variant = 'spinner', 
  text, 
  className 
}) => {
  const sizeMap = {
    sm: 'small',
    md: 'default',
    lg: 'large',
  } as const;

  const variantClasses = {
    spinner: '',
    dots: 'animate-pulse',
    pulse: 'animate-pulse',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Spin 
        size={sizeMap[size]} 
        className={cn(variantClasses[variant])}
      />
      {text && (
        <p className="text-muted-foreground text-sm">{text}</p>
      )}
    </div>
  );
};

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-primary border-t-transparent',
        sizeClasses[size],
        className
      )}
    />
  );
};

export { Loading, Spinner };
