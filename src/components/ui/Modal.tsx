import React from 'react';
import { Modal as AntModal, ModalProps as AntModalProps } from 'antd';
import { cn } from '@/utils/cn';

export interface ModalProps extends Omit<AntModalProps, 'bodyStyle'> {
  variant?: 'default' | 'centered' | 'fullscreen';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal = React.forwardRef<any, ModalProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const baseClasses = 'transition-all duration-300';
    
    const variantClasses = {
      default: '',
      centered: 'top-1/2 transform -translate-y-1/2',
      fullscreen: 'top-0 left-0 right-0 bottom-0 m-0 max-w-none w-full h-full',
    };

    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
    };

    const modalProps = {
      ...props,
      centered: variant === 'centered',
      width: variant === 'fullscreen' ? '100vw' : undefined,
      style: {
        ...props.style,
        ...(variant === 'fullscreen' && { height: '100vh', margin: 0, padding: 0 }),
      },
    };

    return (
      <AntModal
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...modalProps}
      >
        {children}
      </AntModal>
    );
  }
);

Modal.displayName = 'Modal';

export { Modal };
