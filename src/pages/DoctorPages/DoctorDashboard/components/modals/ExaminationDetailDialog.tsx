import React, { useState } from 'react';
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
import ImageViewer from '@/components/ui/ImageViewer';
import { Image as ImageIcon, FileText, Calendar, MessageSquare, Send } from 'lucide-react';
import type { ExaminationSummary } from '@/types/doctor';
import { formatDate, formatDateTime, formatCurrency } from '../../utils';
import { doctorAPI } from '@/services';
import { useAuth } from '@/hooks';
import { isDoctorLV2 } from '@/utils/auth';
import { showNotification } from '@/components/ui';

interface ExaminationDetailDialogProps {
  open: boolean;
  examination: ExaminationSummary | null;
  costData?: { totalCost: number; status: string };
  onOpenChange: (open: boolean) => void;
  onEdit?: (examination: ExaminationSummary) => void;
}

const ExaminationDetailDialog: React.FC<ExaminationDetailDialogProps> = ({
  open,
  examination,
  costData,
  onOpenChange,
  onEdit,
}) => {
  const { token } = useAuth();
  const isLV2 = isDoctorLV2(token);
  const [comment, setComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [examinationData, setExaminationData] = useState<ExaminationSummary | null>(examination);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Update examination data when prop changes
  React.useEffect(() => {
    setExaminationData(examination);
  }, [examination]);

  if (!examinationData) return null;

  const handleAddComment = async () => {
    if (!comment.trim() || !examinationData) return;
    
    setIsSubmittingComment(true);
    try {
      const updated = await doctorAPI.commentExamination(examinationData.id, comment.trim());
      setExaminationData(updated);
      setComment('');
      showNotification.success('Đã thêm nhận xét thành công');
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
              <DialogTitle className="text-xl font-semibold text-foreground">Chi tiết kết quả khám</DialogTitle>
              <DialogDescription>
                Ngày khám: {examinationData.createAt ? formatDate(examinationData.createAt) : 'Chưa có'}
              </DialogDescription>
            </div>
            {onEdit && examinationData && (
              <Button variant="outline" size="sm" onClick={() => onEdit(examinationData)}>
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
                {examinationData.symptoms || 'Không có'}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Chẩn đoán</h3>
              <p className="rounded-2xl border border-border/70 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary">
                {examinationData.diagnosis || 'Chưa có'}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Phác đồ điều trị</h3>
              <p className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
                {examinationData.treatment || 'Không có'}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Ghi chú</h3>
              <p className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
                {examinationData.notes || 'Không có ghi chú'}
              </p>
            </div>
          </div>

          {examinationData.listDentalServicesEntityOrder && examinationData.listDentalServicesEntityOrder.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Dịch vụ đã sử dụng</h3>
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <div className="space-y-2">
                  {examinationData.listDentalServicesEntityOrder.map((service, index) => (
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

          {examinationData.listPrescriptionOrder && examinationData.listPrescriptionOrder.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Đơn thuốc</h3>
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <div className="space-y-2">
                  {examinationData.listPrescriptionOrder.map((pres, index) => (
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

          {examinationData.listImage && examinationData.listImage.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Hình ảnh</h3>
              <div className="grid gap-3 md:grid-cols-3">
                {examinationData.listImage.map((image) => {
                  // Map type từ database sang label tiếng Việt
                  const getImageTypeLabel = (type: string) => {
                    switch (type) {
                      case 'examinationTeeth':
                        return 'Ảnh răng';
                      case 'examinationFace':
                        return 'Ảnh mặt';
                      case 'examinationXray':
                        return 'Ảnh X-quang';
                      default:
                        return type; // Fallback nếu có type khác
                    }
                  };

                  return (
                    <div
                      key={image.publicId}
                      className="group relative rounded-2xl border border-border/70 bg-muted/30 p-3 transition hover:shadow-medium cursor-pointer"
                      onClick={() => image.url && setSelectedImage(image.url)}
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

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
              <span className="text-sm font-semibold text-muted-foreground">Tổng chi phí</span>
              <span className="text-xl font-semibold text-primary">
                {formatCurrency(examinationData.totalCost)}
              </span>
            </div>
            {costData && (
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span className="text-sm font-semibold text-muted-foreground">Trạng thái thanh toán</span>
                <Badge
                  className={
                    costData.status?.toLowerCase() === 'paid' || costData.status?.toLowerCase() === 'done'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-amber-100 text-amber-700 border-amber-200'
                  }
                >
                  {costData.status?.toLowerCase() === 'paid' || costData.status?.toLowerCase() === 'done'
                    ? 'Đã thanh toán'
                    : 'Chưa thanh toán'}
                </Badge>
              </div>
            )}
          </div>

          {/* Comments Section - Only for Doctor LV2 */}
          {isLV2 && (
            <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground">Nhận xét (Doctor LV2)</h3>
              </div>
              
              {/* Existing Comments */}
              {examinationData.listComment && examinationData.listComment.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {examinationData.listComment.map((commentText, index) => (
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
          {!isLV2 && examinationData.listComment && examinationData.listComment.length > 0 && (
            <div className="space-y-2 rounded-2xl border border-border/70 bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground">Nhận xét từ Doctor LV2</h3>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {examinationData.listComment.map((commentText, index) => (
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
      <ImageViewer
        open={!!selectedImage}
        imageUrl={selectedImage}
        alt="Examination image"
        onClose={() => setSelectedImage(null)}
      />
    </Dialog>
  );
};

export default ExaminationDetailDialog;

