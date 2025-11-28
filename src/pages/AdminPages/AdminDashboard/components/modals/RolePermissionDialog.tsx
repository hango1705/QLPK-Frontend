import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
} from '@/components/ui';
import { Plus, X, Shield, Key } from 'lucide-react';
import type { Role, Permission } from '@/types/admin';
import { cn } from '@/utils/cn';

interface RolePermissionDialogProps {
  open: boolean;
  role: Role | null;
  allPermissions: Permission[];
  onOpenChange: (open: boolean) => void;
  onAddPermission: (roleName: string, permissionName: string) => void;
  onRemovePermission: (roleName: string, permissionName: string) => void;
  isLoading: boolean;
}

const RolePermissionDialog: React.FC<RolePermissionDialogProps> = ({
  open,
  role,
  allPermissions,
  onOpenChange,
  onAddPermission,
  onRemovePermission,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!role) return null;

  const rolePermissions = role.permissions || [];
  const rolePermissionNames = new Set(rolePermissions.map((p) => p.name));

  const availablePermissions = allPermissions.filter(
    (perm) =>
      !rolePermissionNames.has(perm.name) &&
      perm.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddPermission = (permissionName: string) => {
    onAddPermission(role.name, permissionName);
  };

  const handleRemovePermission = (permissionName: string) => {
    onRemovePermission(role.name, permissionName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-2 border-b border-border/70 px-6 pb-4 pt-6">
          <DialogTitle className="text-xl font-semibold text-foreground">
            Quản lý quyền cho vai trò: {role.name}
          </DialogTitle>
          <DialogDescription>
            Thêm hoặc xóa quyền cho vai trò này
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 py-6">
          {/* Current Permissions */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Quyền hiện có ({rolePermissions.length})
            </h3>
            {rolePermissions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                <Key className="mx-auto mb-2 h-6 w-6 opacity-50" />
                <p>Chưa có quyền nào</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {rolePermissions.map((perm) => (
                  <Badge
                    key={perm.name}
                    variant="outline"
                    className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20"
                  >
                    <Shield className="h-3 w-3" />
                    {perm.name}
                    <button
                      type="button"
                      onClick={() => handleRemovePermission(perm.name)}
                      className="ml-1 rounded-full hover:bg-primary/20"
                      disabled={isLoading}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Available Permissions */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Quyền có sẵn ({availablePermissions.length})
              </h3>
              <input
                type="text"
                placeholder="Tìm kiếm quyền..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg border border-border/70 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {availablePermissions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                <p>
                  {searchQuery ? 'Không tìm thấy quyền nào' : 'Đã thêm tất cả quyền'}
                </p>
              </div>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {availablePermissions.map((perm) => (
                  <div
                    key={perm.name}
                    className="flex items-center justify-between rounded-xl border border-border/70 bg-white/60 px-3 py-2 transition hover:shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{perm.name}</p>
                      {perm.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                          {perm.description}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddPermission(perm.name)}
                      disabled={isLoading}
                      className="ml-2 border-primary/40 text-primary hover:bg-primary/10"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-wrap gap-3 border-t border-border/70 bg-white px-6 py-4">
          <Button variant="outline" className="flex-1 border-border/70" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RolePermissionDialog;

