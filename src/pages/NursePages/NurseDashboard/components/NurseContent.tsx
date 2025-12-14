import React, { useState } from 'react';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@/components/ui';
import type { ContentSectionProps, Section } from '../types';
import { formatCurrency, formatDate, formatDateTime } from '../utils';
import { STATUS_BADGE } from '../constants';
import { Stethoscope, User, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import AppointmentsCalendar from './AppointmentsCalendar';
import DoctorDetailDialog from './DoctorDetailDialog';
import ProfileSection from './ProfileSection';
import AccountSection from './AccountSection';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { usePermission } from '@/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { nurseAPI } from '@/services';
import { queryKeys } from '@/services/queryClient';
import { showNotification } from '@/components/ui';

const NurseContent: React.FC<ContentSectionProps> = ({
  activeSection,
  treatmentPlans,
  appointments,
  patients,
  doctors,
  selectedDoctorId,
  onDoctorSelect,
  onDoctorClick,
  onViewAppointmentDetail,
}) => {
  const { hasPermission } = usePermission();
  const canNotificationAppointment = hasPermission('NOTIFICATION_APPOINMENT');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedDoctorDetail, setSelectedDoctorDetail] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Mutation for updating appointment notification
  const updateNotificationMutation = useMutation({
    mutationFn: (appointmentId: string) => nurseAPI.updateAppointmentNotification(appointmentId),
    onSuccess: () => {
      // Invalidate appointments queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.nurse.allAppointments });
      showNotification.success('Đã cập nhật trạng thái thông báo thành công');
    },
    onError: (error: any) => {
      showNotification.error(
        'Không thể cập nhật trạng thái thông báo',
        error?.response?.data?.message || error?.message || 'Đã xảy ra lỗi'
      );
    },
  });

  const renderContent = () => {
    switch (activeSection) {
      case 'treatment':
        return <TreatmentPlansSection plans={treatmentPlans} />;
      case 'appointments':
        return (
          <AppointmentsCalendar
            appointments={appointments}
            doctors={doctors}
            selectedDoctorId={selectedDoctorId}
            onDoctorSelect={onDoctorSelect}
            onViewDetail={onViewAppointmentDetail}
          />
        );
      case 'patients':
        return (
          <PatientsSection
            patients={patients}
            selectedPatientId={selectedPatientId}
            onPatientSelect={setSelectedPatientId}
          />
        );
      case 'doctors':
        return (
          <>
            <DoctorsSection
              doctors={doctors}
              onDoctorClick={(doctorId) => {
                setSelectedDoctorDetail(doctorId);
                onDoctorClick?.(doctorId);
              }}
            />
            <DoctorDetailDialog
              open={!!selectedDoctorDetail}
              doctor={doctors.find((d) => d.id === selectedDoctorDetail) || null}
              onOpenChange={(open) => {
                if (!open) setSelectedDoctorDetail(null);
              }}
            />
          </>
        );
      case 'profile':
        return <ProfileSection />;
      case 'account':
        return <AccountSection />;
      case 'overview':
      default:
        return null;
    }
  };

  return <div className="space-y-4">{renderContent()}</div>;
};

