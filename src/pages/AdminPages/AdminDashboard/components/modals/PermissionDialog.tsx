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
import type { Permission, PermissionRequest } from '@/types/admin';

interface PermissionDialogProps {
  open: boolean;
  permission?: Permission | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PermissionRequest) => void;
  isLoading: boolean;
}

const PermissionDialog: React.FC<PermissionDialogProps> = ({
  open,
  permission,
  onOpenChange,
  onSubmit,
  isLoading,
}) => {
  const [form, setForm] = useState<PermissionRequest>({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (permission) {
      setForm({
        name: permission.name || '',
        description: permission.description || '',
      });
    } else {
      setForm({
        name: '',
        description: '',
      });
    }
  }, [permission, open]);

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
            Tạo quyền mới
          </DialogTitle>
          <DialogDescription>
            Thêm quyền mới vào hệ thống
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Tên quyền <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="VD: READ APPOINTMENT, WRITE EXAMINATION"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })}
              className="uppercase"
            />
            <p className="text-xs text-muted-foreground">
              Sử dụng format: ACTION RESOURCE (VD: READ APPOINTMENT)
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Mô tả</label>
            <Input
              placeholder="Mô tả quyền này..."
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
            {isLoading ? 'Đang xử lý...' : 'Tạo mới'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PermissionDialog;

