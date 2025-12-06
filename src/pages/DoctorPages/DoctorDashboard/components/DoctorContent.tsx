import React from 'react';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import {
  AppointmentSummary,
  DentalService,
  ExaminationSummary,
  PrescriptionItem,
  TreatmentPhase,
  TreatmentPlan,
} from '@/types/doctor';
import type { ContentSectionProps, Section } from '../types';
import { formatCurrency, formatDate, formatDateTime } from '../utils';
import { STATUS_BADGE } from '../constants';
import { Stethoscope } from 'lucide-react';
import InsightsSection from './InsightsSection';
import PatientsSection from './PatientsSection';
import AppointmentsCalendar from './AppointmentsCalendar';

const DoctorContent: React.FC<ContentSectionProps> = (props) => {
  const {
    activeSection,
    appointments,
    scheduledAppointments,
    examinations,
    treatmentPlans,
    phasesByPlan,
    serviceCategories,
    services,
    prescriptions,
    onCreateExam,
    onEditExam,
    onViewExamDetail,
    onCreatePhase,
    onEditPhase,
    onCreatePlan,
    onUpdatePlanStatus,
    onPhaseClick,
    onAddPhase,
  } = props;

  const renderContent = () => {
    switch (activeSection) {
      case 'appointments':
        return (
          <AppointmentsCalendar
            appointments={appointments}
            scheduledAppointments={scheduledAppointments}
            onCreateExam={onCreateExam}
          />
        );
      case 'examinations':
        return <ExaminationBoard examinations={examinations} onEditExam={onEditExam} onViewDetail={onViewExamDetail} />;
      case 'treatment':
        return (
          <TreatmentBoard
            plans={treatmentPlans}
            phasesByPlan={phasesByPlan}
            examinations={examinations}
            onCreatePhase={onCreatePhase}
            onEditPhase={onEditPhase}
            onCreatePlan={onCreatePlan}
            onUpdatePlanStatus={onUpdatePlanStatus}
          />
        );
      case 'catalog':
        return (
          <CatalogPanel
            serviceCategories={serviceCategories}
            services={services}
            prescriptions={prescriptions}
            doctors={props.doctors}
          />
        );
      case 'insights':
        return (
          <InsightsSection
            appointments={appointments}
            scheduledAppointments={scheduledAppointments}
            examinations={examinations}
            treatmentPlans={treatmentPlans}
            phasesByPlan={phasesByPlan}
            services={services}
          />
        );
      case 'patients':
        return (
          <PatientsSection
            examinations={examinations}
            treatmentPlans={treatmentPlans}
            appointments={appointments}
            phasesByPlan={phasesByPlan}
            onPhaseClick={onPhaseClick}
            onAddPhase={onAddPhase}
          />
        );
      case 'overview':
      default:
        return null;
    }
  };

  return <div className="space-y-4">{renderContent()}</div>;
};

