import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { initializeAuth } from '@/store/slices/authSlice';

interface AuthInitializerProps {
  children: React.ReactNode;
}

const AuthInitializer: React.FC<AuthInitializerProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Initialize auth state from storage (localStorage or sessionStorage)
    // This is called after PersistGate has rehydrated redux state
    // Since auth is NOT in redux-persist whitelist, we manually restore from tokenStorage
    dispatch(initializeAuth());
  }, [dispatch]);

  return <>{children}</>;
};

export default AuthInitializer;
