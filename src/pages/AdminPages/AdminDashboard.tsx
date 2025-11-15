import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showNotification, Loading } from '@/components/ui';
import { adminAPI } from '@/services/api/admin';
import { authAPI } from '@/services/api/auth';
import { queryKeys } from '@/services/queryClient';
import { useAuth } from '@/hooks';
import AdminSidebar from './AdminDashboard/components/AdminSidebar';
import AdminHeader from './AdminDashboard/components/AdminHeader';
import AdminContent from './AdminDashboard/components/AdminContent';
import UserDetailDialog from './AdminDashboard/components/modals/UserDetailDialog';
import AddUserDialog from './AdminDashboard/components/modals/AddUserDialog';
import RoleDialog from './AdminDashboard/components/modals/RoleDialog';
import PermissionDialog from './AdminDashboard/components/modals/PermissionDialog';
import RolePermissionDialog from './AdminDashboard/components/modals/RolePermissionDialog';
import CategoryDialog from './AdminDashboard/components/modals/CategoryDialog';
import ServiceDialog from './AdminDashboard/components/modals/ServiceDialog';
import PrescriptionDialog from './AdminDashboard/components/modals/PrescriptionDialog';
import { SECTION_CONFIG } from './AdminDashboard/constants';
import type { Section } from './AdminDashboard/types';
import type {
  User,
  Role,
  Permission,
  RoleRequest,
  PermissionRequest,
  CategoryDentalService,
  DentalService,
  Prescription,
  CategoryDentalServiceRequest,
  DentalServiceRequest,
  PrescriptionRequest,
  PrescriptionUpdateRequest,
} from '@/types/admin';
import type { DoctorCreateRequest, NurseCreateRequest } from '@/services/api/auth';

