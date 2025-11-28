import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
} from '@/components/ui';
import type { Role, RoleRequest } from '@/types/admin';

interface RoleDialogProps {
  open: boolean;
  role?: Role | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RoleRequest) => void;
  isLoading: boolean;
}

const RoleDialog: React.FC<RoleDialogProps> = ({
  open,
  role,
  onOpenChange,
  onSubmit,
  isLoading,
}) => {
  const [form, setForm] = useState<RoleRequest>({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (role) {
      setForm({
        name: role.name || '',
        description: role.description || '',
      });
    } else {
      setForm({
        name: '',
        description: '',
      });
    }
  }, [role, open]);

  const handleSubmit = () => {
    if (!form.name.trim()) {
      return;
    }
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-0 sm:max-w-lg">
        <DialogHeader className="space-y-2 border-b border-border/70 px-6 pb-4 pt-6">
          <DialogTitle className="text-xl font-semibold text-foreground">
            {role ? 'Chỉnh sửa vai trò' : 'Tạo vai trò mới'}
          </DialogTitle>
          <DialogDescription>
            {role ? 'Cập nhật thông tin vai trò' : 'Thêm vai trò mới vào hệ thống'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Tên vai trò <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="VD: ADMIN, DOCTOR, NURSE"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })}
              disabled={!!role} // Cannot edit role name if editing
              className="uppercase"
            />
            {role && (
              <p className="text-xs text-muted-foreground">
                Không thể thay đổi tên vai trò sau khi tạo
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Mô tả</label>
            <Input
              placeholder="Mô tả vai trò này..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-wrap gap-3 border-t border-border/70 bg-white px-6 py-4">
          <Button variant="outline" className="flex-1 border-border/70" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            className="flex-1 bg-primary text-white hover:bg-primary/90"
            onClick={handleSubmit}
            disabled={isLoading || !form.name.trim()}
          >
            {isLoading ? 'Đang xử lý...' : role ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoleDialog;

