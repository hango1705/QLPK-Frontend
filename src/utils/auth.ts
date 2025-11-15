export type AppRole = 'admin' | 'doctor' | 'nurse' | 'patient';

const normalizeBase64 = (segment: string) => {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (base64.length % 4)) % 4;
  return base64 + '='.repeat(padding);
};

const decodeBase64 = (encoded: string) => {
  if (typeof globalThis !== 'undefined') {
    const globalAtob = (globalThis as typeof globalThis & { atob?: typeof atob }).atob;
    if (typeof globalAtob === 'function') {
      return globalAtob(encoded);
    }

    const globalBuffer = (globalThis as typeof globalThis & { Buffer?: { from: (input: string, encoding: string) => { toString: (encoding: string) => string } } }).Buffer;
    if (globalBuffer) {
      return globalBuffer.from(encoded, 'base64').toString('utf-8');
    }
  }

  throw new Error('Base64 decoding is not supported in this environment');
};

export const decodeTokenPayload = <T = Record<string, unknown>>(token?: string): T | null => {
  if (!token) return null;
  const [, payload] = token.split('.');
  if (!payload) return null;
  try {
    const decoded = decodeBase64(normalizeBase64(payload));
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
};

const deriveRoleFromScope = (scope?: string): AppRole => {
  if (!scope) return 'patient';
  const scopes = scope.split(' ').filter(Boolean);
  if (scopes.includes('ROLE_ADMIN')) return 'admin';
  if (scopes.includes('ROLE_DOCTOR')) return 'doctor';
  if (scopes.includes('ROLE_NURSE')) return 'nurse';
  if (scopes.includes('ROLE_PATIENT')) return 'patient';
  return 'patient';
};

export const extractRoleFromToken = (token?: string): AppRole => {
  const payload = decodeTokenPayload<{ scope?: string }>(token);
  return deriveRoleFromScope(payload?.scope);
};

export const extractUsernameFromToken = (token?: string): string | null => {
  const payload = decodeTokenPayload<{ sub?: string }>(token);
  return payload?.sub ?? null;
};

export const getDefaultRouteForRole = (role?: string | null): string => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'doctor':
      return '/doctor';
    case 'nurse':
      return '/nurse';
    case 'patient':
    default:
      return '/patient';
  }
};

/**
 * Check if a token is valid by calling the introspect API
 * This is a PUBLIC endpoint, no authentication required
 * @param token - JWT token to validate
 * @returns Promise<boolean> - true if token is valid, false otherwise
 */
export const checkTokenValidity = async (token: string): Promise<boolean> => {
  try {
    const { authAPI } = await import('@/services/api/auth');
    const response = await authAPI.introspectToken(token);
    return response.data?.code === 1000 && response.data?.result?.valid === true;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

/**
 * Check if token is expired based on payload (client-side check)
 * Note: This is a client-side check only. For server-side validation, use checkTokenValidity()
 * @param token - JWT token to check
 * @returns boolean - true if token is expired or invalid, false if still valid
 */
export const isTokenExpired = (token?: string): boolean => {
  if (!token) return true;
  
  try {
    const payload = decodeTokenPayload<{ exp?: number }>(token);
    if (!payload?.exp) return true;
    
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    
    // Add 5 minute buffer to account for clock skew
    return currentTime >= expirationTime - 5 * 60 * 1000;
  } catch {
    return true;
  }
};