const AppointmentsBoard: React.FC<{
  appointments: AppointmentSummary[];
  scheduledAppointments: AppointmentSummary[];
  onCreateExam: (appointment: AppointmentSummary) => void;
}> = ({ appointments, scheduledAppointments, onCreateExam }) => (
  <Card className="border-none bg-white/90 shadow-medium">
    <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <CardTitle className="text-lg">Quản lý lịch hẹn</CardTitle>
        <CardDescription>Tự động đồng bộ slot đã đặt & trạng thái</CardDescription>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge className="bg-primary/10 text-primary">{scheduledAppointments.length} lịch chờ</Badge>
        <Badge variant="outline">Tổng {appointments.length} lịch</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-white/60 px-4 py-3 transition hover:shadow-medium"
        >
          <div>
            <p className="text-sm font-semibold text-foreground">{appointment.type}</p>
            <p className="text-xs text-muted-foreground">{appointment.notes || 'Không có ghi chú'}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="text-right">
              <p className="font-semibold text-foreground">{formatDateTime(appointment.dateTime)}</p>
              <p className="text-xs text-muted-foreground capitalize">{appointment.status}</p>
            </div>
            {appointment.status?.toLowerCase() === 'scheduled' && (
              <Button size="sm" variant="outline" onClick={() => onCreateExam(appointment)}>
                <Stethoscope className="mr-2 h-3.5 w-3.5" /> Bắt đầu
              </Button>
            )}
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

const ExaminationBoard: React.FC<{
  examinations: ExaminationSummary[];
  onEditExam: (examination: ExaminationSummary) => void;
  onViewDetail: (examination: ExaminationSummary) => void;
}> = ({ examinations, onEditExam, onViewDetail }) => (
  <Card className="border-none bg-white/90 shadow-medium">
    <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <CardTitle className="text-lg">Tất cả kết quả khám</CardTitle>
        <CardDescription>Quản lý hình ảnh, dịch vụ & toa thuốc</CardDescription>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary" className="bg-secondary/10 text-secondary">
          {examinations.length} kết quả
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      {examinations.map((exam) => (
        <div
          key={exam.id}
          className="rounded-2xl border border-border/70 bg-white/70 px-4 py-3 text-sm shadow-sm transition hover:shadow-medium"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-foreground">{exam.diagnosis}</p>
              <p className="text-xs text-muted-foreground">{exam.symptoms}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/40 text-primary">
                {formatDate(exam.createAt)}
              </Badge>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => onViewDetail(exam)}>
                  Xem
                </Button>
                <Button size="sm" variant="ghost" className="text-primary" onClick={() => onEditExam(exam)}>
                  Sửa
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {exam.listDentalServicesEntityOrder?.map((service) => (
              <Badge key={service.name} variant="secondary" className="bg-primary/5 text-primary">
                {service.name} · {service.quantity} {service.unit}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

const TreatmentBoard: React.FC<{
  plans: TreatmentPlan[];
  phasesByPlan: Record<string, TreatmentPhase[]>;
  examinations: ExaminationSummary[];
  onCreatePhase: (plan: TreatmentPlan) => void;
  onEditPhase: (plan: TreatmentPlan, phase: TreatmentPhase) => void;
  onCreatePlan: (examination?: ExaminationSummary) => void;
  onUpdatePlanStatus: (plan: TreatmentPlan, status: string) => void;
}> = ({ plans, phasesByPlan, examinations, onCreatePhase, onEditPhase, onCreatePlan, onUpdatePlanStatus }) => (
  <Card className="border-none bg-white/90 shadow-medium">
    <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <CardTitle className="text-lg">Phác đồ điều trị</CardTitle>
        <CardDescription>Kiểm soát tiến trình, chi phí & lịch tái khám</CardDescription>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onCreatePlan()}
        className="border-primary/40 text-primary hover:bg-primary/10"
      >
        + Tạo phác đồ mới
      </Button>
    </CardHeader>
    <CardContent className="space-y-4">
      {plans.map((plan) => {
        const phases = phasesByPlan[plan.id] ?? [];
        // Find related examination to get patient info
        const relatedExam = examinations.find((e) => e.id === plan.id || plan.id.includes(e.id));
        const startDate = phases.length > 0 
          ? phases.sort((a, b) => new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime())[0]?.startDate
          : plan.createAt;
        
        return (
          <div key={plan.id} className="rounded-2xl border border-border/70 bg-white/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-foreground">{plan.title}</h3>
              <select
                value={plan.status}
                onChange={(event) => onUpdatePlanStatus(plan, event.target.value)}
                className="rounded-full border border-border/60 bg-white/70 px-3 py-1 text-xs"
              >
                {['Inprogress', 'Done', 'Paused', 'Cancelled'].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
                <p className="text-xs text-muted-foreground">{plan.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  {relatedExam && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-foreground">Bệnh nhân:</span>
                      <span>{relatedExam.patientId || 'Chưa xác định'}</span>
                    </div>
                  )}
                  {startDate && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-foreground">Bắt đầu:</span>
                      <span>{formatDate(startDate)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-foreground">Bác sĩ:</span>
                    <span>{plan.doctorFullname || 'Chưa xác định'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-foreground">Tổng chi phí:</span>
                    <span className="text-primary font-semibold">{formatCurrency(plan.totalCost)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2 text-xs">
              {phases.map((phase) => (
                <button
                  key={phase.id}
                  type="button"
                    className="rounded-2xl border border-primary/30 bg-primary/5 px-3 py-1.5 text-primary hover:bg-primary/10 transition"
                  onClick={() => onEditPhase(plan, phase)}
                >
                    <div className="flex items-center gap-2">
                      <span>Giai đoạn {phase.phaseNumber}</span>
                      {phase.startDate && (
                        <span className="text-xs opacity-70">({formatDate(phase.startDate)})</span>
                      )}
                    </div>
                </button>
              ))}
              <button
                type="button"
                  className="rounded-2xl border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                onClick={() => onCreatePhase(plan)}
              >
                + Thêm tiến trình
              </button>
              </div>
              {phases.length > 0 && (
                <div className="rounded-xl border border-border/50 bg-muted/30 p-3 text-xs">
                  <p className="font-medium text-foreground mb-2">Tổng quan tiến trình:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <span className="text-muted-foreground">Tổng giai đoạn:</span>
                      <span className="ml-1 font-semibold text-foreground">{phases.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Đang điều trị:</span>
                      <span className="ml-1 font-semibold text-foreground">
                        {phases.filter((p) => p.status?.toLowerCase() === 'inprogress').length}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hoàn thành:</span>
                      <span className="ml-1 font-semibold text-foreground">
                        {phases.filter((p) => p.status?.toLowerCase() === 'done').length}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Chi phí tiến trình:</span>
                      <span className="ml-1 font-semibold text-primary">
                        {formatCurrency(phases.reduce((sum, p) => sum + (p.cost || 0), 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
      {plans.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          <p className="mb-3">Chưa có phác đồ điều trị nào.</p>
          <Button variant="outline" size="sm" onClick={() => onCreatePlan()}>
            Tạo phác đồ mới từ kết quả khám
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
);

const CatalogPanel: React.FC<{
  serviceCategories: { id: string; name: string; listDentalServiceEntity: DentalService[] }[];
  services: DentalService[];
  prescriptions: PrescriptionItem[];
  doctors?: any[];
}> = ({ serviceCategories, prescriptions, doctors }) => (
  <Card className="border-none bg-white/90 shadow-medium">
    <CardHeader>
      <CardTitle className="text-lg">Danh mục dịch vụ & thuốc</CardTitle>
      <CardDescription>Tra cứu nhanh khi tạo kết quả khám</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      {doctors && doctors.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Danh sách bác sĩ</h3>
          <div className="rounded-2xl border border-border/70 bg-white/60 p-3">
            <div className="grid gap-2 md:grid-cols-2">
              {doctors.map((doctor) => (
                <div key={doctor.id} className="rounded-xl border border-border/60 bg-white px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{doctor.fullName || doctor.username}</p>
                  {doctor.specialization && (
                    <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Dịch vụ nha khoa</h3>
        {serviceCategories.map((category) => (
          <div key={category.id} className="rounded-2xl border border-border/70 bg-white/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {category.name}
            </p>
            <ul className="mt-2 space-y-2 text-sm text-foreground">
              {category.listDentalServiceEntity.slice(0, 3).map((service) => (
                <li key={service.id} className="flex items-center justify-between">
                  <span>{service.name}</span>
                  <span className="text-xs text-muted-foreground">{formatCurrency(service.unitPrice)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Thuốc kê toa</h3>
        <div className="rounded-2xl border border-border/70 bg-white/60 p-3">
          <ul className="space-y-2 text-sm">
            {prescriptions.slice(0, 6).map((item) => (
              <li key={item.name} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.dosage} · {item.frequency}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      </div>
    </CardContent>
  </Card>
);

export default DoctorContent;

