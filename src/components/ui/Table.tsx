import React from 'react';
import { Table as AntTable, TableProps as AntTableProps } from 'antd';
import { cn } from '@/utils/cn';

export interface TableProps<T = any> extends Omit<AntTableProps<T>, 'size'> {
  variant?: 'default' | 'striped' | 'bordered';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  emptyText?: string;
}

const Table = React.forwardRef<any, TableProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md', 
    loading = false,
    emptyText = 'Không có dữ liệu',
    ...props 
  }, ref) => {
    const baseClasses = 'transition-all duration-300';
    
    const variantClasses = {
      default: 'border-border',
      striped: 'border-border [&_tbody_tr:nth-child(even)]:bg-muted/30',
      bordered: 'border-2 border-primary/20',
    };

    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };

    const tableProps = {
      ...props,
      size: (size === 'sm' ? 'small' : size === 'lg' ? 'large' : 'middle') as any,
      loading,
      locale: {
        emptyText,
      },
      pagination: {
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total: number, range: [number, number]) => 
          `${range[0]}-${range[1]} của ${total} mục`,
        ...props.pagination,
      },
    };

    return (
      <AntTable
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...tableProps}
      />
    );
  }
);

Table.displayName = 'Table';

export { Table };
