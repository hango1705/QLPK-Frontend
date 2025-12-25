import React, { useMemo } from 'react';
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
import DoctorsSection from './DoctorsSection';
import NursesSection from './NursesSection';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

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
    examinationCosts,
    onCreateExam,
    onEditExam,
    onViewExamDetail,
    onCreatePhase,
    onEditPhase,
    onCreatePlan,
    onUpdatePlanStatus,
    onViewPlanDetail,
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
            onViewDetail={props.onViewAppointmentDetail}
          />
        );
      case 'examinations':
        return <ExaminationBoard examinations={examinations} appointments={appointments} treatmentPlans={treatmentPlans} onEditExam={onEditExam} onViewDetail={onViewExamDetail} examinationCosts={examinationCosts} />;
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
            onViewPlanDetail={onViewPlanDetail}
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
      case 'doctors':
        return <DoctorsSection doctors={props.doctors || []} />;
      case 'nurses':
        return <NursesSection nurses={props.nurses || []} isLoading={props.isLoadingNurses} />;
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


const ExaminationBoard: React.FC<{
  examinations: ExaminationSummary[];
  appointments: AppointmentSummary[];
  treatmentPlans: TreatmentPlan[];
  onEditExam: (examination: ExaminationSummary) => void;
  onViewDetail: (examination: ExaminationSummary) => void;
  examinationCosts?: Record<string, { totalCost: number; status: string }>;
}> = ({ examinations, appointments, treatmentPlans, onEditExam, onViewDetail, examinationCosts = {} }) => {
  return (
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
      {examinations.map((exam) => {
        // Tìm tên bệnh nhân từ nhiều nguồn (tương tự logic trong PatientsSection)
        const findPatientName = () => {
          // 1. Thử lấy trực tiếp từ examination nếu backend đã trả về
          if ((exam as any).patientName) {
            return (exam as any).patientName;
          }
          
          // 2. Lấy patientId từ examination (từ appointmentId hoặc trực tiếp)
          let patientId = (exam as any).patientId;
          const appointmentId = (exam as any).appointmentId;
          
          if (!patientId && appointmentId) {
            const appointment = appointments.find((a: any) => a.id === appointmentId);
            patientId = (appointment as any)?.patientId;
          }
          
          if (patientId) {
            // Tìm trong treatmentPlans (ưu tiên vì có patientName)
            const plan = treatmentPlans.find((p: any) => (p as any).patientId === patientId);
            if (plan) {
              const name = (plan as any).patientName || (plan as any).patient?.fullName;
              if (name) return name;
            }
            
            // Tìm trong appointments
            const appointment = appointments.find((a: any) => (a as any).patientId === patientId);
            if (appointment) {
              const name = (appointment as any).patientName || 
                          (appointment as any).patient?.fullName ||
                          (appointment as any).patientFullName;
              if (name) return name;
            }
          }
          
          // 3. Nếu có appointmentId, thử lấy từ appointment đó
          if (appointmentId) {
            const appointment = appointments.find((a: any) => a.id === appointmentId);
            if (appointment) {
              const appPatientId = (appointment as any).patientId;
              if (appPatientId) {
                const plan = treatmentPlans.find((p: any) => (p as any).patientId === appPatientId);
                if (plan) {
                  const name = (plan as any).patientName || (plan as any).patient?.fullName;
                  if (name) return name;
                }
              }
            }
          }
          
          return null;
        };

        const patientName = findPatientName();

        return (
        <div
          key={exam.id}
          className="rounded-2xl border border-border/70 bg-white/70 px-4 py-3 text-sm shadow-sm transition hover:shadow-medium cursor-pointer"
          onClick={() => onViewDetail(exam)}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              {patientName && (
                <p className="text-xs font-medium text-primary mb-1">Bệnh nhân: {patientName}</p>
              )}
              <p className="font-semibold text-foreground">{exam.diagnosis}</p>
              <p className="text-xs text-muted-foreground">{exam.symptoms}</p>
            </div>
            <div className="flex items-center gap-2">
              {exam.totalCost > 0 && (
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 bg-emerald-50">
                  {formatCurrency(exam.totalCost)}
                </Badge>
              )}
              <Badge variant="outline" className="border-primary/40 text-primary">
                {formatDate(exam.createAt)}
              </Badge>
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
        );
      })}
    </CardContent>
  </Card>
  );
};

