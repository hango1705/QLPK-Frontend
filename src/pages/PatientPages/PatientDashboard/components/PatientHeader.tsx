import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import { LogOut, User } from 'lucide-react';
import type { PatientHeaderProps } from '../types';
import apiClient, { cancelAllPendingRequests, resetLogoutState, isLogoutInProgress } from '@/services/api/client';
import { useAuth } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/utils/cn';

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

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-white/90 px-4 py-4 backdrop-blur-sm lg:px-6 min-w-0">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <h1 className="text-xl font-semibold text-foreground truncate">{activeSection}</h1>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
              <User className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-primary">
                {profile?.fullName || profile?.username || 'Bệnh nhân'}
              </span>
              <span className="text-[10px] text-primary/70">Bệnh nhân</span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className={cn(
            'border-border/70 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30',
          )}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </Button>
      </div>
    </header>
  );
};

export default PatientHeader;

