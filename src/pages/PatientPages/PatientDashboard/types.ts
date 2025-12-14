export type Section =
  | 'overview'
  | 'basic'
  | 'initial'
  | 'plan'
  | 'payment'
  | 'appointment'
  | 'appointments'
  | 'account';

export interface PatientProfile {
  id?: string | number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  dob: string;
  emergencyContactName: string;
  emergencyPhoneNumber: string;
  bloodGroup: string;
  allergy: string;
  medicalHistory: string;
}

export interface PatientHeaderProps {
  profile?: PatientProfile | null;
  user?: any;
  activeSection: string;
  onLogout: () => void;
  onEditProfile: () => void;
  isLoading?: boolean;
}

export interface PatientSidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export interface PatientContentProps {
  activeSection: Section;
  patient: PatientProfile | null;
  user: any;
  loading: boolean;
  error: string | null;
  // Overview data
  appointmentCount: number;
  planCount: number;
  phaseCount: number;
  paymentCount: number;
  activities: Array<{ label: string; date: Date; color: string }>;
  lastVisit: string | null;
  nextAppointment: string | null;
  recentAppointments: Array<any>;
  allAppointments: Array<any>;
  treatments: Array<any>;
  // Appointments data
  appointmentFilter: 'all' | 'scheduled' | 'done' | 'cancel';
  appointmentPage: number;
  appointmentPageSize: number;
  onAppointmentFilterChange: (filter: 'all' | 'scheduled' | 'done' | 'cancel') => void;
  onAppointmentPageChange: (page: number) => void;
  // Treatment data
  treatmentFilter: 'all' | 'in-progress' | 'completed' | 'planned';
  treatmentPage: number;
  treatmentPageSize: number;
  onTreatmentFilterChange: (filter: 'all' | 'in-progress' | 'completed' | 'planned') => void;
  onTreatmentPageChange: (page: number) => void;
  // Prescriptions data
  prescriptions: Array<any>;
  prescriptionFilter: 'all' | 'active' | 'completed' | 'expired';
  prescriptionPage: number;
  prescriptionPageSize: number;
  onPrescriptionFilterChange: (filter: 'all' | 'active' | 'completed' | 'expired') => void;
  onPrescriptionPageChange: (page: number) => void;
  // Vitals data
  vitals: Array<any>;
  vitalsPage: number;
  vitalsPageSize: number;
  onVitalsPageChange: (page: number) => void;
  // Documents data
  documents: Array<any>;
  documentFilter: 'all' | 'xray' | 'report' | 'lab' | 'other';
  documentPage: number;
  documentPageSize: number;
  onDocumentFilterChange: (filter: 'all' | 'xray' | 'report' | 'lab' | 'other') => void;
  onDocumentPageChange: (page: number) => void;
  // Handlers
  onBookAppointment: () => void;
  onRefreshData: () => void;
}

export interface OverviewSectionProps {
  patient: PatientProfile | null;
  appointmentCount: number;
  planCount: number;
  phaseCount: number;
  paymentCount: number;
  activities: Array<{ label: string; date: Date; color: string }>;
  lastVisit: string | null;
  nextAppointment: string | null;
  recentAppointments: Array<any>;
  treatments: Array<any>;
  onBookAppointment: () => void;
}

export interface AppointmentFormProps {
  onBooked: () => void;
}

export interface AppointmentListProps {
  appointments: Array<any>;
  filter: 'all' | 'scheduled' | 'done' | 'cancel';
  page: number;
  pageSize: number;
  onFilterChange: (filter: 'all' | 'scheduled' | 'done' | 'cancel') => void;
  onPageChange: (page: number) => void;
  onBookNew: () => void;
}

export interface AccountPanelProps {
  patient: PatientProfile | null;
  user: any;
  editForm: any;
  onEditFormChange: (form: any) => void;
  onSave: () => void;
  saving: boolean;
}

