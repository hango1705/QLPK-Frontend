import React from 'react';
import { useAuth } from '@/hooks';

const DebugAuth = () => {
  const auth = useAuth();

  const clearAuth = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      padding: '10px', 
      border: '1px solid #ccc',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Debug Auth State:</h4>
      <p><strong>isAuthenticated:</strong> {auth.isAuthenticated ? 'true' : 'false'}</p>
      <p><strong>token:</strong> {auth.token ? 'exists' : 'null'}</p>
      <p><strong>user:</strong> {auth.user ? auth.user.username : 'null'}</p>
      <p><strong>isLoading:</strong> {auth.isLoading ? 'true' : 'false'}</p>
      <p><strong>error:</strong> {auth.error || 'none'}</p>
      <button 
        onClick={clearAuth}
        style={{
          background: 'red',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '3px',
          cursor: 'pointer',
          marginTop: '5px'
        }}
      >
        Clear Auth & Reload
      </button>
    </div>
  );
};

export default DebugAuth;
