import apiClient from './client';
import type {
  User,
  Role,
  Permission,
  AuditLog,
  CategoryDentalService,
  DentalService,
  Prescription,
  RoleRequest,
  PermissionRequest,
  CategoryDentalServiceRequest,
  DentalServiceRequest,
  PrescriptionRequest,
  PrescriptionUpdateRequest,
} from '@/types/admin';

// Helper to unwrap ApiResponses
const unwrap = <T,>(response: any): T => {
  if (response?.data?.result !== undefined) {
    return response.data.result;
  }
  return response.data;
};

export const adminAPI = {
  // User Management
  getAllUsers: async (): Promise<User[]> => {
    const response = await apiClient.get('/api/v1/users');
    return unwrap<User[]>(response);
  },

  getUserById: async (userId: string): Promise<User> => {
    const response = await apiClient.get(`/api/v1/users/${userId}`);
    return unwrap<User>(response);
  },

  getMyInfo: async (): Promise<User> => {
    const response = await apiClient.get('/api/v1/users/myInfo');
    return unwrap<User>(response);
  },

  updateUserInfo: async (userId: string, data: any): Promise<User> => {
    const response = await apiClient.put(`/api/v1/users/updateInfo/${userId}`, data);
    return unwrap<User>(response);
  },

  updatePassword: async (userId: string, data: { oldPassword: string; password: string }): Promise<string> => {
    const response = await apiClient.put(`/api/v1/users/updatePassword/${userId}`, data);
    return unwrap<string>(response);
  },

  disableUser: async (userId: string): Promise<string> => {
    const response = await apiClient.put(`/api/v1/users/disableUser/${userId}`);
    return unwrap<string>(response);
  },

  enableUser: async (userId: string): Promise<string> => {
    const response = await apiClient.put(`/api/v1/users/enableUser/${userId}`);
    return unwrap<string>(response);
  },

  // Role Management
  getAllRoles: async (): Promise<Role[]> => {
    const response = await apiClient.get('/api/v1/role');
    return unwrap<Role[]>(response);
  },

  createRole: async (payload: RoleRequest): Promise<string> => {
    const response = await apiClient.post('/api/v1/role', payload);
    return unwrap<string>(response);
  },

  addPermissionToRole: async (roleName: string, permissionName: string): Promise<string> => {
    const response = await apiClient.post(`/api/v1/role/${roleName}/addPermission/${permissionName}`);
    return unwrap<string>(response);
  },

  removePermissionFromRole: async (roleName: string, permissionName: string): Promise<string> => {
    const response = await apiClient.post(`/api/v1/role/${roleName}/deletePermission/${permissionName}`);
    return unwrap<string>(response);
  },

  /**
   * Update doctor level to DOCTORLV2 (Admin only)
   * @param doctorId - Doctor ID to upgrade
   * @returns Success message
   */
  updateDoctorLevel: async (doctorId: string): Promise<string> => {
    const response = await apiClient.post(`/api/v1/role/${doctorId}/updateLevel`);
    return unwrap<string>(response);
  },

  // Permission Management
  getAllPermissions: async (): Promise<Permission[]> => {
    const response = await apiClient.get('/api/v1/permission');
    return unwrap<Permission[]>(response);
  },

  createPermission: async (payload: PermissionRequest): Promise<string> => {
    const response = await apiClient.post('/api/v1/permission', payload);
    return unwrap<string>(response);
  },

  // NOTE: getAllAuditLogs endpoint does not exist in Backend
  // getAllAuditLogs: async (): Promise<AuditLog[]> => {
  //   const response = await apiClient.get('/api/v1/auditLog');
  //   return unwrap<AuditLog[]>(response);
  // },

  // Category Dental Service
  getAllCategories: async (): Promise<CategoryDentalService[]> => {
    const response = await apiClient.get('/api/v1/categoryDentalService');
    return unwrap<CategoryDentalService[]>(response);
  },

  createCategory: async (payload: CategoryDentalServiceRequest): Promise<CategoryDentalService> => {
    const response = await apiClient.post('/api/v1/categoryDentalService', payload);
    return unwrap<CategoryDentalService>(response);
  },

  updateCategory: async (categoryId: string, payload: CategoryDentalServiceRequest): Promise<CategoryDentalService> => {
    const response = await apiClient.put(`/api/v1/categoryDentalService/${categoryId}`, payload);
    return unwrap<CategoryDentalService>(response);
  },

  // Dental Service
  getAllServices: async (): Promise<DentalService[]> => {
    const response = await apiClient.get('/api/v1/dentalService');
    return unwrap<DentalService[]>(response);
  },

  createService: async (categoryId: string, payload: DentalServiceRequest): Promise<DentalService> => {
    const response = await apiClient.post(`/api/v1/dentalService/${categoryId}`, payload);
    return unwrap<DentalService>(response);
  },

  updateService: async (serviceId: string, payload: DentalServiceRequest): Promise<DentalService> => {
    const response = await apiClient.put(`/api/v1/dentalService/${serviceId}`, payload);
    return unwrap<DentalService>(response);
  },

  // Prescription
  getAllPrescriptions: async (): Promise<Prescription[]> => {
    const response = await apiClient.get('/api/v1/prescription');
    return unwrap<Prescription[]>(response);
  },

  createPrescription: async (payload: PrescriptionRequest): Promise<Prescription> => {
    const response = await apiClient.post('/api/v1/prescription', payload);
    return unwrap<Prescription>(response);
  },

  updatePrescription: async (prescriptionName: string, payload: PrescriptionUpdateRequest): Promise<Prescription> => {
    const response = await apiClient.put(`/api/v1/prescription/${prescriptionName}`, payload);
    return unwrap<Prescription>(response);
  },
};

