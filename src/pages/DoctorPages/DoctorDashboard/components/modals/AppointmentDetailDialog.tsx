import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Badge,
} from '@/components/ui';
import { Calendar, Clock, User, FileText, Bell, CheckCircle2, Stethoscope, Plus, Activity } from 'lucide-react';
import type { AppointmentSummary, TreatmentPlan } from '@/types/doctor';
import { formatDateTime } from '../../utils';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { nurseAPI } from '@/services';
import { queryKeys } from '@/services/queryClient';
import { showNotification } from '@/components/ui';
import { usePermission } from '@/hooks';

interface AppointmentDetailDialogProps {
  open: boolean;
  appointment: AppointmentSummary | null;
  onOpenChange: (open: boolean) => void;
  onCreateExam?: (appointment: AppointmentSummary) => void;
  onCreatePhase?: (plan: TreatmentPlan) => void;
  treatmentPlans?: TreatmentPlan[];
}

const AppointmentDetailDialog: React.FC<AppointmentDetailDialogProps> = ({
  open,
  appointment,
  onOpenChange,
  onCreateExam,
  onCreatePhase,
  treatmentPlans = [],
}) => {
  const { hasPermission } = usePermission();
  const canNotificationAppointment = hasPermission('NOTIFICATION_APPOINMENT');
  const canCreateExamination = hasPermission('CREATE_EXAMINATION');
  const canCreateTreatmentPhase = hasPermission('CREATE_TREATMENT_PHASES');
  const queryClient = useQueryClient();

  // Fetch patient info if patientId exists
  const { data: patientInfo } = useQuery({
    queryKey: queryKeys.nurse.patient(appointment?.patientId || ''),
    queryFn: () => nurseAPI.getPatientById(appointment!.patientId!),
    enabled: open && !!appointment?.patientId,
  });

  // Fetch doctor info if doctorId exists but doctorFullName doesn't
  const { data: doctorInfo } = useQuery({
    queryKey: queryKeys.nurse.doctor(appointment?.doctorId || ''),
    queryFn: () => nurseAPI.getDoctorById(appointment!.doctorId!),
    enabled: open && !!appointment?.doctorId && !appointment?.doctorFullName,
  });

  // Mutation for updating appointment notification
  const updateNotificationMutation = useMutation({
    mutationFn: (appointmentId: string) => nurseAPI.updateAppointmentNotification(appointmentId),
    onSuccess: () => {
      // Invalidate appointments queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.doctor.appointments('all') });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctor.appointments('scheduled') });
      showNotification.success('Đã cập nhật trạng thái thông báo thành công');
      // Update local appointment data
      if (appointment) {
        (appointment as any).notification = 'Done';
      }
    },
    onError: (error: any) => {
      showNotification.error(
        'Không thể cập nhật trạng thái thông báo',
        error?.response?.data?.message || error?.message || 'Đã xảy ra lỗi'
      );
    },
  });

  if (!appointment) return null;

  // Function to localize status
  const getStatusLabel = (status?: string): string => {
    if (!status) return 'N/A';
    const s = status.toLowerCase();
    if (s.includes('done') || s.includes('completed')) return 'Hoàn thành';
    if (s.includes('scheduled')) return 'Đã lên lịch';
    if (s.includes('cancel') || s.includes('cancelled')) return 'Đã hủy';
    if (s.includes('in-progress') || s.includes('progress')) return 'Đang điều trị';
    return status; // Return original if no match
  };

  const isNotificationDone = appointment.notification === 'Done';
  const isScheduled = appointment.status?.toLowerCase() === 'scheduled';
  const isTreatmentPhase = appointment.type?.toLowerCase().includes('treatmentphase') || 
                           appointment.type?.toLowerCase() === 'treatmentphases';

  // Find treatment plan from appointment's patientId
  const findTreatmentPlan = (): TreatmentPlan | null => {
    if (!appointment.patientId || treatmentPlans.length === 0) {
      return null;
    }
    // Find plan by patientId
    const plan = treatmentPlans.find((p) => (p as any).patientId === appointment.patientId);
    return plan || null;
  };

  const handleUpdateNotification = () => {
    if (isNotificationDone) {
      showNotification.warning('Lịch hẹn này đã được thông báo');
      return;
    }
    updateNotificationMutation.mutate(appointment.id);
  };

  const handleCreateExam = () => {
    if (onCreateExam) {
      onCreateExam(appointment);
      onOpenChange(false); // Close appointment detail dialog
    }
  };

  const handleCreatePhase = () => {
    const plan = findTreatmentPlan();
    if (onCreatePhase && plan) {
      onCreatePhase(plan);
      onOpenChange(false); // Close appointment detail dialog
    } else {
      showNotification.warning('Không tìm thấy phác đồ điều trị cho lịch hẹn này');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Chi tiết lịch hẹn</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Thông tin cơ bản
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem
                icon={<Calendar className="h-4 w-4" />}
                label="Thời gian"
                value={formatDateTime(appointment.dateTime)}
              />
              <InfoItem
                icon={<Clock className="h-4 w-4" />}
                label="Loại lịch hẹn"
                value={appointment.type}
              />
              <InfoItem
                icon={<Activity className="h-4 w-4" />}
                label="Trạng thái"
                value={
                  <Badge className={getStatusBadge(appointment.status)}>
                    {getStatusLabel(appointment.status)}
                  </Badge>
                }
              />
              {(appointment.doctorFullName || appointment.doctorId || doctorInfo) && (
                <InfoItem
                  icon={<Stethoscope className="h-4 w-4" />}
                  label="Bác sĩ"
                  value={
                    doctorInfo 
                      ? doctorInfo.fullName 
                      : appointment.doctorFullName 
                        ? appointment.doctorFullName 
                        : 'Đang tải...'
                  }
                />
              )}
              {(patientInfo || appointment.patientId) && (
                <InfoItem
                  icon={<User className="h-4 w-4" />}
                  label="Bệnh nhân"
                  value={patientInfo ? patientInfo.fullName : 'Đang tải...'}
                />
              )}
            </div>
            {appointment.notes && (
              <div className="mt-4">
                <p className="text-sm font-medium text-foreground mb-2">Ghi chú:</p>
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  {appointment.notes}
                </p>
              </div>
            )}
          </div>

          {/* Notification Status */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Trạng thái thông báo
            </h3>
            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                {isNotificationDone ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Bell className="h-5 w-5 text-amber-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">Thông báo:</p>
                  <p className="text-sm text-muted-foreground">
                    {isNotificationDone ? 'Đã thông báo' : 'Chưa thông báo'}
                  </p>
                </div>
              </div>
              {canNotificationAppointment && (
                <PermissionGuard permission="NOTIFICATION_APPOINMENT">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleUpdateNotification}
                    disabled={updateNotificationMutation.isPending || isNotificationDone}
                  >
                    {updateNotificationMutation.isPending
                      ? 'Đang xử lý...'
                      : 'Cập nhật trạng thái'}
                  </Button>
                </PermissionGuard>
              )}
            </div>
          </div>

          {/* Services */}
          {appointment.listDentalServicesEntity && appointment.listDentalServicesEntity.length > 0 && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-foreground">Dịch vụ</h3>
              <div className="space-y-2">
                {appointment.listDentalServicesEntity.map((service, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-border/70 bg-white/60 p-3"
                  >
                    <span className="text-sm text-foreground">{service.name || service.serviceName}</span>
                    {service.price && (
                      <span className="text-sm font-medium text-primary">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(service.price)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isScheduled && (
            <div className="border-t pt-4">
              {isTreatmentPhase && canCreateTreatmentPhase && onCreatePhase && (
                <PermissionGuard permission="CREATE_TREATMENT_PHASES">
                  <Button
                    className="w-full bg-primary text-white hover:bg-primary/90"
                    onClick={handleCreatePhase}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ghi nhận tiến trình
                  </Button>
                </PermissionGuard>
              )}
              {!isTreatmentPhase && canCreateExamination && onCreateExam && (
                <PermissionGuard permission="CREATE_EXAMINATION">
                  <Button
                    className="w-full bg-primary text-white hover:bg-primary/90"
                    onClick={handleCreateExam}
                  >
                    <Stethoscope className="mr-2 h-4 w-4" />
                    Ghi nhận kết quả khám
                  </Button>
                </PermissionGuard>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const InfoItem: React.FC<{
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="flex items-start gap-2">
    {icon && <div className="mt-0.5 text-muted-foreground">{icon}</div>}
    <div className="flex-1">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  </div>
);

const getStatusBadge = (status?: string): string => {
  if (!status) return 'bg-gray-500';
  const lowerStatus = status.toLowerCase();
  switch (lowerStatus) {
    case 'scheduled':
      return 'bg-blue-500';
    case 'done':
    case 'completed':
      return 'bg-green-500';
    case 'cancel':
    case 'cancelled':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

export default AppointmentDetailDialog;