const TreatmentPlansSection: React.FC<{ plans: ContentSectionProps['treatmentPlans'] }> = ({
  plans,
}) => (
  <Card className="border-none bg-white/90 shadow-medium">
    <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <CardTitle className="text-lg">Phác đồ điều trị</CardTitle>
        <CardDescription>Danh sách phác đồ được giao cho y tá</CardDescription>
      </div>
      <Badge variant="secondary" className="bg-secondary/10 text-secondary">
        {plans.length} phác đồ
      </Badge>
    </CardHeader>
    <CardContent className="space-y-3">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className="rounded-2xl border border-border/70 bg-white/70 px-4 py-4 shadow-sm transition hover:shadow-medium"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-base font-semibold text-foreground">{plan.title}</h3>
                <Badge className={STATUS_BADGE[plan.status] || STATUS_BADGE.Inprogress}>
                  {plan.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Stethoscope className="h-3 w-3" />
                  {plan.doctorFullname}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(plan.createAt)}
                </span>
                <span className="font-medium text-primary">{formatCurrency(plan.totalCost)}</span>
              </div>
              {plan.notes && (
                <div className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
                  <strong>Ghi chú:</strong> {plan.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      {plans.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">Chưa có phác đồ điều trị nào được giao.</p>
        </div>
      )}
    </CardContent>
  </Card>
);

const PatientsSection: React.FC<{
  patients: ContentSectionProps['patients'];
  selectedPatientId: string | null;
  onPatientSelect: (patientId: string | null) => void;
}> = ({ patients, selectedPatientId, onPatientSelect }) => {
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1 border-none bg-white/90 shadow-medium">
        <CardHeader>
          <CardTitle className="text-lg">Danh sách bệnh nhân</CardTitle>
          <CardDescription>{patients.length} bệnh nhân</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {patients.map((patient) => (
            <button
              key={patient.id}
              onClick={() => onPatientSelect(patient.id === selectedPatientId ? null : patient.id)}
              className={`w-full rounded-xl border p-3 text-left transition ${
                selectedPatientId === patient.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border/70 bg-white/60 hover:border-primary/50'
              }`}
            >
              <p className="text-sm font-semibold text-foreground">{patient.fullName}</p>
              <p className="text-xs text-muted-foreground">{patient.phone}</p>
            </button>
          ))}
          {patients.length === 0 && (
            <p className="text-sm text-muted-foreground">Chưa có bệnh nhân nào.</p>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 border-none bg-white/90 shadow-medium">
        <CardHeader>
          <CardTitle className="text-lg">Thông tin bệnh nhân</CardTitle>
          <CardDescription>Chi tiết thông tin bệnh nhân</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedPatient ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoItem icon={<User className="h-4 w-4" />} label="Họ tên" value={selectedPatient.fullName} />
                <InfoItem icon={<Phone className="h-4 w-4" />} label="Số điện thoại" value={selectedPatient.phone} />
                <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={selectedPatient.email} />
                <InfoItem icon={<MapPin className="h-4 w-4" />} label="Địa chỉ" value={selectedPatient.address} />
                <InfoItem icon={<User className="h-4 w-4" />} label="Giới tính" value={selectedPatient.gender === 'MALE' ? 'Nam' : selectedPatient.gender === 'FEMALE' ? 'Nữ' : selectedPatient.gender || 'N/A'} />
                <InfoItem icon={<Calendar className="h-4 w-4" />} label="Ngày sinh" value={formatDate(selectedPatient.dob)} />
              </div>

              {(selectedPatient.emergencyContactName || selectedPatient.emergencyPhoneNumber) && (
                <div className="rounded-xl border border-border/70 bg-blue-50/50 p-4">
                  <h4 className="mb-2 text-sm font-semibold text-foreground">Liên hệ khẩn cấp</h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    {selectedPatient.emergencyContactName && (
                      <InfoItem label="Tên người liên hệ" value={selectedPatient.emergencyContactName} />
                    )}
                    {selectedPatient.emergencyPhoneNumber && (
                      <InfoItem label="Số điện thoại" value={selectedPatient.emergencyPhoneNumber} />
                    )}
                  </div>
                </div>
              )}

              {(selectedPatient.allergy || selectedPatient.bloodGroup || selectedPatient.medicalHistory) && (
                <div className="rounded-xl border border-border/70 bg-amber-50/50 p-4">
                  <h4 className="mb-2 text-sm font-semibold text-foreground">Thông tin y tế</h4>
                  <div className="space-y-2">
                    {selectedPatient.bloodGroup && <InfoItem label="Nhóm máu" value={selectedPatient.bloodGroup} />}
                    {selectedPatient.allergy && <InfoItem label="Dị ứng" value={selectedPatient.allergy} />}
                    {selectedPatient.medicalHistory && (
                      <InfoItem label="Tiền sử bệnh" value={selectedPatient.medicalHistory} />
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
              <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">Chọn một bệnh nhân để xem thông tin chi tiết</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const DoctorsSection: React.FC<{ 
  doctors: ContentSectionProps['doctors'];
  onDoctorClick?: (doctorId: string) => void;
}> = ({ doctors, onDoctorClick }) => (
  <Card className="border-none bg-white/90 shadow-medium">
    <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <CardTitle className="text-lg">Danh sách bác sĩ</CardTitle>
        <CardDescription>Thông tin các bác sĩ trong phòng khám</CardDescription>
      </div>
      <Badge variant="secondary" className="bg-secondary/10 text-secondary">
        {doctors.length} bác sĩ
      </Badge>
    </CardHeader>
    <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {doctors.map((doctor) => (
        <PermissionGuard key={doctor.id} permission={['GET_INFO_DOCTOR', 'PICK_DOCTOR']} requireAll={false}>
          <div
            onClick={() => onDoctorClick?.(doctor.id)}
            className="cursor-pointer rounded-2xl border border-border/70 bg-white/70 p-4 shadow-sm transition hover:shadow-medium hover:border-primary/50"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">{doctor.fullName}</h3>
                {doctor.specialization && (
                  <p className="mt-1 text-xs text-muted-foreground">{doctor.specialization}</p>
                )}
                {doctor.licenseNumber && (
                  <p className="mt-1 text-xs text-muted-foreground">Số giấy phép: {doctor.licenseNumber}</p>
                )}
                {doctor.yearsExperience !== undefined && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Kinh nghiệm: {doctor.yearsExperience} năm
                  </p>
                )}
              </div>
            </div>
          </div>
        </PermissionGuard>
      ))}
      {doctors.length === 0 && (
        <div className="col-span-full rounded-2xl border border-dashed border-border px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">Chưa có bác sĩ nào trong hệ thống.</p>
        </div>
      )}
    </CardContent>
  </Card>
);

const InfoItem: React.FC<{ icon?: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-start gap-2">
    {icon ? (
      <div className="mt-0.5 flex h-4 w-4 items-center justify-center text-muted-foreground">{icon}</div>
    ) : (
      <div className="h-4 w-4" />
    )}
    <div className="flex-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || 'N/A'}</p>
    </div>
  </div>
);

export default NurseContent;

