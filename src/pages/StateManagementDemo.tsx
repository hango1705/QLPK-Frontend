import React, { useState } from 'react';
import { Button, Card, Input, Alert, Loading } from '@/components/ui';
import { useAuth, useUser } from '@/hooks';
import { showNotification } from '@/components/ui';

const StateManagementDemo = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error, 
    login, 
    logout, 
    clearError 
  } = useAuth();
  
  const { 
    profile, 
    isUpdating, 
    updateProfile, 
    clearError: clearUserError 
  } = useUser();

  const [loginForm, setLoginForm] = useState({
    username: 'admin',
    password: 'password123'
  });

  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: ''
  });

  const handleLogin = async () => {
    try {
      await login(loginForm);
      showNotification.success('Login successful!');
    } catch (error) {
      showNotification.error('Login failed');
    }
  };

  const handleLogout = async () => {
    await logout();
    showNotification.info('Logged out successfully');
  };

  const handleUpdateProfile = async () => {
    if (!user?.id) return;
    
    try {
      await updateProfile(user.id, profileForm);
      showNotification.success('Profile updated successfully!');
    } catch (error) {
      showNotification.error('Failed to update profile');
    }
  };

  const handleTestNotification = () => {
    showNotification.success('Success notification!', 'This is a success message');
    setTimeout(() => showNotification.error('Error notification!', 'This is an error message'), 1000);
    setTimeout(() => showNotification.warning('Warning notification!', 'This is a warning message'), 2000);
    setTimeout(() => showNotification.info('Info notification!', 'This is an info message'), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-fresh py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            State Management & API Layer
          </h1>
          <p className="text-xl text-muted-foreground">
            Redux Toolkit + React Query + Axios + Custom Hooks
          </p>
        </div>

        {/* Authentication Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">Authentication</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Login Form */}
            <Card variant="elevated" padding="lg">
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Login Demo</h3>
                <Input
                  placeholder="Username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                />
                <Button 
                  variant="primary" 
                  onClick={handleLogin}
                  loading={isLoading}
                  className="w-full"
                >
                  Login
                </Button>
                {error && (
                  <Alert variant="error" message={error} closable onClose={clearError} />
                )}
              </div>
            </Card>

            {/* User Info */}
            <Card variant="elevated" padding="lg">
              <div className="space-y-4">
                <h3 className="text-xl font-bold">User Status</h3>
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <p className="text-sm text-muted-foreground">Logged in as:</p>
                      <p className="font-semibold">{user?.full_name || user?.username}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                      <p className="text-sm text-primary">Username: {user?.username}</p>
                    </div>
                    <Button variant="destructive" onClick={handleLogout} className="w-full">
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Not logged in</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </section>

        {/* Profile Management Section */}
        {isAuthenticated && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-8">Profile Management</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Profile Form */}
              <Card variant="elevated" padding="lg">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Update Profile</h3>
                  <Input
                    placeholder="Name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                  <Input
                    placeholder="Address"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                  />
                  <Button 
                    variant="primary" 
                    onClick={handleUpdateProfile}
                    loading={isUpdating}
                    className="w-full"
                  >
                    Update Profile
                  </Button>
                </div>
              </Card>

              {/* Profile Display */}
              <Card variant="elevated" padding="lg">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Current Profile</h3>
                  {profile ? (
                    <div className="space-y-3">
                      <div className="p-4 bg-secondary/10 rounded-lg">
                        <p className="font-semibold">{profile.name}</p>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                        <p className="text-sm text-muted-foreground">{profile.phone}</p>
                        <p className="text-sm text-muted-foreground">{profile.address}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No profile data</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* API Features Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">API Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card variant="outlined" padding="lg">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">🔄</span>
                </div>
                <h3 className="text-lg font-bold">Auto Token Refresh</h3>
                <p className="text-sm text-muted-foreground">
                  Automatic token refresh with axios interceptors
                </p>
              </div>
            </Card>

            <Card variant="outlined" padding="lg">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-secondary/10 flex items-center justify-center">
                  <span className="text-2xl">📱</span>
                </div>
                <h3 className="text-lg font-bold">React Query</h3>
                <p className="text-sm text-muted-foreground">
                  Caching, background updates, and optimistic updates
                </p>
              </div>
            </Card>

            <Card variant="outlined" padding="lg">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-2xl">💾</span>
                </div>
                <h3 className="text-lg font-bold">Redux Persist</h3>
                <p className="text-sm text-muted-foreground">
                  Persistent state across browser sessions
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* Notification Demo */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">Notification System</h2>
          <Card variant="elevated" padding="lg">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold">Test Notifications</h3>
              <p className="text-muted-foreground">
                Click the button below to see different types of notifications
              </p>
              <Button variant="primary" onClick={handleTestNotification}>
                Show All Notifications
              </Button>
            </div>
          </Card>
        </section>

        {/* Error Boundary Demo */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">Error Handling</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card variant="filled" padding="lg">
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Error Boundary</h3>
                <p className="text-sm text-muted-foreground">
                  Global error boundary catches and handles React errors gracefully
                </p>
                <Alert 
                  variant="info" 
                  message="Error Boundary Active" 
                  description="This app is wrapped with ErrorBoundary component"
                />
              </div>
            </Card>

            <Card variant="filled" padding="lg">
              <div className="space-y-4">
                <h3 className="text-lg font-bold">API Error Handling</h3>
                <p className="text-sm text-muted-foreground">
                  Centralized error handling with user-friendly messages
                </p>
                <Alert 
                  variant="success" 
                  message="Error Handling Active" 
                  description="API errors are handled with interceptors and custom hooks"
                />
              </div>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-muted-foreground">
          <p>State Management & API Layer - Built with Redux Toolkit, React Query, Axios & Custom Hooks</p>
        </div>
      </div>
    </div>
  );
};

export default StateManagementDemo;
