import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Badge,
  Button,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { Image as ImageIcon, MessageSquare, Send, Calendar, DollarSign, FileText, GitCompare } from 'lucide-react';
import type { TreatmentPhase, TreatmentPlan } from '@/types/doctor';
import { formatDate, formatCurrency } from '../../utils';
import { doctorAPI } from '@/services';
import { useAuth } from '@/hooks';
import { isDoctorLV2 } from '@/utils/auth';
import { showNotification } from '@/components/ui';
import ImageViewer from '@/components/ui/ImageViewer';

interface TreatmentPhaseDetailDialogProps {
  open: boolean;
  phase: TreatmentPhase | null;
  plan: TreatmentPlan | null;
  allPhases?: TreatmentPhase[]; // All phases of the same plan for comparison
  onOpenChange: (open: boolean) => void;
  onEdit?: (phase: TreatmentPhase, plan: TreatmentPlan) => void;
  onRefresh?: () => void;
}

const TreatmentPhaseDetailDialog: React.FC<TreatmentPhaseDetailDialogProps> = ({
  open,
  phase,
  plan,
  allPhases = [],
  onOpenChange,
  onEdit,
  onRefresh,
}) => {
  const { token } = useAuth();
  const isLV2 = isDoctorLV2(token);
  const [comment, setComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [phaseData, setPhaseData] = useState<TreatmentPhase | null>(phase);
  const [selectedComparePhaseId, setSelectedComparePhaseId] = useState<string | null>(null);
  const [compareKey, setCompareKey] = useState(0); // Force re-render key
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Update phase data when prop changes
  useEffect(() => {
    setPhaseData(phase);
    setSelectedComparePhaseId(null); // Reset comparison when phase changes
  }, [phase]);

  // Get other phases for comparison (all phases except current one, sorted by phaseNumber or startDate)
  const otherPhases = useMemo(() => {
    if (!phaseData || !allPhases.length) {
      console.log('TreatmentPhaseDetailDialog: No phases for comparison', { phaseData: !!phaseData, allPhasesLength: allPhases.length });
      return [];
    }
    
    const filtered = allPhases.filter((p) => p.id !== phaseData.id); // Exclude current phase
    console.log('TreatmentPhaseDetailDialog: Filtered phases for comparison', { 
      totalPhases: allPhases.length, 
      currentPhaseId: phaseData.id,
      filteredCount: filtered.length,
      filteredPhases: filtered.map(p => ({ id: p.id, phaseNumber: p.phaseNumber }))
    });
    
    return filtered.sort((a, b) => {
      // Sort by phaseNumber if available (descending - newest first)
      if (a.phaseNumber && b.phaseNumber) {
        const aNum = parseInt(a.phaseNumber, 10);
        const bNum = parseInt(b.phaseNumber, 10);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return bNum - aNum;
        }
      }
      // Otherwise sort by startDate (newest first)
      if (a.startDate && b.startDate) {
        const aDate = new Date(a.startDate).getTime();
        const bDate = new Date(b.startDate).getTime();
        if (!isNaN(aDate) && !isNaN(bDate)) {
          return bDate - aDate;
        }
      }
      return 0;
    });
  }, [phaseData, allPhases]);

  // Get selected phase for comparison
  const comparePhase = useMemo(() => {
    if (!selectedComparePhaseId) return null;
    // Try to find in otherPhases first, then fallback to allPhases
    const found = otherPhases.find((p) => p.id === selectedComparePhaseId) 
      || allPhases.find((p) => p.id === selectedComparePhaseId);
    console.log('TreatmentPhaseDetailDialog: comparePhase', { 
      selectedComparePhaseId, 
      found: !!found,
      foundPhaseNumber: found?.phaseNumber,
      foundImagesCount: found?.listImage?.length || 0,
      otherPhasesCount: otherPhases.length,
      allPhasesCount: allPhases.length
    });
    return found || null;
  }, [selectedComparePhaseId, otherPhases, allPhases]);

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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Hình ảnh
                </h3>
                {otherPhases.length > 0 && (
                  <div className="flex items-center gap-2">
                    <GitCompare className="h-4 w-4 text-muted-foreground" />
                    <Select
                      key={`select-compare-${compareKey}`}
                      value={selectedComparePhaseId || undefined}
                      onValueChange={(value) => {
                        setSelectedComparePhaseId(value || null);
                        setCompareKey(prev => prev + 1); // Force re-render
                      }}
                    >
                      <SelectTrigger className="w-[220px] h-8 text-xs">
                        <SelectValue placeholder="So sánh với tiến trình khác" />
                      </SelectTrigger>
                      <SelectContent>
                        {otherPhases.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            Giai đoạn {p.phaseNumber || 'N/A'}
                            {p.startDate && ` (${formatDate(p.startDate)})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedComparePhaseId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedComparePhaseId(null);
                          setCompareKey(prev => prev + 1); // Force re-render to reset Select
                        }}
                        className="h-8 text-xs"
                      >
                        Hủy
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Group images by type for comparison */}
              {(() => {
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
                      return type;
                  }
                };

                const getImageTypeKey = (type: string) => {
                  if (type?.includes('Teeth')) return 'teeth';
                  if (type?.includes('Face')) return 'face';
                  if (type?.includes('Xray')) return 'xray';
                  return 'other';
                };

                // Group current phase images by type
                const currentImagesByType = (phaseData.listImage || []).reduce((acc, img) => {
                  const key = getImageTypeKey(img.type || '');
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(img);
                  return acc;
                }, {} as Record<string, typeof phaseData.listImage>);

                // Group compare phase images by type
                const compareImagesByType = (comparePhase?.listImage || []).reduce((acc, img) => {
                  const key = getImageTypeKey(img.type || '');
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(img);
                  return acc;
                }, {} as Record<string, typeof comparePhase.listImage>) || {};

                // Get all unique types
                const allTypes = new Set([
                  ...Object.keys(currentImagesByType),
                  ...Object.keys(compareImagesByType),
                ]);

                return (
                  <div key={`images-${selectedComparePhaseId || 'none'}-${compareKey}`} className="space-y-4">
                    {Array.from(allTypes).map((typeKey) => {
                      const currentImages = currentImagesByType[typeKey] || [];
                      const compareImages = compareImagesByType[typeKey] || [];
                      const typeLabel = currentImages[0]?.type 
                        ? getImageTypeLabel(currentImages[0].type) 
                        : compareImages[0]?.type 
                        ? getImageTypeLabel(compareImages[0].type)
                        : 'Hình ảnh';

                      return (
                        <div key={`${typeKey}-${selectedComparePhaseId || 'none'}`} className="space-y-2">
                          {!comparePhase && (
                            <h4 className="text-xs font-medium text-muted-foreground">{typeLabel}</h4>
                          )}
                          {comparePhase ? (
                            // Comparison view: side by side
                            <div className="grid grid-cols-2 gap-3">
                              {/* Current Phase */}
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-primary">
                                  Giai đoạn {phaseData.phaseNumber} (Hiện tại)
                                </div>
                                <div className="grid gap-2">
                                  {currentImages.length > 0 ? (
                                    currentImages.map((image) => (
                                      <div
                                        key={image.publicId}
                                        className="group relative rounded-xl border border-primary/30 bg-primary/5 p-2 transition hover:shadow-md cursor-pointer"
                                        onClick={() => image.url && setSelectedImage(image.url)}
                                      >
                                        {image.url && (
                                          <img
                                            src={image.url}
                                            alt={typeLabel}
                                            className="h-40 w-full rounded-lg object-cover"
                                            loading="lazy"
                                          />
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/20 text-xs text-muted-foreground">
                                      Không có hình ảnh
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Compare Phase */}
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-blue-600">
                                  Giai đoạn {comparePhase.phaseNumber} (Trước đó)
                                </div>
                                <div className="grid gap-2">
                                  {compareImages.length > 0 ? (
                                    compareImages.map((image) => (
                                      <div
                                        key={image.publicId}
                                        className="group relative rounded-xl border border-blue-300 bg-blue-50/50 p-2 transition hover:shadow-md cursor-pointer"
                                        onClick={() => image.url && setSelectedImage(image.url)}
                                      >
                                        {image.url && (
                                          <img
                                            src={image.url}
                                            alt={typeLabel}
                                            className="h-40 w-full rounded-lg object-cover"
                                            loading="lazy"
                                          />
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/20 text-xs text-muted-foreground">
                                      Không có hình ảnh
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            // Normal view: grid
                            <div className="grid gap-3 md:grid-cols-3">
                              {currentImages.map((image) => (
                                <div
                                  key={image.publicId}
                                  className="group relative rounded-2xl border border-border/70 bg-muted/30 p-3 transition hover:shadow-medium cursor-pointer"
                                  onClick={() => image.url && setSelectedImage(image.url)}
                                >
                                  {image.url && (
                                    <img
                                      src={image.url}
                                      alt={typeLabel}
                                      className="h-32 w-full rounded-xl object-cover"
                                      loading="lazy"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
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
      <ImageViewer
        open={!!selectedImage}
        imageUrl={selectedImage}
        alt="Treatment phase image"
        onClose={() => setSelectedImage(null)}
      />
    </Dialog>
  );
};

export default TreatmentPhaseDetailDialog;

