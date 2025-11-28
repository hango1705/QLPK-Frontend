import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ConfigProvider, App as AntApp } from 'antd';
import { store, persistor } from '@/store';
import { queryClient } from '@/services';
import ErrorBoundary from '@/components/ErrorBoundary';
import { PublicRoute, PrivateRoute } from '@/components/auth/RouteGuards';
import RoleBasedRoute from '@/components/auth/RoleBasedRoute';
import AuthInitializer from '@/components/auth/AuthInitializer';
import { createLazyPage } from '@/utils/lazyLoading';

// Lazy load pages for code splitting
const HomePage = createLazyPage(() => import('./pages/Homepage/index'));
const NotFound = createLazyPage(() => import('./pages/NotFound'));
const UnauthorizedPage = createLazyPage(() => import('./pages/Unauthorized'));
const ComponentsDemo = createLazyPage(() => import('./pages/ComponentsDemo'));
const StateManagementDemo = createLazyPage(() => import('./pages/StateManagementDemo'));

// Auth pages with public route guards
const LoginPage = createLazyPage(() => import('./pages/auth/LoginPage'));
const RegisterPage = createLazyPage(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = createLazyPage(() => import('./pages/auth/ForgotPasswordPage'));
const VerifyResetPasswordPage = createLazyPage(() => import('./pages/auth/VerifyResetPasswordPage'));
const ResetPasswordPage = createLazyPage(() => import('./pages/auth/ResetPasswordPage'));

// Patient pages with lazy loading
const PatientDashboard = createLazyPage(() => import('./pages/PatientPages/PatientDashboard'));
const PatientBasicInfo = createLazyPage(() => import('./pages/PatientPages/PatientBasicInfo'));
const PatientInitialExamination = createLazyPage(() => import('./pages/PatientPages/PatientInitialExamination'));
const PatientTreatmentPlan = createLazyPage(() => import('./pages/PatientPages/PatientTreatmentPlan'));
const PatientTreatmentProgress = createLazyPage(() => import('./pages/PatientPages/PatientTreatmentProgress'));
const PatientPayment = createLazyPage(() => import('./pages/PatientPages/PatientPayment'));
const DoctorWorkspace = createLazyPage(() => import('./pages/DoctorPages'));
const AdminWorkspace = createLazyPage(() => import('./pages/AdminPages'));

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
              <AuthInitializer>
                <BrowserRouter>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/components" element={<ComponentsDemo />} />
                  <Route path="/state-management" element={<StateManagementDemo />} />
                  
                  {/* Auth routes - only accessible when not authenticated */}
                  <Route 
                    path="/login" 
                    element={
                      <PublicRoute redirectTo="/">
                        <LoginPage />
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/register" 
                    element={
                      <PublicRoute redirectTo="/">
                        <RegisterPage />
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/forgot-password" 
                    element={
                      <PublicRoute redirectTo="/">
                        <ForgotPasswordPage />
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/verify-reset-password" 
                    element={
                      <PublicRoute redirectTo="/">
                        <VerifyResetPasswordPage />
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/reset-password/:id"
                    element={
                      <PublicRoute redirectTo="/">
                        <ResetPasswordPage />
                      </PublicRoute>
                    } 
                  />
                  
                  {/* Protected routes - require authentication */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <PrivateRoute>
                        <RoleBasedRoute allowedRoles={['admin', 'doctor', 'nurse', 'patient']}>
                          <div>Dashboard Page (Protected)</div>
                        </RoleBasedRoute>
                      </PrivateRoute>
                    } 
                  />
                  
                  {/* Admin only routes */}
                  <Route 
                    path="/admin" 
                    element={
                      <PrivateRoute>
                        <RoleBasedRoute allowedRoles={['admin']}>
                          <AdminWorkspace />
                        </RoleBasedRoute>
                      </PrivateRoute>
                    } 
                  />
                  
                  {/* Doctor only routes */}
                  <Route 
                    path="/doctor" 
                    element={
                      <PrivateRoute>
                        <RoleBasedRoute allowedRoles={['doctor', 'admin']}>
                          <DoctorWorkspace />
                        </RoleBasedRoute>
                      </PrivateRoute>
                    } 
                  />
                  
                  {/* Nurse only routes */}
                  <Route 
                    path="/nurse" 
                    element={
                      <PrivateRoute>
                        <RoleBasedRoute allowedRoles={['nurse', 'admin']}>
                          <div>Nurse Panel (Nurse/Admin Only)</div>
                        </RoleBasedRoute>
                      </PrivateRoute>
                    } 
                  />
                  
                  {/* Patient routes */}
                  <Route 
                    path="/patient" 
                    element={
                      <PrivateRoute>
                        <RoleBasedRoute allowedRoles={['patient', 'admin']}>
                          <PatientDashboard />
                        </RoleBasedRoute>
                      </PrivateRoute>
                    } 
                  />
                  
                  <Route 
                    path="/patient/basic-info" 
                    element={
                      <PrivateRoute>
                        <RoleBasedRoute allowedRoles={['patient', 'admin']}>
                          <PatientBasicInfo />
                        </RoleBasedRoute>
                      </PrivateRoute>
                    } 
                  />
                  
                  <Route 
                    path="/patient/initial-examination" 
                    element={
                      <PrivateRoute>
                        <RoleBasedRoute allowedRoles={['patient', 'admin']}>
                          <PatientInitialExamination />
                        </RoleBasedRoute>
                      </PrivateRoute>
                    } 
                  />
                  
                  <Route 
                    path="/patient/treatment-plan" 
                    element={
                      <PrivateRoute>
                        <RoleBasedRoute allowedRoles={['patient', 'admin']}>
                          <PatientTreatmentPlan />
                        </RoleBasedRoute>
                      </PrivateRoute>
                    } 
                  />
                  
                  <Route 
                    path="/patient/treatment-progress" 
                    element={
                      <PrivateRoute>
                        <RoleBasedRoute allowedRoles={['patient', 'admin']}>
                          <PatientTreatmentProgress />
                        </RoleBasedRoute>
                      </PrivateRoute>
                    } 
                  />
                  
                  <Route 
                    path="/patient/payment" 
                    element={
                      <PrivateRoute>
                        <RoleBasedRoute allowedRoles={['patient', 'admin']}>
                          <PatientPayment />
                        </RoleBasedRoute>
                      </PrivateRoute>
                    } 
                  />

                  {/* Appointment booking integrated in patient dashboard */}
                  
                  {/* Error pages */}
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </BrowserRouter>
              </AuthInitializer>
            </AntApp>
          </ConfigProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  </ErrorBoundary>
);

export default App;
