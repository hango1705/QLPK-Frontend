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
import { Calendar, Clock, Stethoscope, User, FileText, MessageSquare, Bell, CheckCircle2 } from 'lucide-react';
import type { AppointmentSummary } from '@/types/doctor';
import { formatDateTime, formatDate } from '../utils';
import { STATUS_BADGE } from '../constants';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { nurseAPI } from '@/services';
import { queryKeys } from '@/services/queryClient';
import { showNotification } from '@/components/ui';
import { usePermission } from '@/hooks';

interface AppointmentDetailDialogProps {
  open: boolean;
  appointment: AppointmentSummary | null;
  onOpenChange: (open: boolean) => void;
  onRecordExamination?: (appointment: AppointmentSummary) => void;
  onAppointmentUpdated?: (updatedAppointment: AppointmentSummary) => void;
}

const AppointmentDetailDialog: React.FC<AppointmentDetailDialogProps> = ({
  open,
  appointment,
  onOpenChange,
  onRecordExamination,
  onAppointmentUpdated,
}) => {
  const { hasPermission } = usePermission();
  const canNotificationAppointment = hasPermission('NOTIFICATION_APPOINMENT');
  const queryClient = useQueryClient();

  // Mutation for updating appointment notification
  const updateNotificationMutation = useMutation({
    mutationFn: (appointmentId: string) => nurseAPI.updateAppointmentNotification(appointmentId),
    onSuccess: (updatedAppointment) => {
      // Invalidate appointments queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.nurse.allAppointments });
      queryClient.invalidateQueries({ queryKey: ['nurse', 'appointments'] });
      
      showNotification.success('Đã cập nhật trạng thái thông báo thành công');
      
      // Use the updated appointment from API response (which has notification = "Done")
      // Merge with existing appointment to preserve other fields
      const refreshedAppointment: AppointmentSummary = {
        ...appointment!,
        ...updatedAppointment,
        notification: updatedAppointment.notification || 'Done',
      };
      
      // Update parent state with updated appointment
      if (onAppointmentUpdated) {
        onAppointmentUpdated(refreshedAppointment);
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

  // Check notification status - handle both undefined and null cases
  const isNotificationDone = appointment.notification === 'Done' || appointment.notification === 'done';

  const handleUpdateNotification = () => {
    if (isNotificationDone) {
      showNotification.warning('Lịch hẹn này đã được thông báo');
      return;
    }
    updateNotificationMutation.mutate(appointment.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Chi tiết lịch hẹn</DialogTitle>
          <DialogDescription>Thông tin chi tiết về lịch hẹn khám bệnh</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Basic Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Thông tin cơ bản
            </h3>
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/70 bg-white/60 p-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Loại lịch hẹn</p>
                <p className="text-sm font-medium text-foreground">{appointment.type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Trạng thái</p>
                <Badge className={STATUS_BADGE[appointment.status] || STATUS_BADGE.Scheduled}>
                  {appointment.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Thời gian
                </p>
                <p className="text-sm font-medium text-foreground">
                  {formatDateTime(appointment.dateTime)}
                </p>
              </div>
            </div>
          </div>

          {/* Doctor Information */}
          {appointment.doctorFullName && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Thông tin bác sĩ
              </h3>
              <div className="rounded-xl border border-border/70 bg-white/60 p-4">
                <p className="text-sm font-medium text-foreground">{appointment.doctorFullName}</p>
                {appointment.doctorSpecialization && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Chuyên khoa: {appointment.doctorSpecialization}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Services */}
          {appointment.listDentalServicesEntity && appointment.listDentalServicesEntity.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Dịch vụ
              </h3>
              <div className="rounded-xl border border-border/70 bg-white/60 p-4">
                <div className="space-y-2">
                  {appointment.listDentalServicesEntity.map((service, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{service.name}</span>
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
            </div>
          )}

          {/* Notes */}
          {appointment.notes && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Ghi chú
              </h3>
              <div className="rounded-xl border border-border/70 bg-white/60 p-4">
                <p className="text-sm text-foreground whitespace-pre-wrap">{appointment.notes}</p>
              </div>
            </div>
          )}

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

          {/* Action Button */}
          {onRecordExamination && (
            <div className="flex justify-end pt-4 border-t border-border/70">
              <Button
                onClick={() => {
                  onRecordExamination(appointment);
                  onOpenChange(false);
                }}
                className="bg-primary hover:bg-primary/90"
              >
                Ghi nhận kết quả khám
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDetailDialog;

