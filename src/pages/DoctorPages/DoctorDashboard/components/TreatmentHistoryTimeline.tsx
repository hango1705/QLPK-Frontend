import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button } from '@/components/ui';
import { Clock, CheckCircle2, Hourglass, Activity, FileText, User, Plus } from 'lucide-react';
import { formatDate, formatDateTime } from '../utils';
import type { TreatmentPlan, TreatmentPhase } from '@/types/doctor';

interface TreatmentHistoryTimelineProps {
  treatmentPlans: TreatmentPlan[];
  phasesByPlan: Record<string, TreatmentPhase[]>;
  onPhaseClick?: (planId: string, phaseId: string) => void;
  onAddPhase?: () => void;
  onCreatePlan?: () => void;
  onViewPlanDetail?: (plan: TreatmentPlan) => void;
}

const TreatmentHistoryTimeline: React.FC<TreatmentHistoryTimelineProps> = ({ 
  treatmentPlans, 
  phasesByPlan, 
  onPhaseClick, 
  onAddPhase,
  onCreatePlan,
  onViewPlanDetail,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <Activity className="h-5 w-5 text-blue-600" />;
      case 'pending':
        return <Hourglass className="h-5 w-5 text-amber-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-50 text-green-600 border-green-100';
      case 'in-progress':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'pending':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return 'Chưa xác định';
    const s = status.toLowerCase();
    if (s.includes('done') || s.includes('hoàn')) return 'Hoàn thành';
    if (s.includes('inprogress') || s.includes('đang')) return 'Đang điều trị';
    if (s.includes('paused')) return 'Tạm dừng';
    if (s.includes('cancelled') || s.includes('hủy')) return 'Đã hủy';
    return 'Đang điều trị';
  };

  const getStatusFromPlan = (plan: TreatmentPlan): 'done' | 'pending' | 'in-progress' => {
    const status = plan.status?.toLowerCase() || '';
    if (status.includes('done') || status.includes('hoàn')) return 'done';
    if (status.includes('paused') || status.includes('cancelled')) return 'pending';
    return 'in-progress';
  };

  const getPlanDate = (plan: TreatmentPlan): string => {
    // Try to get date from first phase
    const phases = phasesByPlan[plan.id] || [];
    if (phases.length > 0) {
      const sortedPhases = phases
        .filter(p => p.startDate)
        .sort((p1, p2) => {
          const date1 = new Date(p1.startDate || 0).getTime();
          const date2 = new Date(p2.startDate || 0).getTime();
          return date1 - date2; // Oldest first
        });
      if (sortedPhases.length > 0) {
        return sortedPhases[0].startDate || '';
      }
    }
    // Fallback to createAt
    return plan.createAt || '';
  };


  if (treatmentPlans.length === 0) {
    return (
      <Card className="border-none bg-white/90 shadow-medium rounded-2xl h-full">
        <CardHeader>
          <CardTitle className="text-lg">Lịch sử phác đồ</CardTitle>
          <CardDescription>Timeline các phác đồ điều trị của bệnh nhân</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">Chưa có phác đồ điều trị</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none bg-white/90 shadow-medium rounded-2xl h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg">Lịch sử phác đồ</CardTitle>
          <CardDescription>Timeline các phác đồ điều trị của bệnh nhân</CardDescription>
        </div>
        {onCreatePlan && (
          <Button
            size="sm"
            variant="outline"
            onClick={onCreatePlan}
            className="border-primary/40 text-primary hover:bg-primary/10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm phác đồ
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className="relative h-full overflow-y-auto pr-2">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200" />

          {/* Timeline items */}
          <div className="space-y-6 pb-4">
            {treatmentPlans.map((plan) => {
              const planDate = getPlanDate(plan);
              const status = getStatusFromPlan(plan);
              const phases = phasesByPlan[plan.id] || [];
              
              return (
                <div key={plan.id} className="relative flex gap-4">
                  {/* Icon */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border-2 border-blue-500 shadow-md">
                      {getStatusIcon(status)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div 
                      className={`rounded-xl border border-border/70 bg-white p-4 shadow-sm transition-shadow ${
                        onViewPlanDetail ? 'hover:shadow-md cursor-pointer hover:border-primary/50' : ''
                      }`}
                      onClick={() => onViewPlanDetail?.(plan)}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-primary">
                              {formatDate(planDate) || 'Chưa có ngày'}
                            </span>
                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200">
                              Phác đồ
                            </Badge>
                          </div>
                        </div>
                        <Badge className={`text-xs ${getStatusBadge(status)}`}>
                          {getStatusLabel(plan.status)}
                        </Badge>
                      </div>

                      {/* Title */}
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Tên phác đồ
                        </p>
                        <p className="text-sm font-medium text-foreground">{plan.title || 'Không có tiêu đề'}</p>
                      </div>

                      {/* Description */}
                      {plan.description && (
                        <div className="mb-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            Mô tả
                          </p>
                          <p className="text-sm text-foreground">{plan.description}</p>
                        </div>
                      )}

                      {/* Dentist */}
                      {plan.doctorFullname && (
                        <div className="mb-2 flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Bác sĩ:</span> {plan.doctorFullname}
                          </p>
                        </div>
                      )}

                      {/* Phases count */}
                      {phases.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Số giai đoạn:</span> {phases.length}
                          </p>
                        </div>
                      )}

                      {/* Notes */}
                      {plan.notes && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="flex items-start gap-2">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                Ghi chú
                              </p>
                              <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                                {plan.notes}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TreatmentHistoryTimeline;

