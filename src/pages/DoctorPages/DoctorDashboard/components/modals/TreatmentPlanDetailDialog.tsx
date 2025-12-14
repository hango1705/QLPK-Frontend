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
import { Calendar, DollarSign, User, Stethoscope, FileText, Clock, CheckCircle2, XCircle, Pause, AlertCircle, Heart, Edit } from 'lucide-react';
import type { TreatmentPlan, TreatmentPhase } from '@/types/doctor';
import { formatDate, formatCurrency } from '../../utils';
import { STATUS_BADGE } from '../../constants';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

interface TreatmentPlanDetailDialogProps {
  open: boolean;
  plan: TreatmentPlan | null;
  phases: TreatmentPhase[];
  onOpenChange: (open: boolean) => void;
  onEdit?: (plan: TreatmentPlan) => void;
  onCreatePhase?: (plan: TreatmentPlan) => void;
  onEditPhase?: (plan: TreatmentPlan, phase: TreatmentPhase) => void;
}

const TreatmentPlanDetailDialog: React.FC<TreatmentPlanDetailDialogProps> = ({
  open,
  plan,
  phases,
  onOpenChange,
  onEdit,
  onCreatePhase,
  onEditPhase,
}) => {
  if (!plan) return null;

  const sortedPhases = [...phases].sort((a, b) => {
    const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
    const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
    return dateA - dateB;
  });

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'done':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      case 'inprogress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status || 'Inprogress';
    const badgeClassName = STATUS_BADGE[normalizedStatus] || STATUS_BADGE.Inprogress;
    return (
      <Badge className={badgeClassName}>
        {normalizedStatus}
      </Badge>
    );
  };

  const totalPhases = phases.length;
  const completedPhases = phases.filter(p => p.status?.toLowerCase() === 'done').length;
  const inProgressPhases = phases.filter(p => p.status?.toLowerCase() === 'inprogress').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-0 sm:max-w-4xl">
        <DialogHeader className="space-y-2 border-b border-border/70 px-6 pb-4 pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <DialogTitle className="text-xl font-semibold text-foreground">{plan.title}</DialogTitle>
                {getStatusBadge(plan.status)}
              </div>
              <DialogDescription className="text-sm text-muted-foreground">
                {plan.description || 'Không có mô tả'}
              </DialogDescription>
            </div>
            <PermissionGuard permission="UPDATE_TREATMENT_PLANS">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(plan)} className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Chỉnh sửa
                </Button>
              )}
            </PermissionGuard>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 space-y-6">
          {/* Thông tin tổng quan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Thông tin cơ bản
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ngày tạo:</span>
                  <span className="font-medium">{plan.createAt ? formatDate(plan.createAt) : 'Chưa có'}</span>
                </div>
                {plan.duration && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Thời gian điều trị:</span>
                    <span className="font-medium">{plan.duration}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tổng chi phí:</span>
                  <span className="font-semibold text-primary">{formatCurrency(plan.totalCost)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Thông tin liên quan
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Stethoscope className="h-3 w-3" />
                    Bác sĩ:
                  </span>
                  <span className="font-medium">{plan.doctorFullname || 'Chưa xác định'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Bệnh nhân:
                  </span>
                  <span className="font-medium">{plan.patientName || 'Chưa xác định'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    Y tá:
                  </span>
                  <span className="font-medium">{plan.nurseFullname || 'Chưa xác định'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Thống kê tiến trình */}
          <div className="bg-muted/50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tổng quan tiến trình
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{totalPhases}</div>
                <div className="text-xs text-muted-foreground mt-1">Tổng giai đoạn</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{inProgressPhases}</div>
                <div className="text-xs text-muted-foreground mt-1">Đang điều trị</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedPhases}</div>
                <div className="text-xs text-muted-foreground mt-1">Hoàn thành</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{formatCurrency(plan.totalCost)}</div>
                <div className="text-xs text-muted-foreground mt-1">Tổng chi phí</div>
              </div>
            </div>
          </div>

          {/* Ghi chú */}
          {plan.notes && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Ghi chú
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{plan.notes}</p>
            </div>
          )}

          {/* Danh sách các giai đoạn */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Danh sách giai đoạn ({sortedPhases.length})
              </h3>
              {onCreatePhase && (
                <Button variant="outline" size="sm" onClick={() => onCreatePhase(plan)}>
                  + Thêm giai đoạn
                </Button>
              )}
            </div>

            {sortedPhases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chưa có giai đoạn nào</p>
                {onCreatePhase && (
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => onCreatePhase(plan)}>
                    + Thêm giai đoạn đầu tiên
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {sortedPhases.map((phase, index) => (
                  <div
                    key={phase.id}
                    className="border border-border/70 rounded-xl p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => onEditPhase?.(plan, phase)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                            Phase {index + 1}
                          </span>
                          {getStatusBadge(phase.status || 'Inprogress')}
                        </div>
                        <h4 className="font-medium text-foreground mb-1">Giai đoạn điều trị</h4>
                        {phase.description && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{phase.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          {phase.startDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(phase.startDate)}</span>
                            </div>
                          )}
                          {phase.cost > 0 && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              <span className="font-medium text-primary">{formatCurrency(phase.cost)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {getStatusIcon(phase.status || 'Inprogress')}
                        {onEditPhase && (
                          <Button variant="ghost" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            onEditPhase(plan, phase);
                          }}>
                            Xem chi tiết
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TreatmentPlanDetailDialog;

