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
import type { CategoryDentalService, CategoryDentalServiceRequest } from '@/types/admin';

interface CategoryDialogProps {
  open: boolean;
  category?: CategoryDentalService | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CategoryDentalServiceRequest) => void;
  isLoading: boolean;
}

const CategoryDialog: React.FC<CategoryDialogProps> = ({
  open,
  category,
  onOpenChange,
  onSubmit,
  isLoading,
}) => {
  const [form, setForm] = useState<CategoryDentalServiceRequest>({
    name: '',
  });

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name || '',
      });
    } else {
      setForm({
        name: '',
      });
    }
  }, [category, open]);

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
            {category ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
          </DialogTitle>
          <DialogDescription>
            {category ? 'Cập nhật thông tin danh mục' : 'Thêm danh mục dịch vụ mới vào hệ thống'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Tên danh mục <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="VD: Niềng răng, Trồng răng sứ..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
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
            {isLoading ? 'Đang xử lý...' : category ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDialog;

