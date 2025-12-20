import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Badge,
  Button,
  Loading,
} from '@/components/ui';
import { User, Mail, Phone, MapPin, Calendar, Shield, Ban, CheckCircle, Heart, AlertCircle, FileText, ClipboardList } from 'lucide-react';
import type { User as UserType } from '@/types/admin';
import { ROLE_BADGE, STATUS_BADGE } from '../../constants';
import { cn } from '@/utils/cn';
import { type TreatmentPlansResponse, patientAPI } from '@/services/api/patient';
import { nurseAPI } from '@/services/api/nurse';
import { queryKeys } from '@/services/queryClient';

interface UserDetailDialogProps {
  open: boolean;
  user: UserType | null;
  onOpenChange: (open: boolean) => void;
  onDisable?: (userId: string) => void;
  onEnable?: (userId: string) => void;
}

const UserDetailDialog: React.FC<UserDetailDialogProps> = ({
  open,
  user,
  onOpenChange,
  onDisable,
  onEnable,
}) => {
  if (!user) return null;

  // Determine user role (normalize to lowercase for comparison)
  const userRole = user.role?.toLowerCase() || '';

  // Fetch patient details only if user is a patient
  const { data: patientDetails, isLoading: loadingPatientDetails, error: patientError } = useQuery({
    queryKey: ['patient', 'user', user.id],
    queryFn: () => nurseAPI.getPatientByUserId(user.id),
    enabled: open && !!user && userRole === 'patient',
    retry: false, // Don't retry on 404
  });

  // Fetch doctor details only if user is a doctor or doctorlv2
  const { data: doctorDetails, isLoading: loadingDoctorDetails, error: doctorError } = useQuery({
    queryKey: ['doctor', 'user', user.id],
    queryFn: () => nurseAPI.getDoctorByUserId(user.id),
    enabled: open && !!user && (userRole === 'doctor' || userRole === 'doctorlv2'),
    retry: false,
  });

  // Fetch treatment plans if user is a patient (using patientDetails.id which is the actual patientId)
  const { data: treatmentPlans, isLoading: loadingTreatmentPlans, error: treatmentPlansError } = useQuery({
    queryKey: queryKeys.patient.treatmentPlans(patientDetails?.id || ''),
    queryFn: () => {
      if (!patientDetails?.id) throw new Error('Patient ID not found');
      return patientAPI.getTreatmentPlansByPatientId(patientDetails.id);
    },
    enabled: open && !!user && !!patientDetails?.id && userRole === 'patient', // Only fetch if patient details exist
    retry: false,
  });


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-2 border-b border-border/70 px-6 pb-4 pt-6">
          <DialogTitle className="text-xl font-semibold text-foreground">Chi tiết người dùng</DialogTitle>
          <DialogDescription>Thông tin đầy đủ về tài khoản người dùng</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 py-6">
          {/* User Header */}
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <User className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-semibold text-foreground">
                  {user.full_name || user.username || 'Chưa có tên'}
                </h3>
                {user.role && (
                  <Badge className={cn('text-xs', ROLE_BADGE[user.role] || ROLE_BADGE.patient)}>
                    {user.role.toUpperCase()}
                  </Badge>
                )}
                <Badge
                  className={cn('text-xs', user.disable ? STATUS_BADGE.disabled : STATUS_BADGE.active)}
                >
                  {user.disable ? 'Vô hiệu hóa' : 'Hoạt động'}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">@{user.username}</p>
            </div>
          </div>

          {/* User Info Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {user.email && (
              <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-white/60 p-3">
                <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="mt-1 truncate text-sm font-medium text-foreground">{user.email}</p>
                </div>
              </div>
            )}

            {user.phone && (
              <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-white/60 p-3">
                <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Số điện thoại</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{user.phone}</p>
                </div>
              </div>
            )}

            {user.address && (
              <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-white/60 p-3 md:col-span-2">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Địa chỉ</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{user.address}</p>
                </div>
              </div>
            )}

            {user.dob && (
              <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-white/60 p-3">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Ngày sinh</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {new Date(user.dob).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            )}

            {user.gender && (
              <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-white/60 p-3">
                <Shield className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Giới tính</p>
                  <p className="mt-1 text-sm font-medium text-foreground capitalize">{user.gender}</p>
                </div>
              </div>
            )}
          </div>

          {/* Role-specific Details */}
          {/* Patient Details */}
          {userRole === 'patient' && (
            <div className="space-y-4 border-t border-border/70 pt-4">
              <h3 className="text-sm font-semibold text-foreground">Thông tin bệnh nhân</h3>
              
              {loadingPatientDetails ? (
                <div className="flex items-center justify-center py-8">
                  <Loading size="md" />
                  <span className="ml-2 text-sm text-muted-foreground">Đang tải thông tin bệnh nhân...</span>
                </div>
              ) : patientError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                  <p className="text-sm text-rose-600">
                    Không thể tải thông tin bệnh nhân. Vui lòng thử lại sau.
                  </p>
                </div>
              ) : patientDetails ? (
                <>
                  {/* Emergency Contact */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Thông tin liên hệ khẩn cấp</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      {patientDetails.emergencyContactName ? (
                        <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-white/60 p-3">
                          <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Tên người liên hệ</p>
                            <p className="mt-1 text-sm font-medium text-foreground">{patientDetails.emergencyContactName}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 rounded-xl border border-dashed border-border/50 bg-muted/30 p-3">
                          <User className="mt-0.5 h-4 w-4 text-muted-foreground/50" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Tên người liên hệ</p>
                            <p className="mt-1 text-sm font-medium text-muted-foreground/70">Chưa cập nhật</p>
                          </div>
                        </div>
                      )}
                      {patientDetails.emergencyPhoneNumber ? (
                        <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-white/60 p-3">
                          <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Số điện thoại khẩn cấp</p>
                            <p className="mt-1 text-sm font-medium text-foreground">{patientDetails.emergencyPhoneNumber}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 rounded-xl border border-dashed border-border/50 bg-muted/30 p-3">
                          <Phone className="mt-0.5 h-4 w-4 text-muted-foreground/50" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Số điện thoại khẩn cấp</p>
                            <p className="mt-1 text-sm font-medium text-muted-foreground/70">Chưa cập nhật</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Thông tin y tế</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      {patientDetails.bloodGroup ? (
                        <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-white/60 p-3">
                          <Heart className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Nhóm máu</p>
                            <p className="mt-1 text-sm font-medium text-foreground">{patientDetails.bloodGroup}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 rounded-xl border border-dashed border-border/50 bg-muted/30 p-3">
                          <Heart className="mt-0.5 h-4 w-4 text-muted-foreground/50" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Nhóm máu</p>
                            <p className="mt-1 text-sm font-medium text-muted-foreground/70">Chưa cập nhật</p>
                          </div>
                        </div>
                      )}
                      {patientDetails.allergy ? (
                        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/60 p-3 md:col-span-2">
                          <AlertCircle className="mt-0.5 h-4 w-4 text-rose-600" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Dị ứng</p>
                            <p className="mt-1 text-sm font-medium text-foreground">{patientDetails.allergy}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 rounded-xl border border-dashed border-border/50 bg-muted/30 p-3 md:col-span-2">
                          <AlertCircle className="mt-0.5 h-4 w-4 text-muted-foreground/50" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Dị ứng</p>
                            <p className="mt-1 text-sm font-medium text-muted-foreground/70">Không có</p>
                          </div>
                        </div>
                      )}
                      {patientDetails.medicalHistory ? (
                        <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-white/60 p-3 md:col-span-2">
                          <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Tiền sử bệnh</p>
                            <p className="mt-1 text-sm font-medium text-foreground whitespace-pre-wrap">{patientDetails.medicalHistory}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 rounded-xl border border-dashed border-border/50 bg-muted/30 p-3 md:col-span-2">
                          <FileText className="mt-0.5 h-4 w-4 text-muted-foreground/50" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Tiền sử bệnh</p>
                            <p className="mt-1 text-sm font-medium text-muted-foreground/70">Chưa cập nhật</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Treatment Plans */}
                  {patientDetails && (
                    <div className="space-y-4 border-t border-border/70 pt-4">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" />
                        Phác đồ điều trị
                      </h4>
                      {loadingTreatmentPlans ? (
                        <div className="flex items-center justify-center py-4">
                          <Loading size="sm" />
                          <span className="ml-2 text-xs text-muted-foreground">Đang tải phác đồ điều trị...</span>
                        </div>
                      ) : treatmentPlansError ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3">
                          <p className="text-xs text-rose-600">Không thể tải phác đồ điều trị</p>
                        </div>
                      ) : treatmentPlans && treatmentPlans.length > 0 ? (
                        <div className="space-y-3">
                          {treatmentPlans.map((plan) => (
                            <div
                              key={plan.id}
                              className="rounded-xl border border-border/70 bg-white/60 p-4 hover:shadow-sm transition"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-sm font-semibold text-foreground truncate">{plan.title}</h5>
                                  {plan.description && (
                                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
                                  )}
                                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                                    {plan.doctorFullname && (
                                      <span className="text-muted-foreground">
                                        Bác sĩ: <span className="font-medium text-foreground">{plan.doctorFullname}</span>
                                      </span>
                                    )}
                                    {plan.createAt && (
                                      <span className="text-muted-foreground">
                                        Ngày tạo: <span className="font-medium text-foreground">{plan.createAt}</span>
                                      </span>
                                    )}
                                    {plan.totalCost > 0 && (
                                      <span className="text-muted-foreground">
                                        Chi phí: <span className="font-medium text-foreground">
                                          {plan.totalCost.toLocaleString('vi-VN')} đ
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {plan.status && (
                                  <Badge
                                    className={cn(
                                      'text-xs shrink-0',
                                      plan.status.toLowerCase().includes('hoàn') || plan.status.toLowerCase().includes('completed')
                                        ? 'bg-green-100 text-green-700 border-green-200'
                                        : plan.status.toLowerCase().includes('tạm') || plan.status.toLowerCase().includes('paused')
                                        ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                        : 'bg-blue-100 text-blue-700 border-blue-200'
                                    )}
                                  >
                                    {plan.status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-border/50 bg-muted/30 p-3 text-center">
                          <p className="text-xs text-muted-foreground">Chưa có phác đồ điều trị</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-border/50 bg-muted/30 p-4 text-center">
                  <p className="text-sm text-muted-foreground">Không có thông tin bệnh nhân bổ sung</p>
                </div>
              )}
            </div>
          )}

          {/* Doctor Details */}
          {(userRole === 'doctor' || userRole === 'doctorlv2') && (
            <div className="space-y-4 border-t border-border/70 pt-4">
              <h3 className="text-sm font-semibold text-foreground">Thông tin bác sĩ</h3>
              
              {loadingDoctorDetails ? (
                <div className="flex items-center justify-center py-8">
                  <Loading size="md" />
                  <span className="ml-2 text-sm text-muted-foreground">Đang tải thông tin bác sĩ...</span>
                </div>
              ) : doctorError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                  <p className="text-sm text-rose-600">
                    Không thể tải thông tin bác sĩ. Vui lòng thử lại sau.
                  </p>
                </div>
              ) : doctorDetails ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {doctorDetails.specialization && (
                    <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-white/60 p-3">
                      <Shield className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Chuyên khoa</p>
                        <p className="mt-1 text-sm font-medium text-foreground">{doctorDetails.specialization}</p>
                      </div>
                    </div>
                  )}
                  {doctorDetails.licenseNumber && (
                    <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-white/60 p-3">
                      <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Số giấy phép hành nghề</p>
                        <p className="mt-1 text-sm font-medium text-foreground">{doctorDetails.licenseNumber}</p>
                      </div>
                    </div>
                  )}
                  {doctorDetails.yearsExperience !== undefined && doctorDetails.yearsExperience !== null && (
                    <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-white/60 p-3">
                      <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Kinh nghiệm</p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {doctorDetails.yearsExperience} {doctorDetails.yearsExperience === 1 ? 'năm' : 'năm'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/50 bg-muted/30 p-4 text-center">
                  <p className="text-sm text-muted-foreground">Không có thông tin bác sĩ bổ sung</p>
                </div>
              )}
            </div>
          )}

          {/* Account Status */}
          <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Trạng thái tài khoản</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {user.disable
                    ? 'Tài khoản đã bị vô hiệu hóa và không thể đăng nhập'
                    : 'Tài khoản đang hoạt động bình thường'}
                </p>
              </div>
              {user.disable ? (
                <Badge className={cn('text-xs', STATUS_BADGE.disabled)}>
                  <Ban className="mr-1 h-3 w-3" />
                  Vô hiệu hóa
                </Badge>
              ) : (
                <Badge className={cn('text-xs', STATUS_BADGE.active)}>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Hoạt động
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 flex flex-wrap gap-3 border-t border-border/70 bg-white px-6 py-4">
          <Button variant="outline" className="flex-1 border-border/70" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          {user.disable ? (
            onEnable && (
              <Button
                className="flex-1 bg-green-500 text-white hover:bg-green-600"
                onClick={() => {
                  onEnable(user.id);
                  onOpenChange(false);
                }}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Kích hoạt tài khoản
              </Button>
            )
          ) : (
            onDisable && (
              <Button
                className="flex-1 bg-rose-500 text-white hover:bg-rose-600"
                onClick={() => {
                  onDisable(user.id);
                  onOpenChange(false);
                }}
              >
                <Ban className="mr-2 h-4 w-4" />
                Vô hiệu hóa tài khoản
              </Button>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailDialog;

