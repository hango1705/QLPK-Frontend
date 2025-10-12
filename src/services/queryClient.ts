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
  
  // Notification queries
  notifications: {
    all: (userId: string) => ['notifications', userId] as const,
    unread: (userId: string) => ['notifications', userId, 'unread'] as const,
  },
} as const;
