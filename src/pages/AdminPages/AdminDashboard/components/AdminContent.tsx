import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Loading } from '@/components/ui';
import type { ContentSectionProps } from '../types';
import OverviewSection from './OverviewSection';
import UsersSection from './UsersSection';
import RolesSection from './RolesSection';
import AuditSection from './AuditSection';
import ClinicSection from './ClinicSection';

const AdminContent: React.FC<ContentSectionProps> = (props) => {
  const { activeSection, users, isLoading } = props;

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activeSection === 'overview' && (
        <OverviewSection
          totalUsers={props.users.length}
          totalDoctors={props.users.filter((u) => u.role === 'doctor').length}
          totalPatients={props.users.filter((u) => u.role === 'patient').length}
          totalAppointments={0} // TODO: Fetch from API if needed
          recentAuditLogs={props.auditLogs.slice(0, 20)}
          categories={props.categories}
          services={props.services}
          prescriptions={props.prescriptions}
          users={props.users}
        />
      )}

      {activeSection === 'users' && (
        <UsersSection
          users={users}
          onViewUser={props.onViewUser}
          onDisableUser={props.onDisableUser}
          onEnableUser={props.onEnableUser}
          onAddDoctor={props.onAddDoctor}
          onAddNurse={props.onAddNurse}
          onUpdateDoctorLevel={props.onUpdateDoctorLevel}
          isLoading={isLoading}
        />
      )}

      {activeSection === 'roles' && (
        <RolesSection
          roles={props.roles}
          permissions={props.permissions}
          onCreateRole={props.onCreateRole}
          onEditRole={props.onEditRole}
          onAddPermission={props.onAddPermission}
          onRemovePermission={props.onRemovePermission}
          onCreatePermission={props.onCreatePermission}
          isLoading={isLoading}
        />
      )}

      {activeSection === 'audit' && (
        <AuditSection
          logs={props.auditLogs}
          onFilter={props.onFilterAudit}
          isLoading={isLoading}
        />
      )}

      {activeSection === 'clinic' && (
        <ClinicSection
          categories={props.categories}
          services={props.services}
          prescriptions={props.prescriptions}
          onCreateCategory={props.onCreateCategory}
          onEditCategory={props.onEditCategory}
          onDeleteCategory={props.onDeleteCategory}
          onCreateService={props.onCreateService}
          onEditService={props.onEditService}
          onDeleteService={props.onDeleteService}
          onCreatePrescription={props.onCreatePrescription}
          onEditPrescription={props.onEditPrescription}
          isLoading={isLoading}
        />
      )}

      {activeSection === 'settings' && (
        <Card className="border-none bg-white/90 shadow-medium">
          <CardHeader>
            <CardTitle>Cài đặt hệ thống</CardTitle>
            <CardDescription>Cấu hình hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Đang phát triển...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminContent;

