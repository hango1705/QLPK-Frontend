import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
  Input,
  Button,
  Loading,
} from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DentalService, PrescriptionItem } from '@/types/doctor';
import type { ExamDialogState, ExaminationFormState } from '../../types';
import { formatDateTime } from '../../utils';
import { doctorAPI } from '@/services';
import { queryKeys } from '@/services/queryClient';

interface ExamDialogProps {
  open: boolean;
  context: ExamDialogState | null;
  services: DentalService[];
  prescriptions: PrescriptionItem[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (form: ExaminationFormState, context: ExamDialogState) => void;
  isLoading: boolean;
}

const defaultForm: ExaminationFormState = {
  symptoms: '',
  diagnosis: '',
  notes: '',
  treatment: '',
  totalCost: 0,
  serviceOrders: [],
  prescriptionOrders: [],
  xrayFiles: [],
  faceFiles: [],
  teethFiles: [],
  removeImageIds: [],
};

const ExamDialog: React.FC<ExamDialogProps> = ({
  open,
  context,
  services,
  prescriptions,
  onOpenChange,
  onSubmit,
  isLoading,
}) => {
  const [form, setForm] = useState<ExaminationFormState>(defaultForm);

  // Tự động load examination nếu đã có khi mở từ appointment
  const { data: existingExamination, isLoading: loadingExamination } = useQuery({
    queryKey: queryKeys.doctor.examinationByAppointment(context?.appointment?.id ?? ''),
    queryFn: () => doctorAPI.getExaminationByAppointment(context!.appointment!.id),
    enabled: !!context?.appointment?.id && context.mode === 'create' && open,
  });

  useEffect(() => {
    if (context?.mode === 'update' && context.examination) {
      setForm({
        symptoms: context.examination.symptoms,
        diagnosis: context.examination.diagnosis,
        notes: context.examination.notes,
        treatment: context.examination.treatment,
        totalCost: context.examination.totalCost,
        serviceOrders: context.examination.listDentalServicesEntityOrder ?? [],
        prescriptionOrders: context.examination.listPrescriptionOrder ?? [],
        xrayFiles: [],
        faceFiles: [],
        teethFiles: [],
        removeImageIds: [],
      });
    } else if (context?.mode === 'create') {
      // Nếu đã có examination, tự động chuyển sang mode update
      if (existingExamination) {
        setForm({
          symptoms: existingExamination.symptoms,
          diagnosis: existingExamination.diagnosis,
          notes: existingExamination.notes,
          treatment: existingExamination.treatment,
          totalCost: existingExamination.totalCost,
          serviceOrders: existingExamination.listDentalServicesEntityOrder ?? [],
          prescriptionOrders: existingExamination.listPrescriptionOrder ?? [],
          xrayFiles: [],
          faceFiles: [],
          teethFiles: [],
          removeImageIds: [],
        });
      } else {
        setForm(defaultForm);
      }
    }
  }, [context, existingExamination]);

  if (!context) return null;

  const handleServiceAdd = (service: DentalService) => {
    setForm((prev) => ({
      ...prev,
      serviceOrders: [
        ...prev.serviceOrders,
        {
          name: service.name,
          unit: service.unit,
          unitPrice: service.unitPrice,
          quantity: 1,
          cost: service.unitPrice,
        },
      ],
      totalCost: prev.totalCost + service.unitPrice,
    }));
  };

  const handlePrescriptionAdd = (item: PrescriptionItem) => {
    setForm((prev) => ({
      ...prev,
      prescriptionOrders: [
        ...prev.prescriptionOrders,
        {
          name: item.name,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          notes: item.notes,
          unitPrice: item.unitPrice,
          quantity: 1,
          cost: item.unitPrice,
        },
      ],
      totalCost: prev.totalCost + item.unitPrice,
    }));
  };

  const handleSubmit = () => {
    // Nếu có existingExamination, cập nhật context để có examination
    if (existingExamination && context.mode === 'create') {
      onSubmit(form, { mode: 'update', examination: existingExamination });
    } else {
      onSubmit(form, context);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-0 sm:max-w-3xl">
        <DialogHeader className="space-y-2 border-b border-border/70 px-6 pb-4 pt-6">
          <DialogTitle className="text-xl font-semibold text-foreground">
            {loadingExamination ? (
              'Đang tải...'
            ) : existingExamination ? (
              'Cập nhật kết quả khám'
            ) : context.mode === 'create' ? (
              'Ghi nhận kết quả khám'
            ) : (
              'Cập nhật kết quả khám'
            )}
          </DialogTitle>
          <DialogDescription>
            {loadingExamination ? (
              'Đang kiểm tra kết quả khám hiện có...'
            ) : existingExamination ? (
              `Đã có kết quả khám. Cập nhật lần cuối: ${formatDateTime(existingExamination.createAt)}`
            ) : (
              `Liên kết trực tiếp với lịch hẹn ${
                context.mode === 'create'
                  ? formatDateTime(context.appointment?.dateTime)
                  : formatDateTime(context.examination?.createAt)
              }`
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Triệu chứng</Label>
              <Textarea
                value={form.symptoms}
                onChange={(e) => setForm((prev) => ({ ...prev, symptoms: e.target.value }))}
                placeholder="Ví dụ: Đau nhói vùng răng hàm dưới..."
              />
            </div>
            <div className="space-y-2">
              <Label>Chẩn đoán</Label>
              <Textarea
                value={form.diagnosis}
                onChange={(e) => setForm((prev) => ({ ...prev, diagnosis: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Phác đồ điều trị</Label>
              <Textarea
                value={form.treatment}
                onChange={(e) => setForm((prev) => ({ ...prev, treatment: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-muted/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">Dịch vụ sử dụng</p>
              <Select onValueChange={(value) => {
                const service = services.find((item) => item.id === value);
                if (service) handleServiceAdd(service);
              }}>
                <SelectTrigger className="w-56 text-xs">
                  <SelectValue placeholder="Chọn dịch vụ" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id ?? service.name}>
                      {service.name} · {service.unitPrice.toLocaleString('vi-VN')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="gap-4 md:grid md:grid-cols-3">
            {(['xrayFiles', 'faceFiles', 'teethFiles'] as const).map((field) => (
              <div key={field} className="space-y-2">
                <Label>Ảnh {field === 'xrayFiles' ? 'X-quang' : field === 'faceFiles' ? 'Chính diện' : 'Chi tiết'}</Label>
                <input
                  type="file"
                  multiple
                  className="w-full rounded-2xl border border-dashed border-border px-3 py-2 text-xs"
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []);
                    setForm((prev) => ({ ...prev, [field]: files }));
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 flex flex-wrap gap-3 border-t border-border/70 bg-white px-6 py-4">
          <Button variant="outline" className="flex-1 border-border/70" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            className="flex-1 bg-primary text-white hover:bg-primary/90"
            onClick={handleSubmit}
            disabled={isLoading || loadingExamination}
          >
            {isLoading || loadingExamination ? (
              <Loading size="sm" />
            ) : existingExamination ? (
              'Cập nhật kết quả'
            ) : (
              'Lưu kết quả'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExamDialog;