const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [rolePermissionDialogOpen, setRolePermissionDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryDentalService | null>(null);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<DentalService | null>(null);
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [addUserType, setAddUserType] = useState<'doctor' | 'nurse'>('doctor');
  const queryClient = useQueryClient();
  const { logout } = useAuth();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: queryKeys.admin.profile,
    queryFn: adminAPI.getMyInfo,
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: queryKeys.admin.users,
    queryFn: adminAPI.getAllUsers,
  });

  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: queryKeys.admin.roles,
    queryFn: adminAPI.getAllRoles,
  });

  const { data: permissions = [], isLoading: loadingPermissions } = useQuery({
    queryKey: queryKeys.admin.permissions,
    queryFn: adminAPI.getAllPermissions,
  });

  const { data: auditLogs = [], isLoading: loadingAuditLogs } = useQuery({
    queryKey: queryKeys.admin.auditLogs,
    queryFn: adminAPI.getAllAuditLogs,
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: queryKeys.admin.categories,
    queryFn: adminAPI.getAllCategories,
  });

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: queryKeys.admin.services,
    queryFn: adminAPI.getAllServices,
  });

  const { data: prescriptions = [], isLoading: loadingPrescriptions } = useQuery({
    queryKey: queryKeys.admin.prescriptions,
    queryFn: adminAPI.getAllPrescriptions,
  });

  const disableUserMutation = useMutation({
    mutationFn: (userId: string) => adminAPI.disableUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      showNotification.success('Đã vô hiệu hóa người dùng');
    },
    onError: (error: any) => {
      showNotification.error('Không thể vô hiệu hóa người dùng', error?.message || 'Đã xảy ra lỗi');
    },
  });

  const enableUserMutation = useMutation({
    mutationFn: (userId: string) => adminAPI.enableUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      showNotification.success('Đã kích hoạt người dùng');
    },
    onError: (error: any) => {
      showNotification.error('Không thể kích hoạt người dùng', error?.message || 'Đã xảy ra lỗi');
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: (payload: RoleRequest) => adminAPI.createRole(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles });
      showNotification.success('Đã tạo vai trò mới');
      setRoleDialogOpen(false);
      setSelectedRole(null);
    },
    onError: (error: any) => {
      showNotification.error('Không thể tạo vai trò', error?.message || 'Đã xảy ra lỗi');
    },
  });

  const addPermissionToRoleMutation = useMutation({
    mutationFn: ({ roleName, permissionName }: { roleName: string; permissionName: string }) =>
      adminAPI.addPermissionToRole(roleName, permissionName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles });
      showNotification.success('Đã thêm quyền vào vai trò');
    },
    onError: (error: any) => {
      showNotification.error('Không thể thêm quyền', error?.message || 'Đã xảy ra lỗi');
    },
  });

  const removePermissionFromRoleMutation = useMutation({
    mutationFn: ({ roleName, permissionName }: { roleName: string; permissionName: string }) =>
      adminAPI.removePermissionFromRole(roleName, permissionName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles });
      showNotification.success('Đã xóa quyền khỏi vai trò');
    },
    onError: (error: any) => {
      showNotification.error('Không thể xóa quyền', error?.message || 'Đã xảy ra lỗi');
    },
  });

  const createPermissionMutation = useMutation({
    mutationFn: (payload: PermissionRequest) => adminAPI.createPermission(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.permissions });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles });
      showNotification.success('Đã tạo quyền mới');
      setPermissionDialogOpen(false);
    },
    onError: (error: any) => {
      showNotification.error('Không thể tạo quyền', error?.message || 'Đã xảy ra lỗi');
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (payload: CategoryDentalServiceRequest) => adminAPI.createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.services });
      showNotification.success('Đã tạo danh mục mới');
      setCategoryDialogOpen(false);
      setSelectedCategory(null);
    },
    onError: (error: any) => {
      showNotification.error('Không thể tạo danh mục', error?.message || 'Đã xảy ra lỗi');
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ categoryId, payload }: { categoryId: string; payload: CategoryDentalServiceRequest }) =>
      adminAPI.updateCategory(categoryId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.services });
      showNotification.success('Đã cập nhật danh mục');
      setCategoryDialogOpen(false);
      setSelectedCategory(null);
    },
    onError: (error: any) => {
      showNotification.error('Không thể cập nhật danh mục', error?.message || 'Đã xảy ra lỗi');
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: ({ categoryId, payload }: { categoryId: string; payload: DentalServiceRequest }) =>
      adminAPI.createService(categoryId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.services });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories });
      showNotification.success('Đã tạo dịch vụ mới');
      setServiceDialogOpen(false);
      setSelectedService(null);
    },
    onError: (error: any) => {
      showNotification.error('Không thể tạo dịch vụ', error?.message || 'Đã xảy ra lỗi');
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ serviceId, payload }: { serviceId: string; payload: DentalServiceRequest }) =>
      adminAPI.updateService(serviceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.services });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories });
      showNotification.success('Đã cập nhật dịch vụ');
      setServiceDialogOpen(false);
      setSelectedService(null);
    },
    onError: (error: any) => {
      showNotification.error('Không thể cập nhật dịch vụ', error?.message || 'Đã xảy ra lỗi');
    },
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: (payload: PrescriptionRequest) => adminAPI.createPrescription(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.prescriptions });
      showNotification.success('Đã tạo đơn thuốc mới');
      setPrescriptionDialogOpen(false);
      setSelectedPrescription(null);
    },
    onError: (error: any) => {
      showNotification.error('Không thể tạo đơn thuốc', error?.message || 'Đã xảy ra lỗi');
    },
  });

  const updatePrescriptionMutation = useMutation({
    mutationFn: ({ prescriptionName, payload }: { prescriptionName: string; payload: PrescriptionUpdateRequest }) =>
      adminAPI.updatePrescription(prescriptionName, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.prescriptions });
      showNotification.success('Đã cập nhật đơn thuốc');
      setPrescriptionDialogOpen(false);
      setSelectedPrescription(null);
    },
    onError: (error: any) => {
      showNotification.error('Không thể cập nhật đơn thuốc', error?.message || 'Đã xảy ra lỗi');
    },
  });

  const registerDoctorMutation = useMutation({
    mutationFn: (payload: DoctorCreateRequest) => authAPI.registerDoctor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      showNotification.success('Đã tạo tài khoản bác sĩ mới');
      setAddUserDialogOpen(false);
    },
    onError: (error: any) => {
      showNotification.error('Không thể tạo tài khoản bác sĩ', error?.message || 'Đã xảy ra lỗi');
    },
  });

  const registerNurseMutation = useMutation({
    mutationFn: (payload: NurseCreateRequest) => authAPI.registerNurse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      showNotification.success('Đã tạo tài khoản y tá mới');
      setAddUserDialogOpen(false);
    },
    onError: (error: any) => {
      showNotification.error('Không thể tạo tài khoản y tá', error?.message || 'Đã xảy ra lỗi');
    },
  });

  const isLoadingPage = loadingProfile || loadingUsers || loadingRoles || loadingPermissions || loadingAuditLogs;

  const handleLogout = async () => {
    try {
      await logout();
      showNotification.success('Đăng xuất thành công');
    } catch (error) {
      showNotification.error('Đăng xuất thất bại');
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setUserDetailOpen(true);
  };

  const handleDisableUser = (userId: string) => {
    disableUserMutation.mutate(userId);
  };

  const handleEnableUser = (userId: string) => {
    enableUserMutation.mutate(userId);
  };

  const handleCreateRole = () => {
    setSelectedRole(null);
    setRoleDialogOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setRolePermissionDialogOpen(true);
  };

  const handleCreatePermission = () => {
    setPermissionDialogOpen(true);
  };

  const handleAddPermission = (roleName: string, permissionName: string) => {
    addPermissionToRoleMutation.mutate({ roleName, permissionName });
  };

  const handleRemovePermission = (roleName: string, permissionName: string) => {
    removePermissionFromRoleMutation.mutate({ roleName, permissionName });
  };

  const handleRoleSubmit = (form: RoleRequest) => {
    createRoleMutation.mutate(form);
  };

  const handlePermissionSubmit = (form: PermissionRequest) => {
    createPermissionMutation.mutate(form);
  };

  const handleFilterAudit = (filters: any) => {
    // Client-side filtering is handled in AuditSection component
    // This is kept for future server-side filtering if needed
  };

  const handleCreateCategory = () => {
    setSelectedCategory(null);
    setCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: CategoryDentalService) => {
    setSelectedCategory(category);
    setCategoryDialogOpen(true);
  };

  const handleCreateService = () => {
    setSelectedService(null);
    setServiceDialogOpen(true);
  };

  const handleEditService = (service: DentalService) => {
    setSelectedService(service);
    setServiceDialogOpen(true);
  };

  const handleCreatePrescription = () => {
    setSelectedPrescription(null);
    setPrescriptionDialogOpen(true);
  };

  const handleEditPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setPrescriptionDialogOpen(true);
  };

  const handleCategorySubmit = (form: CategoryDentalServiceRequest) => {
    if (selectedCategory) {
      updateCategoryMutation.mutate({ categoryId: selectedCategory.id, payload: form });
    } else {
      createCategoryMutation.mutate(form);
    }
  };

  const handleServiceSubmit = (categoryId: string, form: DentalServiceRequest) => {
    if (selectedService) {
      updateServiceMutation.mutate({ serviceId: selectedService.id!, payload: form });
    } else {
      createServiceMutation.mutate({ categoryId, payload: form });
    }
  };

  const handlePrescriptionSubmit = (form: PrescriptionRequest) => {
    if (selectedPrescription) {
      // For update, exclude name from payload
      const { name, ...updatePayload } = form;
      updatePrescriptionMutation.mutate({ prescriptionName: selectedPrescription.name, payload: updatePayload });
    } else {
      createPrescriptionMutation.mutate(form);
    }
  };

  const handleAddDoctor = () => {
    setAddUserType('doctor');
    setAddUserDialogOpen(true);
  };

  const handleAddNurse = () => {
    setAddUserType('nurse');
    setAddUserDialogOpen(true);
  };

  const handleAddUserSubmit = (data: DoctorCreateRequest | NurseCreateRequest) => {
    if (addUserType === 'doctor') {
      registerDoctorMutation.mutate(data as DoctorCreateRequest);
    } else {
      registerNurseMutation.mutate(data as NurseCreateRequest);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-fresh text-foreground">
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isCollapsed={isNavCollapsed}
        onToggleCollapse={() => setIsNavCollapsed((prev) => !prev)}
      />

      <div className="flex flex-1 flex-col">
        <AdminHeader
          profile={profile}
          activeSection={SECTION_CONFIG[activeSection].label}
          onLogout={handleLogout}
        />

        <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 lg:px-6">
          {isLoadingPage ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loading size="lg" />
            </div>
          ) : (
            <AdminContent
              activeSection={activeSection}
              users={users}
              roles={roles}
              permissions={permissions}
              auditLogs={auditLogs}
              categories={categories}
              services={services}
              prescriptions={prescriptions}
              onViewUser={handleViewUser}
              onDisableUser={handleDisableUser}
              onEnableUser={handleEnableUser}
              onAddDoctor={handleAddDoctor}
              onAddNurse={handleAddNurse}
              onCreateRole={handleCreateRole}
              onEditRole={handleEditRole}
              onAddPermission={handleAddPermission}
              onRemovePermission={handleRemovePermission}
              onCreatePermission={handleCreatePermission}
              onFilterAudit={handleFilterAudit}
              onCreateCategory={handleCreateCategory}
              onEditCategory={handleEditCategory}
              onCreateService={handleCreateService}
              onEditService={handleEditService}
              onCreatePrescription={handleCreatePrescription}
              onEditPrescription={handleEditPrescription}
              isLoading={loadingUsers}
            />
          )}
        </main>
      </div>

      <UserDetailDialog
        open={userDetailOpen}
        user={selectedUser}
        onOpenChange={setUserDetailOpen}
        onDisable={handleDisableUser}
        onEnable={handleEnableUser}
      />

      <RoleDialog
        open={roleDialogOpen}
        role={selectedRole}
        onOpenChange={setRoleDialogOpen}
        onSubmit={handleRoleSubmit}
        isLoading={createRoleMutation.isPending}
      />

      <PermissionDialog
        open={permissionDialogOpen}
        onOpenChange={setPermissionDialogOpen}
        onSubmit={handlePermissionSubmit}
        isLoading={createPermissionMutation.isPending}
      />

      <RolePermissionDialog
        open={rolePermissionDialogOpen}
        role={selectedRole}
        allPermissions={permissions}
        onOpenChange={setRolePermissionDialogOpen}
        onAddPermission={handleAddPermission}
        onRemovePermission={handleRemovePermission}
        isLoading={addPermissionToRoleMutation.isPending || removePermissionFromRoleMutation.isPending}
      />

      <CategoryDialog
        open={categoryDialogOpen}
        category={selectedCategory}
        onOpenChange={setCategoryDialogOpen}
        onSubmit={handleCategorySubmit}
        isLoading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
      />

      <ServiceDialog
        open={serviceDialogOpen}
        service={selectedService}
        categories={categories}
        onOpenChange={setServiceDialogOpen}
        onSubmit={handleServiceSubmit}
        isLoading={createServiceMutation.isPending || updateServiceMutation.isPending}
      />

      <PrescriptionDialog
        open={prescriptionDialogOpen}
        prescription={selectedPrescription}
        onOpenChange={setPrescriptionDialogOpen}
        onSubmit={handlePrescriptionSubmit}
        isLoading={createPrescriptionMutation.isPending || updatePrescriptionMutation.isPending}
      />

      <AddUserDialog
        open={addUserDialogOpen}
        userType={addUserType}
        onOpenChange={setAddUserDialogOpen}
        onSubmit={handleAddUserSubmit}
        isLoading={registerDoctorMutation.isPending || registerNurseMutation.isPending}
      />
    </div>
  );
};

export default AdminDashboard;

