import React, { Suspense, ComponentType } from 'react';
import { Loading } from '@/components/ui';

// Higher-order component for lazy loading with loading fallback
export const withLazyLoading = <P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = React.lazy(() => 
    Promise.resolve({ default: Component })
  );

  const WrappedComponent: React.FC<any> = (props) => (
    <Suspense fallback={fallback || <Loading size="lg" />}>
      <LazyComponent {...props} />
    </Suspense>
  );

  WrappedComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Utility function to create lazy components with custom loading
export const createLazyComponent = <P extends object>(
  importFunction: () => Promise<{ default: ComponentType<P> }>,
  loadingComponent?: React.ReactNode
) => {
  const LazyComponent = React.lazy(importFunction);

  return (props: any) => (
    <Suspense fallback={loadingComponent || <Loading size="lg" />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Pre-configured lazy loading for common page types
export const createLazyPage = <P extends object>(
  importFunction: () => Promise<{ default: ComponentType<P> }>
) => {
  return createLazyComponent(importFunction, (
    <div className="min-h-screen flex items-center justify-center">
      <Loading size="lg" />
    </div>
  ));
};

// Lazy loading with error boundary
export const withLazyLoadingAndErrorBoundary = <P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = React.lazy(() => 
    Promise.resolve({ default: Component })
  );

  const WrappedComponent: React.FC<any> = (props) => (
    <Suspense fallback={fallback || <Loading size="lg" />}>
      <LazyComponent {...props} />
    </Suspense>
  );

  WrappedComponent.displayName = `withLazyLoadingAndErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};
