import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ConfigProvider, App as AntApp } from 'antd';
import { store, persistor } from '@/store';
import { queryClient } from '@/services';
import ErrorBoundary from '@/components/ErrorBoundary';
import HomePage from './pages/Homepage/index';
import NotFound from './pages/NotFound';
import ComponentsDemo from './pages/ComponentsDemo';
import StateManagementDemo from './pages/StateManagementDemo';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

const App = () => (
  <ErrorBoundary>
    <Provider store={store}>
      <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: '#0EA5E9',
                colorSuccess: '#10B981',
                borderRadius: 12,
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              },
            }}
          >
            <AntApp>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/components" element={<ComponentsDemo />} />
                  <Route path="/state-management" element={<StateManagementDemo />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </AntApp>
          </ConfigProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  </ErrorBoundary>
);

export default App;
