import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Loading } from '@/components/ui';
import { nurseAPI } from '@/services';
import apiClient, { cancelAllPendingRequests, resetLogoutState, isLogoutInProgress } from '@/services/api/client';
import { queryKeys } from '@/services/queryClient';
import { useAuth, usePermission } from '@/hooks';
import type { TreatmentPlan, AppointmentSummary, DoctorSummary } from '@/types/doctor';
import type { PatientResponse } from '@/services/api/patient';
import NurseSidebar from './components/NurseSidebar';
import NurseHeader from './components/NurseHeader';
import OverviewSection from './components/OverviewSection';
import NurseContent from './components/NurseContent';
import AppointmentDetailDialog from './components/AppointmentDetailDialog';
import { SECTION_CONFIG } from './constants';
import type { Section } from './types';

const NurseDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | undefined>();
  const [appointmentDetailDialog, setAppointmentDetailDialog] = useState<{
    open: boolean;
    appointment: AppointmentSummary | null;
  }>({
    open: false,
    appointment: null,
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout, isAuthenticated, token } = useAuth();

  // Get current user info (we'll use adminAPI.getMyInfo which should work for nurse too)
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: queryKeys.admin.profile,
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/users/myInfo');
      return response.data?.result || response.data;
    },
    enabled: isAuthenticated && !!token,
  });

  // Get nurse info if profile has nurseId
  const nurseId = (profile as any)?.nurse?.id || (profile as any)?.nurseId;
  const { hasPermission } = usePermission();
  const canGetInfoNurse = hasPermission('GET_INFO_NURSE');
  const canPickNurse = hasPermission('PICK_NURSE');
  const canPickDoctor = hasPermission('PICK_DOCTOR');
  const { data: nurseInfo } = useQuery({
    queryKey: queryKeys.nurse.profile(nurseId || ''),
    queryFn: () => nurseAPI.getNurseInfo(nurseId!),
    enabled: !!nurseId && canGetInfoNurse,
  });

  // Get treatment plans
  const { data: treatmentPlans = [], isLoading: loadingPlans } = useQuery({
    queryKey: queryKeys.nurse.treatmentPlans,
    queryFn: nurseAPI.getMyTreatmentPlans,
    enabled: isAuthenticated && !!token,
  });

  // Get all doctors - only if nurse has PICK_DOCTOR permission
  const { data: doctors = [], isLoading: loadingDoctors } = useQuery({
    queryKey: queryKeys.nurse.doctors,
    queryFn: nurseAPI.getAllDoctors,
    enabled: isAuthenticated && !!token && canPickDoctor, // Only fetch if nurse has permission
    retry: false, // Don't retry on 401
  });

  // Get all appointments from all doctors
  // Note: getAllAppointments calls getAllAppointmentOfDoctor which now allows NURSE role
  const { data: allAppointments = [], isLoading: loadingAllAppointments } = useQuery({
    queryKey: queryKeys.nurse.allAppointments,
    queryFn: () => nurseAPI.getAllAppointments(),
    enabled: doctors.length > 0, // Only fetch if doctors are available
    retry: false, // Don't retry on 401
  });

  // Filter appointments by selected doctor if any
  const appointments = useMemo(() => {
    if (!selectedDoctorId) {
      return allAppointments;
    }
    // Filter by doctorId - backend always returns doctorId in AppointmentResponse
    // Use strict equality check to ensure exact match
    return allAppointments.filter((app) => {
      // Primary: Check if appointment has doctorId and it matches selectedDoctorId
      if (app.doctorId && app.doctorId === selectedDoctorId) {
        return true;
      }
      // Fallback: If no doctorId, try matching by doctorFullName
      if (!app.doctorId && app.doctorFullName) {
        const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);
        if (selectedDoctor && app.doctorFullName === selectedDoctor.fullName) {
          return true;
        }
      }
      // If appointment has neither doctorId nor doctorFullName, exclude it
      return false;
    });
  }, [allAppointments, selectedDoctorId, doctors]);

  // Extract unique patient IDs from treatment plans and appointments
  const patientIds = useMemo(() => {
    const ids = new Set<string>();
    
    // Extract from treatment plans
    treatmentPlans.forEach((plan) => {
      if ((plan as any).patientId) {
        ids.add((plan as any).patientId);
      }
    });
    
    // Extract from appointments (if they have patientId)
    allAppointments.forEach((appointment) => {
      if ((appointment as any).patientId) {
        ids.add((appointment as any).patientId);
      }
    });
    
    return Array.from(ids);
  }, [treatmentPlans, allAppointments]);

  // Fetch patient details for all unique patient IDs
  const patientQueries = useQuery({
    queryKey: ['nurse', 'patients', patientIds.sort().join(',')],
    queryFn: async () => {
      const patientPromises = patientIds.map((patientId) =>
        nurseAPI.getPatientById(patientId).catch(() => null)
      );
      const patientResults = await Promise.all(patientPromises);
      return patientResults.filter((p): p is PatientResponse => p !== null);
    },
    enabled: patientIds.length > 0,
  });

  const patients = patientQueries.data || [];

  const handleLogout = async () => {
    // Prevent multiple simultaneous logout calls
    if (isLogoutInProgress()) {
      return;
    }
    
    // Save token before clearing state
    const currentToken = token;
    
    if (!currentToken) {
      // No token, just clear state and navigate
      queryClient.cancelQueries();
      queryClient.clear();
      logout();
      navigate('/login');
      return;
    }
    
    // Set logout flag FIRST to block all new requests
    cancelAllPendingRequests(); // This sets isLoggingOut = true
    
    // Cancel all active queries to prevent new requests
    queryClient.cancelQueries();
    
    // Clear all queries to prevent any new requests
    queryClient.clear();
    
    try {
      // Send logout request BEFORE clearing token
      await apiClient.post('/api/v1/auth/logout', { token: currentToken });
    } catch (error: any) {
      // Ignore logout errors - still clear local state
      // 401/400 is expected if token was already invalidated or invalid
      if (error?.response?.status !== 401 && error?.response?.status !== 400 && error?.message !== 'Logout request already in progress for this token' && error?.message !== 'Logout in progress, request cancelled') {
        // Logout request failed, but error is expected (401/400)
      }
    } finally {
      // Clear token AFTER logout request is sent
      logout();
      
      // Reset logout state
      resetLogoutState();
      
      // Small delay to ensure state is cleared before navigation
      setTimeout(() => {
        navigate('/login');
      }, 100);
    }
  };

  const handleDoctorSelect = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
  };

  const handleDoctorClick = (doctorId: string) => {
    // This will trigger the dialog in NurseContent
  };

  const isLoadingPage = loadingProfile || loadingPlans || loadingDoctors || loadingAllAppointments || patientQueries.isLoading;

  return (
    <div className="flex min-h-screen bg-gradient-fresh text-foreground">
      <NurseSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isCollapsed={isNavCollapsed}
        onToggleCollapse={() => setIsNavCollapsed((prev) => !prev)}
      />

      <div className="flex flex-1 flex-col">
        <NurseHeader
          profile={profile}
          nurseInfo={nurseInfo}
          activeSection={SECTION_CONFIG[activeSection].label}
          onLogout={handleLogout}
        />

        <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 lg:px-6">
          {isLoadingPage ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loading size="lg" />
            </div>
          ) : (
            <>
              {activeSection === 'overview' ? (
                <OverviewSection
                  treatmentPlans={treatmentPlans}
                  appointments={appointments}
                  doctors={doctors}
                />
              ) : (
                <NurseContent
                  activeSection={activeSection}
                  treatmentPlans={treatmentPlans}
                  appointments={appointments}
                  patients={patients}
                  doctors={doctors}
                  selectedDoctorId={selectedDoctorId}
                  onDoctorSelect={handleDoctorSelect}
                  onDoctorClick={handleDoctorClick}
                  onViewAppointmentDetail={(appointment) => {
                    // Find the latest appointment from the appointments array to ensure we have the most up-to-date data
                    const latestAppointment = appointments.find((apt) => apt.id === appointment.id) || appointment;
                    setAppointmentDetailDialog({
                      open: true,
                      appointment: latestAppointment,
                    });
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Appointment Detail Dialog */}
      <AppointmentDetailDialog
        open={appointmentDetailDialog.open}
        appointment={appointmentDetailDialog.appointment}
        onOpenChange={(open) => {
          setAppointmentDetailDialog({
            open,
            appointment: open ? appointmentDetailDialog.appointment : null,
          });
        }}
        onAppointmentUpdated={(updatedAppointment) => {
          setAppointmentDetailDialog((prev) => ({
            ...prev,
            appointment: updatedAppointment,
          }));
        }}
      />
    </div>
  );
};

export default NurseDashboard;

