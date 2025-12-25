import type {
  AppointmentSummary,
  DentalService,
  DentalServiceOrder,
  ExaminationSummary,
  PrescriptionItem,
  PrescriptionOrder,
  TreatmentPhase,
  TreatmentPlan,
} from '@/types/doctor';

export type Section =
  | 'overview'
  | 'appointments'
  | 'doctors'
  | 'nurses'
  | 'examinations'
  | 'treatment'
  | 'catalog'
  | 'insights'
  | 'patients'
  | 'profile'
  | 'account';

export interface ExamDialogState {
  mode: 'create' | 'update';
  appointment?: AppointmentSummary;
  examination?: ExaminationSummary;
}

export interface PhaseDialogState {
  mode: 'create' | 'update';
  plan: TreatmentPlan;
  phase?: TreatmentPhase;
}

export interface ExaminationFormState {
  symptoms: string;
  diagnosis: string;
  notes: string;
  treatment: string;
  totalCost: number;
  serviceOrders: DentalServiceOrder[];
  prescriptionOrders: PrescriptionOrder[];
  xrayFiles: File[];
  faceFiles: File[];
  teethFiles: File[];
  removeImageIds?: string[];
}

export interface TreatmentPhaseFormState {
  phaseNumber: string;
  description: string;
  procedure: string; // Thủ thuật bác sĩ làm ngày hôm đó
  startDate: string;
  endDate: string;
  cost: number;
  status?: string;
  nextAppointmentDate?: string;
  nextAppointmentTime?: string;
  serviceOrders: DentalServiceOrder[];
  prescriptionOrders: PrescriptionOrder[];
  xrayFiles: File[];
  faceFiles: File[];
  teethFiles: File[];
  removeImageIds?: string[];
}

export interface DoctorHeaderProps {
  profile?: { fullName?: string; username?: string };
  activeSection: string;
  onLogout: () => void;
}

export interface DoctorSidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  onCreateExam: () => void;
}

export interface OverviewSectionProps {
  nextAppointment?: AppointmentSummary;
  scheduledAppointments: AppointmentSummary[];
  doneAppointments: AppointmentSummary[];
  cancelledAppointments: AppointmentSummary[];
  examinations: ExaminationSummary[];
  treatmentPlans: TreatmentPlan[];
  activePhases: TreatmentPhase[];
  phasesByPlan?: Record<string, TreatmentPhase[]>;
  paidCosts?: Array<{ id: string; totalCost: number; status: string }>;
  onCreateExam: () => void;
  onCreatePhase: (plan: TreatmentPlan) => void;
}

export interface ContentSectionProps {
  activeSection: Section;
  appointments: AppointmentSummary[];
  scheduledAppointments: AppointmentSummary[];
  examinations: ExaminationSummary[];
  treatmentPlans: TreatmentPlan[];
  phasesByPlan: Record<string, TreatmentPhase[]>;
  serviceCategories: { id: string; name: string; listDentalServiceEntity: DentalService[] }[];
  services: DentalService[];
  prescriptions: PrescriptionItem[];
  doctors?: any[];
  nurses?: any[];
  isLoadingNurses?: boolean;
  examinationCosts?: Record<string, { totalCost: number; status: string }>;
  onCreateExam: (appointment: AppointmentSummary) => void;
  onEditExam: (examination: ExaminationSummary) => void;
  onViewExamDetail: (examination: ExaminationSummary) => void;
  onCreatePhase: (plan: TreatmentPlan) => void;
  onEditPhase: (plan: TreatmentPlan, phase: TreatmentPhase) => void;
  onCreatePlan: (examination?: ExaminationSummary) => void;
  onUpdatePlanStatus: (plan: TreatmentPlan, status: string) => void;
  onViewPlanDetail?: (plan: TreatmentPlan) => void;
  onPhaseClick?: (planId: string, phaseId: string) => void;
  onAddPhase?: () => void;
  onViewAppointmentDetail?: (appointment: AppointmentSummary) => void;
}

export interface RightRailProps {
  nextAppointment?: AppointmentSummary;
  scheduledAppointments: AppointmentSummary[];
  treatmentPlans: TreatmentPlan[];
  serviceCategories: { id: string; name: string; listDentalServiceEntity: DentalService[] }[];
  onQuickExam: (appointment: AppointmentSummary) => void;
  onQuickPhase: (plan: TreatmentPlan) => void;
}

