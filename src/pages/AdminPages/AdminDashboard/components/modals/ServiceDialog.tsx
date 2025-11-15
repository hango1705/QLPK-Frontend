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
import type { DentalService, DentalServiceRequest, CategoryDentalService } from '@/types/admin';

interface ServiceDialogProps {
  open: boolean;
  service?: DentalService | null;
  categories: CategoryDentalService[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (categoryId: string, data: DentalServiceRequest) => void;
  isLoading: boolean;
}

const ServiceDialog: React.FC<ServiceDialogProps> = ({
  open,
  service,
  categories,
  onOpenChange,
  onSubmit,
  isLoading,
}) => {
  const [form, setForm] = useState<DentalServiceRequest & { categoryId: string }>({
    name: '',
    unit: '',
    unitPrice: 0,
    categoryId: '',
  });

  useEffect(() => {
    if (service) {
      setForm({
        name: service.name || '',
        unit: service.unit || '',
        unitPrice: service.unitPrice || 0,
        categoryId: service.categoryDentalServiceId || '',
      });
    } else {
      setForm({
        name: '',
        unit: '',
        unitPrice: 0,
        categoryId: categories.length > 0 ? categories[0].id : '',
      });
    }
  }, [service, categories, open]);

  const handleSubmit = () => {
    if (!form.name.trim() || !form.unit.trim() || !form.categoryId) {
      return;
    }
    const { categoryId, ...payload } = form;
    onSubmit(categoryId, payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-0 sm:max-w-lg">
        <DialogHeader className="space-y-2 border-b border-border/70 px-6 pb-4 pt-6">
          <DialogTitle className="text-xl font-semibold text-foreground">
            {service ? 'Chỉnh sửa dịch vụ' : 'Tạo dịch vụ mới'}
          </DialogTitle>
          <DialogDescription>
            {service ? 'Cập nhật thông tin dịch vụ' : 'Thêm dịch vụ nha khoa mới vào hệ thống'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Danh mục <span className="text-destructive">*</span>
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              disabled={!!service} // Cannot change category when editing
              className="w-full rounded-xl border border-border/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-muted"
            >
              <option value="">Chọn danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {service && (
              <p className="text-xs text-muted-foreground">
                Không thể thay đổi danh mục sau khi tạo
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Tên dịch vụ <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="VD: Niềng răng mắc cài kim loại..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Đơn vị <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="VD: Răng, Ca, Hàm..."
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Giá <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                placeholder="0"
                value={form.unitPrice || ''}
                onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })}
                min="0"
                step="1000"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-wrap gap-3 border-t border-border/70 bg-white px-6 py-4">
          <Button variant="outline" className="flex-1 border-border/70" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            className="flex-1 bg-primary text-white hover:bg-primary/90"
            onClick={handleSubmit}
            disabled={isLoading || !form.name.trim() || !form.unit.trim() || !form.categoryId}
          >
            {isLoading ? 'Đang xử lý...' : service ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceDialog;

