/**
 * Token Storage Utility
 * 
 * Handles token persistence based on "Remember Me" preference:
 * - If rememberMe = true: Store in localStorage (persists across browser sessions)
 * - If rememberMe = false: Store in sessionStorage (cleared when browser closes)
 */

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const REMEMBER_ME_KEY = 'auth_remember_me';

export const tokenStorage = {
  /**
   * Save token to appropriate storage based on rememberMe flag
   */
  saveToken: (token: string, refreshToken: string | null, rememberMe: boolean) => {
    if (rememberMe) {
      // Persist across browser sessions
      localStorage.setItem(TOKEN_KEY, token);
      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
      localStorage.setItem(REMEMBER_ME_KEY, 'true');
    } else {
      // Only persist for current session
      sessionStorage.setItem(TOKEN_KEY, token);
      if (refreshToken) {
        sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
      sessionStorage.setItem(REMEMBER_ME_KEY, 'false');
      // Clear from localStorage if exists
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(REMEMBER_ME_KEY);
    }
  },

  /**
   * Get token from storage (checks both localStorage and sessionStorage)
   */
  getToken: (): string | null => {
    // Check localStorage first (rememberMe = true)
    const localToken = localStorage.getItem(TOKEN_KEY);
    if (localToken) {
      return localToken;
    }
    // Fallback to sessionStorage (rememberMe = false)
    return sessionStorage.getItem(TOKEN_KEY);
  },

  /**
   * Get refresh token from storage
   */
  getRefreshToken: (): string | null => {
    const localRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (localRefreshToken) {
      return localRefreshToken;
    }
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  },

  /**
   * Check if user previously selected "Remember Me"
   */
  getRememberMe: (): boolean => {
    const localRememberMe = localStorage.getItem(REMEMBER_ME_KEY);
    if (localRememberMe === 'true') {
      return true;
    }
    const sessionRememberMe = sessionStorage.getItem(REMEMBER_ME_KEY);
    return sessionRememberMe === 'true';
  },

  /**
   * Clear all tokens from both storages
   */
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(REMEMBER_ME_KEY);
  },
};

