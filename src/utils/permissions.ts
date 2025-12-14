import { decodeTokenPayload } from './auth';

export type Permission =
  | 'CREATE_EXAMINATION'
  | 'CREATE_TOOTH_STATUS'
  | 'CREATE_TREATMENT_PHASES'
  | 'CREATE_TREATMENT_PLANS'
  | 'GET_ALL_TREATMENT_PHASES'
  | 'GET_BASIC_INFO'
  | 'GET_EXAMINATION_DETAIL'
  | 'GET_INFO_DOCTOR'
  | 'GET_INFO_NURSE'
  | 'GET_TOOTH_STATUS'
  | 'NOTIFICATION_APPOINMENT'
  | 'PICK_DOCTOR'
  | 'PICK_NURSE'
  | 'UPDATE_EXAMINATION'
  | 'UPDATE_PAYMENT_COST'
  | 'UPDATE_TOOTH_STATUS'
  | 'UPDATE_TREATMENT_PHASES'
  | 'UPDATE_TREATMENT_PLANS';

/**
 * Extract permissions from JWT token scope
 * Token scope format: "ROLE_DOCTOR CREATE_EXAMINATION GET_INFO_DOCTOR ..."
 * @param token - JWT token
 * @returns Array of permission strings (without ROLE_ prefix)
 */
export const extractPermissionsFromToken = (token?: string): Permission[] => {
  if (!token) return [];
  
  try {
    const payload = decodeTokenPayload<{ scope?: string }>(token);
    if (!payload?.scope) return [];
    
    const scopes = payload.scope.split(' ').filter(Boolean);
    // Filter out ROLE_ prefixes and return only permissions
    const permissions = scopes
      .filter(scope => !scope.startsWith('ROLE_'))
      .filter((scope): scope is Permission => 
        [
          'CREATE_EXAMINATION',
          'CREATE_TOOTH_STATUS',
          'CREATE_TREATMENT_PHASES',
          'CREATE_TREATMENT_PLANS',
          'GET_ALL_TREATMENT_PHASES',
          'GET_BASIC_INFO',
          'GET_EXAMINATION_DETAIL',
          'GET_INFO_DOCTOR',
          'GET_INFO_NURSE',
          'GET_TOOTH_STATUS',
          'NOTIFICATION_APPOINMENT',
          'PICK_DOCTOR',
          'PICK_NURSE',
          'UPDATE_EXAMINATION',
          'UPDATE_PAYMENT_COST',
          'UPDATE_TOOTH_STATUS',
          'UPDATE_TREATMENT_PHASES',
          'UPDATE_TREATMENT_PLANS',
        ].includes(scope as Permission)
      );
    
    return permissions;
  } catch (error) {
    return [];
  }
};

/**
 * Check if user has a specific permission
 * @param token - JWT token
 * @param permission - Permission to check
 * @returns boolean - true if user has the permission
 */
export const hasPermission = (token: string | null | undefined, permission: Permission): boolean => {
  if (!token) return false;
  const permissions = extractPermissionsFromToken(token);
  return permissions.includes(permission);
};

/**
 * Check if user has any of the specified permissions
 * @param token - JWT token
 * @param permissions - Array of permissions to check
 * @returns boolean - true if user has at least one of the permissions
 */
export const hasAnyPermission = (
  token: string | null | undefined,
  permissions: Permission[]
): boolean => {
  if (!token || permissions.length === 0) return false;
  const userPermissions = extractPermissionsFromToken(token);
  return permissions.some(perm => userPermissions.includes(perm));
};

/**
 * Check if user has all of the specified permissions
 * @param token - JWT token
 * @param permissions - Array of permissions to check
 * @returns boolean - true if user has all of the permissions
 */
export const hasAllPermissions = (
  token: string | null | undefined,
  permissions: Permission[]
): boolean => {
  if (!token || permissions.length === 0) return false;
  const userPermissions = extractPermissionsFromToken(token);
  return permissions.every(perm => userPermissions.includes(perm));
};

