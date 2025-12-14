import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Badge,
  Button,
  Textarea,
} from '@/components/ui';
import { Image as ImageIcon, MessageSquare, Send, Calendar, DollarSign, FileText } from 'lucide-react';
import type { TreatmentPhase, TreatmentPlan } from '@/types/doctor';
import { formatDate, formatCurrency } from '../../utils';
import { doctorAPI } from '@/services';
import { useAuth } from '@/hooks';
import { isDoctorLV2 } from '@/utils/auth';
import { showNotification } from '@/components/ui';

interface TreatmentPhaseDetailDialogProps {
  open: boolean;
  phase: TreatmentPhase | null;
  plan: TreatmentPlan | null;
  onOpenChange: (open: boolean) => void;
  onEdit?: (phase: TreatmentPhase, plan: TreatmentPlan) => void;
  onRefresh?: () => void;
}

const TreatmentPhaseDetailDialog: React.FC<TreatmentPhaseDetailDialogProps> = ({
  open,
  phase,
  plan,
  onOpenChange,
  onEdit,
  onRefresh,
}) => {
  const { token } = useAuth();
  const isLV2 = isDoctorLV2(token);
  const [comment, setComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [phaseData, setPhaseData] = useState<TreatmentPhase | null>(phase);

  // Update phase data when prop changes
  useEffect(() => {
    setPhaseData(phase);
  }, [phase]);

  if (!phaseData || !plan) return null;

  const handleAddComment = async () => {
    if (!comment.trim() || !phaseData) return;
    
    setIsSubmittingComment(true);
    try {
      const updated = await doctorAPI.commentTreatmentPhase(phaseData.id, comment.trim());
      setPhaseData(updated);
      setComment('');
      showNotification.success('Đã thêm nhận xét thành công');
      // Refresh parent data if callback provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      showNotification.error('Không thể thêm nhận xét', error?.message || 'Đã xảy ra lỗi');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-0 sm:max-w-3xl">
        <DialogHeader className="space-y-2 border-b border-border/70 px-6 pb-4 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-foreground">
                Chi tiết tiến trình điều trị
              </DialogTitle>
              <DialogDescription>
                {plan.title} - Giai đoạn {phaseData.phaseNumber}
              </DialogDescription>
            </div>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(phaseData, plan)}>
                Chỉnh sửa
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 px-6 py-6">
          {/* Phase Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Giai đoạn</h3>
              <p className="rounded-2xl border border-border/70 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary">
                Giai đoạn {phaseData.phaseNumber}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Trạng thái</h3>
              <Badge variant="outline" className="w-fit">
                {phaseData.status || 'Chưa xác định'}
              </Badge>
            </div>
          </div>

          {/* Dates */}
          <div className="grid gap-4 md:grid-cols-2">
            {phaseData.startDate && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ngày bắt đầu
                </h3>
                <p className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
                  {formatDate(phaseData.startDate)}
                </p>
              </div>
            )}
            {phaseData.endDate && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ngày kết thúc
                </h3>
                <p className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
                  {formatDate(phaseData.endDate)}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          {phaseData.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Mô tả</h3>
              <p className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm whitespace-pre-wrap">
                {phaseData.description}
              </p>
            </div>
          )}

          {/* Next Appointment */}
          {phaseData.nextAppointment && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Lịch tái khám</h3>
              <p className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
                {formatDate(phaseData.nextAppointment)}
              </p>
            </div>
          )}

          {/* Services */}
          {phaseData.listDentalServicesEntityOrder && phaseData.listDentalServicesEntityOrder.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Dịch vụ đã sử dụng</h3>
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <div className="space-y-2">
                  {phaseData.listDentalServicesEntityOrder.map((service, index) => (
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

          {/* Prescriptions */}
          {phaseData.listPrescriptionOrder && phaseData.listPrescriptionOrder.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Đơn thuốc</h3>
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <div className="space-y-2">
                  {phaseData.listPrescriptionOrder.map((pres, index) => (
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

          {/* Images */}
          {phaseData.listImage && phaseData.listImage.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Hình ảnh</h3>
              <div className="grid gap-3 md:grid-cols-3">
                {phaseData.listImage.map((image) => {
                  // Map type từ database sang label tiếng Việt
                  const getImageTypeLabel = (type: string) => {
                    switch (type) {
                      case 'treatmentPhasesTeeth':
                      case 'examinationTeeth':
                        return 'Ảnh răng';
                      case 'treatmentPhasesFace':
                      case 'examinationFace':
                        return 'Ảnh mặt';
                      case 'treatmentPhasesXray':
                      case 'examinationXray':
                        return 'Ảnh X-quang';
                      default:
                        return type; // Fallback nếu có type khác
                    }
                  };

                  return (
                    <div
                      key={image.publicId}
                      className="group relative rounded-2xl border border-border/70 bg-muted/30 p-3 transition hover:shadow-medium"
                    >
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                        <span>{getImageTypeLabel(image.type || '')}</span>
                      </div>
                      {image.url && (
                        <img
                          src={image.url}
                          alt={getImageTypeLabel(image.type || '')}
                          className="mt-2 h-32 w-full rounded-xl object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cost */}
          <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
            <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Chi phí
            </span>
            <span className="text-xl font-semibold text-primary">
              {formatCurrency(phaseData.cost)}
            </span>
          </div>

          {/* Comments Section - Only for Doctor LV2 */}
          {isLV2 && (
            <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground">Nhận xét (Doctor LV2)</h3>
              </div>
              
              {/* Existing Comments */}
              {phaseData.listComment && phaseData.listComment.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {phaseData.listComment.map((commentText, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-border/60 bg-white px-3 py-2 text-sm"
                    >
                      <p className="text-foreground whitespace-pre-wrap">{commentText}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Form */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Thêm nhận xét..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[80px] resize-none"
                  disabled={isSubmittingComment}
                />
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!comment.trim() || isSubmittingComment}
                  className="w-full"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isSubmittingComment ? 'Đang gửi...' : 'Gửi nhận xét'}
                </Button>
              </div>
            </div>
          )}

          {/* Display comments for non-LV2 doctors (read-only) */}
          {!isLV2 && phaseData.listComment && phaseData.listComment.length > 0 && (
            <div className="space-y-2 rounded-2xl border border-border/70 bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground">Nhận xét từ Doctor LV2</h3>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {phaseData.listComment.map((commentText, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-border/60 bg-white px-3 py-2 text-sm"
                  >
                    <p className="text-foreground whitespace-pre-wrap">{commentText}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TreatmentPhaseDetailDialog;

