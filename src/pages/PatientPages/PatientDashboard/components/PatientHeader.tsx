import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Avatar, AvatarFallback, AvatarImage } from '@/components/ui';
import { Bell, Settings, LogOut, Menu, Stethoscope } from 'lucide-react';
import type { PatientHeaderProps } from '../types';
import apiClient, { cancelAllPendingRequests, resetLogoutState, isLogoutInProgress } from '@/services/api/client';
import { useAuth } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';

interface ExtendedPatientHeaderProps extends PatientHeaderProps {
  onToggleSidebar?: () => void;
  onToggleCollapse?: () => void;
}

const PatientHeader: React.FC<ExtendedPatientHeaderProps> = ({
  profile,
  user,
  activeSection,
  onLogout,
  onEditProfile,
  isLoading = false,
  onToggleSidebar,
  onToggleCollapse,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  
  const handleLogout = async () => {
    // Prevent multiple simultaneous logout calls
    if (isLogoutInProgress()) {
      return;
    }
    
    // Save token before clearing state
    const currentToken = token;
    
    if (!currentToken) {
      // No token, just clear state and navigate
      queryClient.cancelQueries();
      queryClient.clear();
      onLogout();
      navigate('/login');
      return;
    }
    
    // Set logout flag FIRST to block all new requests
    cancelAllPendingRequests(); // This sets isLoggingOut = true
    
    // Cancel all active queries to prevent new requests
    queryClient.cancelQueries();
    
    // Clear all queries to prevent any new requests
    queryClient.clear();
    
    try {
      // Send logout request BEFORE clearing token
      await apiClient.post('/api/v1/auth/logout', { token: currentToken }, {
        headers: {
          'X-Logout-Request': 'true',
        },
      });
    } catch (error: any) {
      // Ignore logout errors - still clear local state
      // 401/400 is expected if token was already invalidated or invalid
      // Suppress error completely for logout
    } finally {
      // Clear token AFTER logout request is sent
    onLogout();
      
      // Reset logout state
      resetLogoutState();
      
      // Small delay to ensure state is cleared before navigation
      setTimeout(() => {
        navigate('/login');
      }, 100);
    }
  };

  const getInitials = () => {
    if (isLoading || !profile) return 'L';
    const ch = profile.fullName && profile.fullName.length > 0 ? profile.fullName.charAt(0) : 'L';
    return ch.toUpperCase();
  };

  const handleMenuClick = () => {
    if (window.innerWidth >= 1024) {
      onToggleCollapse?.();
    } else {
      onToggleSidebar?.();
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                eDental
              </h1>
              <p className="text-xs text-muted-foreground">Patient Dashboard</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onEditProfile}>
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
          <Avatar className="h-9 w-9 border-2 border-primary/20">
            <AvatarImage src="" />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default PatientHeader;

