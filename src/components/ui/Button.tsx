import React from 'react';
import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface ButtonProps extends Omit<AntButtonProps, 'size' | 'variant' | 'type' | 'htmlType'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  htmlType?: 'button' | 'submit' | 'reset';
  type?: 'button' | 'submit' | 'reset'; // Alias for htmlType for backward compatibility
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, htmlType, type, children, style, ...props }, ref) => {
    // Support both htmlType and type prop for backward compatibility
    const buttonHtmlType = htmlType || type || 'button';
    const baseClasses = 'font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const variantClasses = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary shadow-medium hover:shadow-glow',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 focus:ring-secondary shadow-medium hover:shadow-glow',
      outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground focus:ring-primary',
      ghost: 'text-primary hover:bg-primary/10 focus:ring-primary',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive shadow-medium hover:shadow-glow',
    };

    const sizeClasses = {
      sm: 'px-4 py-2 text-sm h-8',
      md: 'px-6 py-3 text-base h-10',
      lg: 'px-8 py-4 text-lg h-12',
    };

    // Map our variants to Ant Design types
    const antType = variant === 'destructive' ? 'primary' : variant === 'outline' ? 'default' : variant;

    // Check if justify-start is in className and force it with inline style
    const hasJustifyStart = className?.includes('justify-start');
    const hasGap3 = className?.includes('gap-3');
    
    let mergedStyle = style || {};
    if (hasJustifyStart) {
      mergedStyle = { 
        ...mergedStyle, 
        justifyContent: 'flex-start', 
        display: 'flex', 
        alignItems: 'center' 
      };
    }
    if (hasGap3) {
      mergedStyle = { ...mergedStyle, gap: '12px' };
    }

    return (
      <motion.div
        whileHover={{ 
          scale: 1.02,
          transition: { type: "spring", stiffness: 400, damping: 17 }
        }}
        whileTap={{ 
          scale: 0.98,
          transition: { type: "spring", stiffness: 600, damping: 20 }
        }}
        style={{ display: 'inline-block' }}
      >
        <AntButton
          ref={ref}
          type={antType as AntButtonProps['type']}
          htmlType={buttonHtmlType}
          size={size === 'sm' ? 'small' : size === 'lg' ? 'large' : 'middle'}
          loading={loading}
          className={cn(
            baseClasses,
            variantClasses[variant],
            sizeClasses[size],
            className
          )}
          style={mergedStyle}
          {...props}
        >
          {children}
        </AntButton>
      </motion.div>
    );
  }
);

Button.displayName = 'Button';

export { Button };
