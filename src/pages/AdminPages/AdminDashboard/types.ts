import type { User, Role, Permission, AuditLog, CategoryDentalService, DentalService, Prescription } from '@/types/admin';

export type Section =
  | 'overview'
  | 'users'
  | 'roles'
  | 'audit'
  | 'clinic'
  | 'settings';

export interface AdminHeaderProps {
  profile?: { fullName?: string; username?: string };
  activeSection: string;
  onLogout: () => void;
}

export interface AdminSidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export interface OverviewSectionProps {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  recentAuditLogs: AuditLog[];
}

export interface UsersSectionProps {
  users: User[];
  onViewUser: (user: User) => void;
  onDisableUser: (userId: string) => void;
  onEnableUser: (userId: string) => void;
  onAddDoctor?: () => void;
  onAddNurse?: () => void;
  onUpdateDoctorLevel?: (doctorId: string) => void;
  isLoading: boolean;
}

export interface RolesSectionProps {
  roles: Role[];
  permissions: Permission[];
  onCreateRole: () => void;
  onEditRole: (role: Role) => void;
  onAddPermission: (roleName: string, permissionName: string) => void;
  onRemovePermission: (roleName: string, permissionName: string) => void;
  onCreatePermission: () => void;
  isLoading: boolean;
}

export interface AuditSectionProps {
  logs: AuditLog[];
  onFilter: (filters: AuditLogFilters) => void;
  isLoading: boolean;
}

export interface AuditLogFilters {
  username?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

export interface ClinicSectionProps {
  categories: CategoryDentalService[];
  services: DentalService[];
  prescriptions: Prescription[];
  onCreateCategory: () => void;
  onEditCategory: (category: CategoryDentalService) => void;
  onCreateService: () => void;
  onEditService: (service: DentalService) => void;
  onCreatePrescription: () => void;
  onEditPrescription: (prescription: Prescription) => void;
  isLoading: boolean;
}

export interface ContentSectionProps {
  activeSection: Section;
  users: User[];
  roles: Role[];
  permissions: Permission[];
  auditLogs: AuditLog[];
  categories: CategoryDentalService[];
  services: DentalService[];
  prescriptions: Prescription[];
  onViewUser: (user: User) => void;
  onDisableUser: (userId: string) => void;
  onEnableUser: (userId: string) => void;
  onAddDoctor?: () => void;
  onAddNurse?: () => void;
  onCreateRole: () => void;
  onEditRole: (role: Role) => void;
  onAddPermission: (roleName: string, permissionName: string) => void;
  onRemovePermission: (roleName: string, permissionName: string) => void;
  onCreatePermission: () => void;
  onFilterAudit: (filters: AuditLogFilters) => void;
  onCreateCategory: () => void;
  onEditCategory: (category: CategoryDentalService) => void;
  onCreateService: () => void;
  onEditService: (service: DentalService) => void;
  onCreatePrescription: () => void;
  onEditPrescription: (prescription: Prescription) => void;
  isLoading: boolean;
}

