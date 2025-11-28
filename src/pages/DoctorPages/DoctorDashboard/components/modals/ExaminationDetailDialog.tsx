import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Badge,
  Button,
} from '@/components/ui';
import { Image as ImageIcon, FileText, Calendar } from 'lucide-react';
import type { ExaminationSummary } from '@/types/doctor';
import { formatDate, formatDateTime, formatCurrency } from '../../utils';

interface ExaminationDetailDialogProps {
  open: boolean;
  examination: ExaminationSummary | null;
  onOpenChange: (open: boolean) => void;
  onEdit?: (examination: ExaminationSummary) => void;
}

const ExaminationDetailDialog: React.FC<ExaminationDetailDialogProps> = ({
  open,
  examination,
  onOpenChange,
  onEdit,
}) => {
  if (!examination) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-0 sm:max-w-3xl">
        <DialogHeader className="space-y-2 border-b border-border/70 px-6 pb-4 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-foreground">Chi tiết kết quả khám</DialogTitle>
              <DialogDescription>
                Ngày khám: {formatDate(examination.createAt)}
              </DialogDescription>
            </div>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(examination)}>
                Chỉnh sửa
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Triệu chứng</h3>
              <p className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
                {examination.symptoms || 'Không có'}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Chẩn đoán</h3>
              <p className="rounded-2xl border border-border/70 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary">
                {examination.diagnosis || 'Chưa có'}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Phác đồ điều trị</h3>
              <p className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
                {examination.treatment || 'Không có'}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Ghi chú</h3>
              <p className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
                {examination.notes || 'Không có ghi chú'}
              </p>
            </div>
          </div>

          {examination.listDentalServicesEntityOrder && examination.listDentalServicesEntityOrder.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Dịch vụ đã sử dụng</h3>
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <div className="space-y-2">
                  {examination.listDentalServicesEntityOrder.map((service, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-white px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{service.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {service.quantity} {service.unit} × {formatCurrency(service.unitPrice)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {formatCurrency(service.cost ?? service.unitPrice * service.quantity)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {examination.listPrescriptionOrder && examination.listPrescriptionOrder.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Đơn thuốc</h3>
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <div className="space-y-2">
                  {examination.listPrescriptionOrder.map((pres, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-white px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{pres.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {pres.dosage} · {pres.frequency} · {pres.duration}
                        </p>
                        {pres.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{pres.notes}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="border-secondary/40 text-secondary">
                        {pres.quantity} viên
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {examination.listImage && examination.listImage.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Hình ảnh</h3>
              <div className="grid gap-3 md:grid-cols-3">
                {examination.listImage.map((image) => (
                  <div
                    key={image.publicId}
                    className="group relative rounded-2xl border border-border/70 bg-muted/30 p-3 transition hover:shadow-medium"
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ImageIcon className="h-4 w-4" />
                      <span className="capitalize">{image.type}</span>
                    </div>
                    {image.url && (
                      <img
                        src={image.url}
                        alt={image.type}
                        className="mt-2 h-32 w-full rounded-xl object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
            <span className="text-sm font-semibold text-muted-foreground">Tổng chi phí</span>
            <span className="text-xl font-semibold text-primary">
              {formatCurrency(examination.totalCost)}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExaminationDetailDialog;