// Helper function to calculate cost from services and prescriptions (same as in NurseContent)
const calculatePhaseCost = (phase: TreatmentPhase): number | null => {
  const services = phase.listDentalServicesEntityOrder || [];
  const prescriptions = phase.listPrescriptionOrder || [];
  
  // If no services and prescriptions, return null to use phase.cost
  if (services.length === 0 && prescriptions.length === 0) {
    return null;
  }

  const calculateServiceCost = (service: typeof services[0]) => {
    if (service.cost && service.cost > 0) {
      return service.cost;
    }
    return (service.quantity || 0) * (service.unitPrice || 0);
  };

  const calculatePrescriptionCost = (prescription: typeof prescriptions[0]) => {
    if (prescription.cost && prescription.cost > 0) {
      return prescription.cost;
    }
    return (prescription.quantity || 0) * (prescription.unitPrice || 0);
  };

  const servicesTotal = services.reduce((sum, item) => sum + calculateServiceCost(item), 0);
  const prescriptionsTotal = prescriptions.reduce((sum, item) => sum + calculatePrescriptionCost(item), 0);
  return servicesTotal + prescriptionsTotal;
};

const TreatmentBoard: React.FC<{
  plans: TreatmentPlan[];
  phasesByPlan: Record<string, TreatmentPhase[]>;
  examinations: ExaminationSummary[];
  onCreatePhase: (plan: TreatmentPlan) => void;
  onEditPhase: (plan: TreatmentPlan, phase: TreatmentPhase) => void;
  onCreatePlan: (examination?: ExaminationSummary) => void;
  onUpdatePlanStatus: (plan: TreatmentPlan, status: string) => void;
  onViewPlanDetail?: (plan: TreatmentPlan) => void;
}> = ({ plans, phasesByPlan, examinations, onCreatePhase, onEditPhase, onCreatePlan, onUpdatePlanStatus, onViewPlanDetail }) => {
  // Calculate total cost from phases for each plan (same as NurseContent)
  const planTotalCosts = useMemo(() => {
    const costsMap: Record<string, number> = {};
    
    plans.forEach((plan) => {
      const phases = phasesByPlan[plan.id] || [];
      const totalCostFromPhases = phases.reduce((sum, phase) => {
        const calculatedCost = calculatePhaseCost(phase);
        return sum + (calculatedCost || phase.cost || 0);
      }, 0);
      
      costsMap[plan.id] = totalCostFromPhases || plan.totalCost;
    });
    
    return costsMap;
  }, [plans, phasesByPlan]);
  return (
  <Card className="border-none bg-white/90 shadow-medium">
    <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <CardTitle className="text-lg">Phác đồ điều trị</CardTitle>
        <CardDescription>Kiểm soát tiến trình, chi phí & lịch tái khám</CardDescription>
      </div>
      <PermissionGuard permission="CREATE_TREATMENT_PLANS">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCreatePlan()}
          className="border-primary/40 text-primary hover:bg-primary/10"
        >
          + Tạo phác đồ mới
        </Button>
      </PermissionGuard>
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
          <div 
            key={plan.id} 
            className="rounded-2xl border border-border/70 bg-white/70 p-4 cursor-pointer hover:bg-white/90 transition-colors"
            onClick={() => onViewPlanDetail?.(plan)}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-foreground">{plan.title}</h3>
              <PermissionGuard permission="UPDATE_TREATMENT_PLANS">
                <select
                  value={plan.status}
                  onChange={(event) => {
                    event.stopPropagation();
                    onUpdatePlanStatus(plan, event.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-full border border-border/60 bg-white/70 px-3 py-1 text-xs"
                >
                {['Inprogress', 'Done', 'Paused', 'Cancelled'].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
                </select>
              </PermissionGuard>
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
                    <span className="text-primary font-semibold">{formatCurrency(planTotalCosts[plan.id] || plan.totalCost)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2 text-xs">
              {phases.map((phase) => (
                <PermissionGuard key={phase.id} permission="UPDATE_TREATMENT_PHASES">
                  <button
                    type="button"
                    className="rounded-2xl border border-primary/30 bg-primary/5 px-3 py-1.5 text-primary hover:bg-primary/10 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditPhase(plan, phase);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span>Giai đoạn {phase.phaseNumber}</span>
                      {phase.startDate && (
                        <span className="text-xs opacity-70">({formatDate(phase.startDate)})</span>
                      )}
                    </div>
                  </button>
                </PermissionGuard>
              ))}
              <PermissionGuard permission="CREATE_TREATMENT_PHASES">
                <button
                  type="button"
                  className="rounded-2xl border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreatePhase(plan);
                  }}
                >
                  + Thêm tiến trình
                </button>
              </PermissionGuard>
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
                        {formatCurrency(phases.reduce((sum, p) => {
                          const calculatedCost = calculatePhaseCost(p);
                          return sum + (calculatedCost || p.cost || 0);
                        }, 0))}
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
          <PermissionGuard permission="CREATE_TREATMENT_PLANS">
            <Button variant="outline" size="sm" onClick={() => onCreatePlan()}>
              Tạo phác đồ mới từ kết quả khám
            </Button>
          </PermissionGuard>
        </div>
      )}
    </CardContent>
  </Card>
  );
};

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

