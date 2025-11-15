import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Input,
  Textarea,
  Button,
  Loading,
} from '@/components/ui';
import type { ExaminationSummary } from '@/types/doctor';

export interface TreatmentPlanFormState {
  title: string;
  description: string;
  duration: string;
  notes: string;
  examinationId: string;
}

interface TreatmentPlanDialogProps {
  open: boolean;
  examination?: ExaminationSummary;
  examinations: ExaminationSummary[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (form: TreatmentPlanFormState) => void;
  isLoading: boolean;
}

const defaultForm: TreatmentPlanFormState = {
  title: '',
  description: '',
  duration: '',
  notes: '',
  examinationId: '',
};

const TreatmentPlanDialog: React.FC<TreatmentPlanDialogProps> = ({
  open,
  examination,
  examinations,
  onOpenChange,
  onSubmit,
  isLoading,
}) => {
  const [form, setForm] = useState<TreatmentPlanFormState>(defaultForm);

  useEffect(() => {
    if (examination) {
      setForm((prev) => ({
        ...prev,
        examinationId: examination.id,
        title: prev.title || `Phác đồ điều trị - ${examination.diagnosis}`,
      }));
    } else {
      setForm(defaultForm);
    }
  }, [examination, open]);

  const handleSubmit = () => {
    if (!form.examinationId) {
      return;
    }
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-2 border-b border-border/70 px-6 pb-4 pt-6">
          <DialogTitle className="text-xl font-semibold text-foreground">Tạo phác đồ điều trị</DialogTitle>
          <DialogDescription>
            Tạo kế hoạch điều trị dựa trên kết quả khám bệnh
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-6">
          <div className="space-y-2">
            <Label>Kết quả khám bệnh *</Label>
            <select
              value={form.examinationId}
              onChange={(e) => setForm((prev) => ({ ...prev, examinationId: e.target.value }))}
              className="w-full rounded-2xl border border-border/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            >
              <option value="">Chọn kết quả khám bệnh</option>
              {examinations.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.diagnosis} - {new Date(exam.createAt).toLocaleDateString('vi-VN')}
                </option>
              ))}
            </select>
            {examination && (
              <p className="text-xs text-muted-foreground">
                Đang chọn: {examination.diagnosis} ({new Date(examination.createAt).toLocaleDateString('vi-VN')})
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tiêu đề phác đồ *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Ví dụ: Điều trị viêm tủy răng hàm dưới"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Mô tả *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Mô tả tổng quan về phác đồ điều trị"
              rows={4}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Thời gian dự kiến</Label>
              <Input
                value={form.duration}
                onChange={(e) => setForm((prev) => ({ ...prev, duration: e.target.value }))}
                placeholder="Ví dụ: 3 tháng, 6 tuần"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Ghi chú thêm về phác đồ điều trị"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 flex flex-wrap gap-3 border-t border-border/70 bg-white px-6 py-4">
          <Button variant="outline" className="flex-1 border-border/70" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            className="flex-1 bg-primary text-white hover:bg-primary/90"
            onClick={handleSubmit}
            disabled={isLoading || !form.examinationId || !form.title || !form.description}
          >
            {isLoading ? <Loading size="sm" /> : 'Tạo phác đồ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TreatmentPlanDialog;

