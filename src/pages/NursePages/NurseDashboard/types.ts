import type {
  AppointmentSummary,
  DoctorSummary,
  TreatmentPlan,
} from '@/types/doctor';
import type { PatientResponse } from '@/services/api/patient';
import type { NurseInfo } from '@/services/api/nurse';

export type Section = 'overview' | 'treatment' | 'appointments' | 'patients' | 'doctors' | 'profile' | 'account';

export interface NurseHeaderProps {
  profile?: { fullName?: string; username?: string };
  nurseInfo?: NurseInfo;
  activeSection: string;
  onLogout: () => void;
}

export interface NurseSidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

export interface OverviewSectionProps {
  treatmentPlans: TreatmentPlan[];
  appointments: AppointmentSummary[];
  doctors: DoctorSummary[];
}

export interface ContentSectionProps {
  activeSection: Section;
  treatmentPlans: TreatmentPlan[];
  appointments: AppointmentSummary[];
  patients: PatientResponse[];
  doctors: DoctorSummary[];
  selectedDoctorId?: string;
  onDoctorSelect?: (doctorId: string) => void;
  onDoctorClick?: (doctorId: string) => void;
  onAppointmentClick?: (appointment: AppointmentSummary) => void;
  onRecordExamination?: (appointment: AppointmentSummary) => void;
  onViewAppointmentDetail?: (appointment: AppointmentSummary) => void;
}

