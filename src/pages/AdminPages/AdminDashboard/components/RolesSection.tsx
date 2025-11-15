import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button } from '@/components/ui';
import { Shield, Plus, Settings, Key } from 'lucide-react';
import type { RolesSectionProps } from '../types';
import { ROLE_BADGE } from '../constants';
import { cn } from '@/utils/cn';

const RolesSection: React.FC<RolesSectionProps> = ({
  roles,
  permissions,
  onCreateRole,
  onEditRole,
  onAddPermission,
  onRemovePermission,
  onCreatePermission,
  isLoading,
}) => {
  return (
    <div className="space-y-6">
      {/* Roles Card */}
      <Card className="border-none bg-white/90 shadow-medium">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg">Quản lý vai trò</CardTitle>
            <CardDescription>Tổng {roles.length} vai trò trong hệ thống</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateRole}
            className="border-primary/40 text-primary hover:bg-primary/10"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tạo vai trò mới
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <p className="text-sm text-muted-foreground">Đang tải...</p>
            </div>
          ) : roles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
              <Shield className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>Chưa có vai trò nào</p>
              <Button
                variant="outline"
                size="sm"
                onClick={onCreateRole}
                className="mt-4"
              >
                Tạo vai trò đầu tiên
              </Button>
            </div>
          ) : (
            roles.map((role) => (
              <div
                key={role.name}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-white/60 px-4 py-4 transition hover:shadow-medium"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground uppercase">
                        {role.name}
                      </p>
                      <Badge className={cn('text-xs', ROLE_BADGE[role.name.toLowerCase()] || 'bg-gray-50 text-gray-600 border border-gray-100')}>
                        {role.name}
                      </Badge>
                      {role.permissions && role.permissions.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {role.permissions.length} quyền
                        </Badge>
                      )}
                    </div>
                    {role.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{role.description}</p>
                    )}
                    {role.permissions && role.permissions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((perm) => (
                          <Badge
                            key={perm.name}
                            variant="outline"
                            className="text-[10px] bg-muted/50"
                          >
                            {perm.name}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="outline" className="text-[10px] bg-muted/50">
                            +{role.permissions.length - 3} khác
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEditRole(role)}
                    className="border-border/70"
                  >
                    <Settings className="mr-2 h-3.5 w-3.5" />
                    Quản lý
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Permissions Card */}
      <Card className="border-none bg-white/90 shadow-medium">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg">Quản lý quyền</CardTitle>
            <CardDescription>Tổng {permissions.length} quyền trong hệ thống</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onCreatePermission}
            className="border-primary/40 text-primary hover:bg-primary/10"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tạo quyền mới
          </Button>
        </CardHeader>
        <CardContent>
          {permissions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
              <Key className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>Chưa có quyền nào</p>
              <Button
                variant="outline"
                size="sm"
                onClick={onCreatePermission}
                className="mt-4"
              >
                Tạo quyền đầu tiên
              </Button>
            </div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {permissions.map((permission) => (
                <div
                  key={permission.name}
                  className="flex items-start gap-3 rounded-xl border border-border/70 bg-white/60 px-3 py-3 transition hover:shadow-sm"
                >
                  <Key className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{permission.name}</p>
                    {permission.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {permission.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RolesSection;

