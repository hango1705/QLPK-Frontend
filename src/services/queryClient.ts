import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 408, 429
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          if (error?.response?.status === 408 || error?.response?.status === 429) {
            return failureCount < 2;
          }
          return false;
        }
        // Retry on 5xx errors and network errors
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});

// Query keys factory
export const queryKeys = {
  // Auth queries
  auth: {
    currentUser: ['auth', 'currentUser'] as const,
  },
  
  // User queries
  user: {
    profile: (userId: string) => ['user', 'profile', userId] as const,
    appointments: (userId: string) => ['user', 'appointments', userId] as const,
  },
  
  // Appointment queries
  appointments: {
    all: ['appointments'] as const,
    byId: (id: string) => ['appointments', id] as const,
    byDate: (date: string) => ['appointments', 'byDate', date] as const,
    byDoctor: (doctorId: string) => ['appointments', 'byDoctor', doctorId] as const,
  },
  
  // Doctor queries
  doctors: {
    all: ['doctors'] as const,
    byId: (id: string) => ['doctors', id] as const,
    specialties: ['doctors', 'specialties'] as const,
  },
  
  // Service queries
  services: {
    all: ['services'] as const,
    byId: (id: string) => ['services', id] as const,
    categories: ['services', 'categories'] as const,
  },

  // Doctor workspace queries
  doctor: {
    profile: ['doctor', 'profile'] as const,
    appointments: (scope: string) => ['doctor', 'appointments', scope] as const,
    examinations: ['doctor', 'examinations'] as const,
    examinationDetail: (id: string) => ['doctor', 'examination', id] as const,
    examinationByAppointment: (appointmentId: string) => ['doctor', 'examination', 'byAppointment', appointmentId] as const,
    treatmentPlans: ['doctor', 'treatmentPlans'] as const,
    treatmentPhases: (planId: string) => ['doctor', 'treatmentPhases', planId] as const,
    catalog: ['doctor', 'catalog'] as const,
    doctorDirectory: ['doctor', 'directory'] as const,
  },
  
  // Notification queries
  notifications: {
    all: (userId: string) => ['notifications', userId] as const,
    unread: (userId: string) => ['notifications', userId, 'unread'] as const,
  },

  // Admin queries
  admin: {
    profile: ['admin', 'profile'] as const,
    users: ['admin', 'users'] as const,
    user: (userId: string) => ['admin', 'user', userId] as const,
    roles: ['admin', 'roles'] as const,
    permissions: ['admin', 'permissions'] as const,
    auditLogs: ['admin', 'auditLogs'] as const,
    categories: ['admin', 'categories'] as const,
    services: ['admin', 'services'] as const,
    prescriptions: ['admin', 'prescriptions'] as const,
  },

  // Patient queries
  patient: {
    byId: (patientId: string) => ['patient', patientId] as const,
    myInfo: ['patient', 'myInfo'] as const,
    bookingDateTime: (doctorId: string) => ['patient', 'bookingDateTime', doctorId] as const,
    treatmentPlans: (patientId: string) => ['patient', 'treatmentPlans', patientId] as const,
    costs: ['patient', 'costs'] as const,
  },

  // Nurse queries
  nurse: {
    profile: (nurseId: string) => ['nurse', 'profile', nurseId] as const,
    nursesForPick: ['nurse', 'pick'] as const,
    appointmentsByDoctor: (doctorId: string) => ['nurse', 'appointments', 'doctor', doctorId] as const,
    allAppointments: ['nurse', 'appointments', 'all'] as const,
    treatmentPlans: ['nurse', 'treatmentPlans'] as const,
    patient: (patientId: string) => ['nurse', 'patient', patientId] as const,
    doctors: ['nurse', 'doctors'] as const,
    doctor: (doctorId: string) => ['nurse', 'doctor', doctorId] as const,
  },
} as const;
