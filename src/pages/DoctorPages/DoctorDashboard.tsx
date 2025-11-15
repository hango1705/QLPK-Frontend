import React, { useMemo, useState } from 'react';
import { useQuery, useQueries, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { showNotification, Loading } from '@/components/ui';
import { doctorAPI } from '@/services';
import apiClient from '@/services/api/client';
import { queryKeys } from '@/services/queryClient';
import { useAuth } from '@/hooks';
import type { TreatmentPhase, TreatmentPlan } from '@/types/doctor';
import DoctorSidebar from './DoctorDashboard/components/DoctorSidebar';
import DoctorHeader from './DoctorDashboard/components/DoctorHeader';
import OverviewSection from './DoctorDashboard/components/OverviewSection';
import DoctorContent from './DoctorDashboard/components/DoctorContent';
import RightRail from './DoctorDashboard/components/RightRail';
import ExamDialog from './DoctorDashboard/components/modals/ExamDialog';
import TreatmentPhaseDialog from './DoctorDashboard/components/modals/TreatmentPhaseDialog';
import TreatmentPlanDialog from './DoctorDashboard/components/modals/TreatmentPlanDialog';
import ExaminationDetailDialog from './DoctorDashboard/components/modals/ExaminationDetailDialog';
import type { ExaminationSummary } from '@/types/doctor';
import type { TreatmentPlanFormState } from './DoctorDashboard/components/modals/TreatmentPlanDialog';
import { SECTION_CONFIG } from './DoctorDashboard/constants';
import {
  buildExaminationPayload,
  buildPhasePayload,
  parseDate,
  getNextAppointment,
  aggregatePhases,
} from './DoctorDashboard/utils';
import type {
  Section,
  ExamDialogState,
  PhaseDialogState,
  ExaminationFormState,
  TreatmentPhaseFormState,
} from './DoctorDashboard/types';

const DoctorDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [examDialog, setExamDialog] = useState<ExamDialogState | null>(null);
  const [phaseDialog, setPhaseDialog] = useState<PhaseDialogState | null>(null);
  const [planDialog, setPlanDialog] = useState<{ open: boolean; examination?: ExaminationSummary }>({ open: false });
  const [examDetailDialog, setExamDetailDialog] = useState<ExaminationSummary | null>(null);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const queryClient = useQueryClient();
  const { logout } = useAuth();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: queryKeys.doctor.profile,
    queryFn: doctorAPI.getMyProfile,
  });

  const { data: scheduledAppointments = [], isLoading: loadingScheduled } = useQuery({
    queryKey: queryKeys.doctor.appointments('scheduled'),
    queryFn: () => doctorAPI.getMyAppointments('scheduled'),
  });

  const { data: allAppointments = [], isLoading: loadingAppointments } = useQuery({
    queryKey: queryKeys.doctor.appointments('all'),
    queryFn: () => doctorAPI.getMyAppointments('all'),
  });

  const { data: examinations = [], isLoading: loadingExaminations } = useQuery({
    queryKey: queryKeys.doctor.examinations,
    queryFn: doctorAPI.getMyExaminations,
  });

  const { data: treatmentPlans = [], isLoading: loadingPlans } = useQuery({
    queryKey: queryKeys.doctor.treatmentPlans,
    queryFn: doctorAPI.getMyTreatmentPlans,
  });

  const phaseQueries = useQueries({
    queries: (treatmentPlans ?? []).map((plan) => ({
      queryKey: queryKeys.doctor.treatmentPhases(plan.id),
      queryFn: () => doctorAPI.getTreatmentPhases(plan.id),
      enabled: !!plan.id,
    })),
  }) as UseQueryResult<TreatmentPhase[]>[];

  const phasesByPlan = useMemo<Record<string, TreatmentPhase[]>>(() => {
    const results: Record<string, TreatmentPhase[]> = {};
    treatmentPlans?.forEach((plan, index) => {
      results[plan.id] = phaseQueries[index]?.data ?? [];
    });
    return results;
  }, [treatmentPlans, phaseQueries]);

  const { data: serviceCategories = [] } = useQuery({
    queryKey: queryKeys.services.categories,
    queryFn: doctorAPI.getDentalCategories,
  });

  const { data: services = [] } = useQuery({
    queryKey: queryKeys.services.all,
    queryFn: doctorAPI.getDentalServices,
  });

  const { data: prescriptionCatalog = [] } = useQuery({
    queryKey: queryKeys.doctor.catalog,
    queryFn: doctorAPI.getPrescriptionCatalog,
  });

  const { data: doctorDirectory = [] } = useQuery({
    queryKey: queryKeys.doctor.doctorDirectory,
    queryFn: doctorAPI.getDoctorDirectory,
  });

  const createExamMutation = useMutation({
    mutationFn: ({
      appointmentId,
      payload,
    }: {
      appointmentId: string;
      payload: Parameters<typeof doctorAPI.createExamination>[1];
    }) => doctorAPI.createExamination(appointmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctor.examinations });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctor.appointments('all') });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctor.appointments('scheduled') });
      showNotification.success('Đã lưu kết quả khám');
      setExamDialog(null);
    },
    onError: (error: any) => {
      showNotification.error('Không thể lưu kết quả khám', error?.message || 'Đã xảy ra lỗi');
    },
  });

  const updateExamMutation = useMutation({
    mutationFn: ({
      examinationId,
      payload,
    }: {
      examinationId: string;
      payload: Parameters<typeof doctorAPI.updateExamination>[1];
    }) => doctorAPI.updateExamination(examinationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctor.examinations });
      showNotification.success('Đã cập nhật kết quả khám');
      setExamDialog(null);
    },
    onError: (error: any) => {
      showNotification.error('Không thể cập nhật kết quả khám', error?.message || 'Đã xảy ra lỗi');
    },
  });

  const createPhaseMutation = useMutation({
    mutationFn: ({
      planId,
      payload,
    }: {
      planId: string;
      payload: Parameters<typeof doctorAPI.createTreatmentPhase>[1];
    }) => doctorAPI.createTreatmentPhase(planId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctor.treatmentPhases(variables.planId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctor.treatmentPlans });
      showNotification.success('Đã thêm tiến trình điều trị');
      setPhaseDialog(null);
    },
    onError: (error: any) => {
      showNotification.error('Không thể thêm tiến trình', error?.message || 'Đã xảy ra lỗi');
    },
  });

  const updatePhaseMutation = useMutation({
    mutationFn: ({
      phaseId,
      planId,
      payload,
    }: {
      phaseId: string;
      planId: string;
      payload: Parameters<typeof doctorAPI.updateTreatmentPhase>[1];
    }) => doctorAPI.updateTreatmentPhase(phaseId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.doctor.treatmentPhases(variables.planId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctor.treatmentPlans });
      showNotification.success('Đã cập nhật tiến trình');
      setPhaseDialog(null);
    },
    onError: (error: any) => {
      showNotification.error('Không thể cập nhật tiến trình', error?.message || 'Đã xảy ra lỗi');
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({
      planId,
      payload,
    }: {
      planId: string;
      payload: Parameters<typeof doctorAPI.updateTreatmentPlan>[1];
    }) => doctorAPI.updateTreatmentPlan(planId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctor.treatmentPlans });
      showNotification.success('Đã cập nhật phác đồ');
    },
    onError: (error: any) => {
      showNotification.error('Không thể cập nhật phác đồ', error?.message || 'Đã xảy ra lỗi');
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: (payload: TreatmentPlanFormState) => doctorAPI.createTreatmentPlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctor.treatmentPlans });
      showNotification.success('Đã tạo phác đồ điều trị');
      setPlanDialog({ open: false });
    },
    onError: (error: any) => {
      showNotification.error('Không thể tạo phác đồ', error?.message || 'Đã xảy ra lỗi');
    },
  });

  const handleExamSubmit = (formValues: ExaminationFormState, context: ExamDialogState) => {
    const payload = buildExaminationPayload(formValues);
    if (context.mode === 'create' && context.appointment) {
      createExamMutation.mutate({ appointmentId: context.appointment.id, payload });
    } else if (context.mode === 'update' && context.examination) {
      updateExamMutation.mutate({ examinationId: context.examination.id, payload });
    }
  };

  const handlePhaseSubmit = (formValues: TreatmentPhaseFormState, context: PhaseDialogState) => {
    const payload = buildPhasePayload(formValues);
    if (context.mode === 'create') {
      createPhaseMutation.mutate({ planId: context.plan.id, payload });
    } else if (context.mode === 'update' && context.phase) {
      updatePhaseMutation.mutate({ phaseId: context.phase.id, planId: context.plan.id, payload });
    }
  };

  const handlePlanStatusChange = (plan: TreatmentPlan, status: string) => {
    updatePlanMutation.mutate({
      planId: plan.id,
      payload: {
        title: plan.title,
        description: plan.description,
        duration: plan.duration,
        notes: plan.notes,
        status,
      },
    });
  };

  const handleLogout = async () => {
    try {
      await apiClient.post('/api/v1/auth/logout', {});
    } catch (error) {
      console.error('Logout request failed', error);
    } finally {
      logout();
    }
  };

  const nextAppointment = useMemo(() => getNextAppointment(scheduledAppointments), [scheduledAppointments]);
  const doneAppointments = useMemo(
    () => allAppointments.filter((app) => app.status?.toLowerCase() === 'done'),
    [allAppointments],
  );
  const cancelledAppointments = useMemo(
    () => allAppointments.filter((app) => app.status?.toLowerCase() === 'cancel'),
    [allAppointments],
  );
  const activePhases = useMemo(() => aggregatePhases(treatmentPlans, phasesByPlan), [treatmentPlans, phasesByPlan]);

  const isLoadingPage =
    loadingProfile || loadingScheduled || loadingAppointments || loadingExaminations || loadingPlans;

  return (
    <div className="flex min-h-screen bg-gradient-fresh text-foreground">
      <DoctorSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onCreateExam={() => {
          if (scheduledAppointments.length) {
            setExamDialog({ mode: 'create', appointment: scheduledAppointments[0] });
          } else {
            showNotification.info('Chưa có lịch hẹn nào để tạo kết quả khám');
          }
        }}
        isCollapsed={isNavCollapsed}
        onToggleCollapse={() => setIsNavCollapsed((prev) => !prev)}
        scheduledCount={scheduledAppointments.length}
      />

      <div className="flex flex-1 flex-col">
        <DoctorHeader
          profile={profile}
          activeSection={SECTION_CONFIG[activeSection].label}
          scheduledCount={scheduledAppointments.length}
          onLogout={handleLogout}
        />

        <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 lg:px-6">
          {isLoadingPage ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loading size="lg" />
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-6">
                {activeSection === 'overview' ? (
                  <OverviewSection
                    nextAppointment={nextAppointment}
                    scheduledAppointments={scheduledAppointments}
                    doneAppointments={doneAppointments}
                    cancelledAppointments={cancelledAppointments}
                    examinations={examinations}
                    treatmentPlans={treatmentPlans}
                    activePhases={activePhases}
                    onCreateExam={() => {
                      if (scheduledAppointments.length) {
                        setExamDialog({ mode: 'create', appointment: scheduledAppointments[0] });
                      }
                    }}
                    onCreatePhase={(plan) => setPhaseDialog({ mode: 'create', plan })}
                  />
                ) : (
                  <DoctorContent
                    activeSection={activeSection}
                    appointments={allAppointments}
                    scheduledAppointments={scheduledAppointments}
                    examinations={examinations}
                    treatmentPlans={treatmentPlans}
                    phasesByPlan={phasesByPlan}
                    serviceCategories={serviceCategories}
                    services={services}
                    prescriptions={prescriptionCatalog}
                    doctors={doctorDirectory}
                    onCreateExam={(appointment) => setExamDialog({ mode: 'create', appointment })}
                    onEditExam={(examination) => setExamDialog({ mode: 'update', examination })}
                    onViewExamDetail={(examination) => setExamDetailDialog(examination)}
                    onCreatePhase={(plan) => setPhaseDialog({ mode: 'create', plan })}
                    onEditPhase={(plan, phase) => setPhaseDialog({ mode: 'update', plan, phase })}
                    onCreatePlan={(examination) => setPlanDialog({ open: true, examination })}
                    onUpdatePlanStatus={handlePlanStatusChange}
                  />
                )}
              </div>

              <RightRail
                nextAppointment={nextAppointment}
                scheduledAppointments={scheduledAppointments}
                treatmentPlans={treatmentPlans}
                serviceCategories={serviceCategories}
                onQuickExam={(appointment) => setExamDialog({ mode: 'create', appointment })}
                onQuickPhase={(plan) => setPhaseDialog({ mode: 'create', plan })}
              />
            </div>
          )}
        </main>
      </div>

      <ExamDialog
        open={!!examDialog}
        context={examDialog}
        services={services}
        prescriptions={prescriptionCatalog}
        onOpenChange={(open) => !open && setExamDialog(null)}
        onSubmit={handleExamSubmit}
        isLoading={createExamMutation.isPending || updateExamMutation.isPending}
      />

      <TreatmentPhaseDialog
        open={!!phaseDialog}
        context={phaseDialog}
        services={services}
        prescriptions={prescriptionCatalog}
        onOpenChange={(open) => !open && setPhaseDialog(null)}
        onSubmit={handlePhaseSubmit}
        isLoading={createPhaseMutation.isPending || updatePhaseMutation.isPending}
      />

      <TreatmentPlanDialog
        open={planDialog.open}
        examination={planDialog.examination}
        examinations={examinations}
        onOpenChange={(open) => setPlanDialog({ open, examination: undefined })}
        onSubmit={(form) => createPlanMutation.mutate(form)}
        isLoading={createPlanMutation.isPending}
      />

      <ExaminationDetailDialog
        open={!!examDetailDialog}
        examination={examDetailDialog}
        onOpenChange={(open) => !open && setExamDetailDialog(null)}
        onEdit={(exam) => {
          setExamDetailDialog(null);
          setExamDialog({ mode: 'update', examination: exam });
        }}
      />
    </div>
  );
};

export default DoctorDashboard;
