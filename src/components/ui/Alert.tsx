import React from 'react';
import { Alert as AntAlert, AlertProps as AntAlertProps, notification } from 'antd';
import { cn } from '@/utils/cn';

export interface AlertProps extends Omit<AntAlertProps, 'type'> {
  variant?: 'success' | 'info' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  closable?: boolean;
}

const Alert = React.forwardRef<any, AlertProps>(
  ({ className, variant = 'info', size = 'md', closable = true, ...props }, ref) => {
    const baseClasses = 'transition-all duration-300';
    
    const sizeClasses = {
      sm: 'text-sm py-2 px-3',
      md: 'text-base py-3 px-4',
      lg: 'text-lg py-4 px-5',
    };

    return (
      <AntAlert
        ref={ref}
        type={variant}
        closable={closable}
        className={cn(
          baseClasses,
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);

Alert.displayName = 'Alert';

// Notification utility functions
export const showNotification = {
  success: (message: string, description?: string) => {
    notification.success({
      message,
      description,
      placement: 'topRight',
      duration: 4.5,
    });
  },
  error: (message: string, description?: string) => {
    notification.error({
      message,
      description,
      placement: 'topRight',
      duration: 4.5,
    });
  },
  warning: (message: string, description?: string) => {
    notification.warning({
      message,
      description,
      placement: 'topRight',
      duration: 4.5,
    });
  },
  info: (message: string, description?: string) => {
    notification.info({
      message,
      description,
      placement: 'topRight',
      duration: 4.5,
    });
  },
};

export { Alert };
