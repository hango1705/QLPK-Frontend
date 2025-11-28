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
import type { Prescription, PrescriptionRequest } from '@/types/admin';

interface PrescriptionDialogProps {
  open: boolean;
  prescription?: Prescription | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PrescriptionRequest) => void;
  isLoading: boolean;
}

const PrescriptionDialog: React.FC<PrescriptionDialogProps> = ({
  open,
  prescription,
  onOpenChange,
  onSubmit,
  isLoading,
}) => {
  const [form, setForm] = useState<PrescriptionRequest>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    notes: '',
    unitPrice: 0,
  });

  useEffect(() => {
    if (prescription) {
      setForm({
        name: prescription.name || '',
        dosage: prescription.dosage || '',
        frequency: prescription.frequency || '',
        duration: prescription.duration || '',
        notes: prescription.notes || '',
        unitPrice: prescription.unitPrice || 0,
      });
    } else {
      setForm({
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        notes: '',
        unitPrice: 0,
      });
    }
  }, [prescription, open]);

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
            {prescription ? 'Chỉnh sửa đơn thuốc' : 'Tạo đơn thuốc mới'}
          </DialogTitle>
          <DialogDescription>
            {prescription ? 'Cập nhật thông tin đơn thuốc' : 'Thêm đơn thuốc mới vào hệ thống'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Tên thuốc <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="VD: Amoxicillin 500mg..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={!!prescription} // Cannot edit name when editing
            />
            {prescription && (
              <p className="text-xs text-muted-foreground">
                Không thể thay đổi tên thuốc sau khi tạo
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Liều lượng</label>
              <Input
                placeholder="VD: 500mg"
                value={form.dosage}
                onChange={(e) => setForm({ ...form, dosage: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tần suất</label>
              <Input
                placeholder="VD: 3 lần/ngày"
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Thời gian dùng</label>
            <Input
              placeholder="VD: sau ăn 30 phút"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Giá</label>
            <Input
              type="number"
              placeholder="0"
              value={form.unitPrice || ''}
              onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })}
              min="0"
              step="1000"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Ghi chú</label>
            <Input
              placeholder="Ghi chú về thuốc..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
            {isLoading ? 'Đang xử lý...' : prescription ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrescriptionDialog;

