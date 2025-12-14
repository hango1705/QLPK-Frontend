import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Badge,
  Loading,
} from '@/components/ui';
import { Stethoscope, Award, Calendar, User, Mail, Phone, MapPin } from 'lucide-react';
import type { DoctorSummary } from '@/types/doctor';
import { useQuery } from '@tanstack/react-query';
import { nurseAPI } from '@/services';
import { queryKeys } from '@/services/queryClient';

interface DoctorDetailDialogProps {
  open: boolean;
  doctor: DoctorSummary | null;
  onOpenChange: (open: boolean) => void;
}

const DoctorDetailDialog: React.FC<DoctorDetailDialogProps> = ({
  open,
  doctor,
  onOpenChange,
}) => {
  // Fetch full doctor information when dialog opens
  const { data: fullDoctorInfo, isLoading } = useQuery({
    queryKey: queryKeys.nurse.doctor(doctor?.id || ''),
    queryFn: () => nurseAPI.getDoctorById(doctor!.id),
    enabled: open && !!doctor?.id,
  });

  // Use full doctor info if available, otherwise fall back to basic doctor info
  const displayDoctor = fullDoctorInfo || doctor;

  if (!doctor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-2 border-b border-border/70 px-6 pb-4 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-foreground">
                {doctor.fullName}
              </DialogTitle>
              <DialogDescription>Thông tin chi tiết bác sĩ</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 px-6 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loading size="lg" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Họ tên</span>
                  </div>
                  <p className="text-base font-semibold text-foreground">{displayDoctor?.fullName || 'N/A'}</p>
                </div>

                {displayDoctor?.specialization && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Award className="h-4 w-4" />
                      <span>Chuyên khoa</span>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {displayDoctor.specialization}
                    </Badge>
                  </div>
                )}

                {displayDoctor?.licenseNumber && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Award className="h-4 w-4" />
                      <span>Số giấy phép</span>
                    </div>
                    <p className="text-base font-medium text-foreground">{displayDoctor.licenseNumber}</p>
                  </div>
                )}

                {displayDoctor?.yearsExperience !== undefined && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Kinh nghiệm</span>
                    </div>
                    <p className="text-base font-medium text-foreground">
                      {displayDoctor.yearsExperience} năm
                    </p>
                  </div>
                )}

                {displayDoctor?.email && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                    <p className="text-base font-medium text-foreground">{displayDoctor.email}</p>
                  </div>
                )}

                {displayDoctor?.phone && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>Số điện thoại</span>
                    </div>
                    <p className="text-base font-medium text-foreground">{displayDoctor.phone}</p>
                  </div>
                )}

                {displayDoctor?.address && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Địa chỉ</span>
                    </div>
                    <p className="text-base font-medium text-foreground">{displayDoctor.address}</p>
                  </div>
                )}

                {displayDoctor?.gender && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Giới tính</span>
                    </div>
                    <p className="text-base font-medium text-foreground">
                      {displayDoctor.gender === 'MALE' ? 'Nam' : displayDoctor.gender === 'FEMALE' ? 'Nữ' : displayDoctor.gender}
                    </p>
                  </div>
                )}

                {displayDoctor?.dob && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Ngày sinh</span>
                    </div>
                    <p className="text-base font-medium text-foreground">
                      {new Date(displayDoctor.dob).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorDetailDialog;

