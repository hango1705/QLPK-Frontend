import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Badge,
} from '@/components/ui';
import { Stethoscope, Award, Calendar, User } from 'lucide-react';
import type { DoctorSummary } from '@/types/doctor';

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
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Họ tên</span>
              </div>
              <p className="text-base font-semibold text-foreground">{doctor.fullName}</p>
            </div>

            {doctor.specialization && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Award className="h-4 w-4" />
                  <span>Chuyên khoa</span>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {doctor.specialization}
                </Badge>
              </div>
            )}

            {doctor.licenseNumber && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Award className="h-4 w-4" />
                  <span>Số giấy phép</span>
                </div>
                <p className="text-base font-medium text-foreground">{doctor.licenseNumber}</p>
              </div>
            )}

            {doctor.yearsExperience !== undefined && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Kinh nghiệm</span>
                </div>
                <p className="text-base font-medium text-foreground">
                  {doctor.yearsExperience} năm
                </p>
              </div>
            )}

            {doctor.email && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Email</span>
                </div>
                <p className="text-base font-medium text-foreground">{doctor.email}</p>
              </div>
            )}

            {doctor.phone && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Số điện thoại</span>
                </div>
                <p className="text-base font-medium text-foreground">{doctor.phone}</p>
              </div>
            )}
          </div>

          {doctor.bio && (
            <div className="space-y-2 rounded-xl border border-border/70 bg-muted/30 p-4">
              <h4 className="text-sm font-semibold text-foreground">Giới thiệu</h4>
              <p className="text-sm text-muted-foreground">{doctor.bio}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorDetailDialog;

