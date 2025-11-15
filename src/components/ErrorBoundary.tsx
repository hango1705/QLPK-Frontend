import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertTitle, AlertDescription, Button } from '@/components/ui';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Log error to external service in production
    if (process.env.NODE_ENV === 'production') {
      // You can integrate with error reporting services like Sentry here
      console.error('Production error:', error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-fresh p-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
                <span className="text-4xl text-destructive">⚠️</span>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-4">
                Oops! Something went wrong
              </h1>
              <p className="text-muted-foreground mb-6">
                We're sorry, but something unexpected happened. Our team has been notified and is working to fix the issue.
              </p>
            </div>

            <div className="space-y-4">
              <Alert
                variant="destructive"
              >
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription>
                  <div className="mt-2">
                    <p className="text-sm font-mono bg-muted/30 p-2 rounded">
                      {this.state.error?.message || 'Unknown error occurred'}
                    </p>
                    {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                      <details className="mt-2">
                        <summary className="text-sm cursor-pointer text-muted-foreground">
                          Stack Trace
                        </summary>
                        <pre className="text-xs bg-muted/30 p-2 rounded mt-2 overflow-auto max-h-32">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={this.handleReload}
                  className="flex-1"
                  icon={<ReloadOutlined />}
                >
                  Reload Page
                </Button>
                <Button
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="flex-1"
                  icon={<HomeOutlined />}
                >
                  Go Home
                </Button>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">Development Info:</h3>
                <p className="text-sm text-muted-foreground">
                  This error boundary is only shown in development. In production, users will see a more user-friendly message.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
