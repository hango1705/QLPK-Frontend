import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loading } from '@/components/ui';
import { nurseAPI } from '@/services';
import apiClient from '@/services/api/client';
import { queryKeys } from '@/services/queryClient';
import { useAuth } from '@/hooks';
import type { TreatmentPlan, AppointmentSummary, DoctorSummary } from '@/types/doctor';
import type { PatientResponse } from '@/services/api/patient';
import NurseSidebar from './components/NurseSidebar';
import NurseHeader from './components/NurseHeader';
import OverviewSection from './components/OverviewSection';
import NurseContent from './components/NurseContent';
import { SECTION_CONFIG } from './constants';
import type { Section } from './types';

const NurseDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | undefined>();
  const { logout } = useAuth();

  // Get current user info (we'll use adminAPI.getMyInfo which should work for nurse too)
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: queryKeys.admin.profile,
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/users/myInfo');
      return response.data?.result || response.data;
    },
  });

  // Get nurse info if profile has nurseId
  const nurseId = (profile as any)?.nurse?.id || (profile as any)?.nurseId;
  const { data: nurseInfo } = useQuery({
    queryKey: queryKeys.nurse.profile(nurseId || ''),
    queryFn: () => nurseAPI.getNurseInfo(nurseId!),
    enabled: !!nurseId,
  });

  // Get treatment plans
  const { data: treatmentPlans = [], isLoading: loadingPlans } = useQuery({
    queryKey: queryKeys.nurse.treatmentPlans,
    queryFn: nurseAPI.getMyTreatmentPlans,
  });

  // Get all doctors
  const { data: doctors = [], isLoading: loadingDoctors } = useQuery({
    queryKey: queryKeys.nurse.doctors,
    queryFn: nurseAPI.getAllDoctors,
  });

  // Get all appointments from all doctors
  const { data: allAppointments = [], isLoading: loadingAllAppointments } = useQuery({
    queryKey: queryKeys.nurse.allAppointments,
    queryFn: () => nurseAPI.getAllAppointments(),
    enabled: doctors.length > 0,
  });

  // Filter appointments by selected doctor if any
  const appointments = useMemo(() => {
    if (!selectedDoctorId) {
      return allAppointments;
    }
    const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);
    if (!selectedDoctor) {
      return allAppointments;
    }
    return allAppointments.filter((app) => app.doctorFullName === selectedDoctor.fullName);
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
    try {
      await apiClient.post('/api/v1/auth/logout', {});
    } catch (error) {
      console.error('Logout request failed', error);
    } finally {
      logout();
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
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default NurseDashboard;

