import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueries, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { showNotification, Loading } from '@/components/ui';
import { doctorAPI, nurseAPI } from '@/services';
import type { NurseInfo, NursePick } from '@/services/api/nurse';
import apiClient, { cancelAllPendingRequests, resetLogoutState, isLogoutInProgress } from '@/services/api/client';
import { queryKeys } from '@/services/queryClient';
import { useAuth, usePermission } from '@/hooks';
import type { TreatmentPhase, TreatmentPlan } from '@/types/doctor';
import DoctorSidebar from './DoctorDashboard/components/DoctorSidebar';
import DoctorHeader from './DoctorDashboard/components/DoctorHeader';
import OverviewSection from './DoctorDashboard/components/OverviewSection';
import DoctorContent from './DoctorDashboard/components/DoctorContent';
import ProfileSection from './DoctorDashboard/components/ProfileSection';
import AccountSection from './DoctorDashboard/components/AccountSection';
import ExamDialog from './DoctorDashboard/components/modals/ExamDialog';
import TreatmentPhaseDialog from './DoctorDashboard/components/modals/TreatmentPhaseDialog';
import TreatmentPlanDialog from './DoctorDashboard/components/modals/TreatmentPlanDialog';
import ExaminationDetailDialog from './DoctorDashboard/components/modals/ExaminationDetailDialog';
import TreatmentPhaseDetailDialog from './DoctorDashboard/components/modals/TreatmentPhaseDetailDialog';
import TreatmentPlanDetailDialog from './DoctorDashboard/components/modals/TreatmentPlanDetailDialog';
import AppointmentDetailDialog from './DoctorDashboard/components/modals/AppointmentDetailDialog';
import type { ExaminationSummary, AppointmentSummary } from '@/types/doctor';
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
  const [planDialog, setPlanDialog] = useState<{ open: boolean; examination?: ExaminationSummary; plan?: TreatmentPlan }>({ open: false });
  const [examDetailDialog, setExamDetailDialog] = useState<ExaminationSummary | null>(null);
  const [phaseDetailDialog, setPhaseDetailDialog] = useState<{ phase: TreatmentPhase; plan: TreatmentPlan } | null>(null);
  const [planDetailDialog, setPlanDetailDialog] = useState<TreatmentPlan | null>(null);
  const [appointmentDetailDialog, setAppointmentDetailDialog] = useState<AppointmentSummary | null>(null);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { logout, isAuthenticated, token } = useAuth();
  const { hasPermission } = usePermission();
  const canGetAllTreatmentPhases = hasPermission('GET_ALL_TREATMENT_PHASES');
  const canPickDoctor = hasPermission('PICK_DOCTOR');
  const canViewCosts = hasPermission('UPDATE_PAYMENT_COST');

  const { data: profile, isLoading: loadingProfile, error: profileError } = useQuery({
    queryKey: queryKeys.doctor.profile,
    queryFn: doctorAPI.getMyProfile,
    enabled: isAuthenticated && !!token,
    retry: 1,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  const { data: scheduledAppointmentsRaw = [], isLoading: loadingScheduled, error: scheduledError } = useQuery({
    queryKey: queryKeys.doctor.appointments('scheduled'),
    queryFn: () => doctorAPI.getMyAppointments('scheduled'),
    enabled: isAuthenticated && !!token,
    retry: 1,
    retryDelay: 1000,
  });
  
  // Ensure scheduledAppointments is always an array
  const scheduledAppointments = useMemo(() => {
    if (!scheduledAppointmentsRaw) return [];
    return Array.isArray(scheduledAppointmentsRaw) ? scheduledAppointmentsRaw : [];
  }, [scheduledAppointmentsRaw]);

  const { data: allAppointmentsRaw, isLoading: loadingAppointments, error: appointmentsError } = useQuery({
    queryKey: queryKeys.doctor.appointments('all'),
    queryFn: () => doctorAPI.getMyAppointments('all'),
    enabled: isAuthenticated && !!token,
    retry: 1,
    retryDelay: 1000,
  });
  
  // Ensure allAppointments is always an array
  const allAppointments = useMemo(() => {
    if (!allAppointmentsRaw) {
      return [];
    }
    if (!Array.isArray(allAppointmentsRaw)) {
      // allAppointmentsRaw is not an array, handle gracefully
      return [];
    }
    return allAppointmentsRaw;
  }, [allAppointmentsRaw]);

  const { data: examinations = [], isLoading: loadingExaminations, error: examinationsError } = useQuery({
    queryKey: queryKeys.doctor.examinations,
    queryFn: doctorAPI.getMyExaminations,
    enabled: isAuthenticated && !!token,
    retry: 1,
    retryDelay: 1000,
  });

  const { data: treatmentPlans = [], isLoading: loadingPlans, error: treatmentPlansError } = useQuery({
    queryKey: queryKeys.doctor.treatmentPlans,
    queryFn: doctorAPI.getMyTreatmentPlans,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Chỉ query phases nếu có treatmentPlans và có permission (tránh query khi API fail)
  const phaseQueries = useQueries({
    queries: (treatmentPlans && treatmentPlans.length > 0 ? treatmentPlans : []).map((plan) => ({
      queryKey: queryKeys.doctor.treatmentPhases(plan.id),
      queryFn: () => doctorAPI.getTreatmentPhases(plan.id),
      enabled: !!plan.id && canGetAllTreatmentPhases,
      retry: false, // Không retry để tránh spam
    })),
  }) as UseQueryResult<TreatmentPhase[]>[];

  const phasesByPlan = useMemo<Record<string, TreatmentPhase[]>>(() => {
    const results: Record<string, TreatmentPhase[]> = {};
    treatmentPlans?.forEach((plan, index) => {
      results[plan.id] = phaseQueries[index]?.data ?? [];
    });
    return results;
  }, [treatmentPlans, phaseQueries]);

  // Get all examination IDs and treatment phase IDs for this doctor
  const examinationIds = useMemo(() => examinations.map(exam => exam.id), [examinations]);
  const allPhases = useMemo(() => Object.values(phasesByPlan).flat(), [phasesByPlan]);
  const treatmentPhaseIds = useMemo(() => allPhases.map(phase => phase.id), [allPhases]);
  
  // Fetch costs to check payment status
  // Cost.id = Examination.id or Cost.id = TreatmentPhase.id
  // We need to fetch costs and filter by status = "paid" or "Done"
  const costIds = useMemo(() => [...examinationIds, ...treatmentPhaseIds], [examinationIds, treatmentPhaseIds]);
  
  // Fetch costs for each ID (only if doctor has UPDATE_PAYMENT_COST permission)
  const costQueries = useQueries({
    queries: (canViewCosts && costIds.length > 0 ? costIds : []).map((costId: string) => ({
      queryKey: ['cost', costId],
      queryFn: () => nurseAPI.getCostById(costId),
      enabled: !!costId && canViewCosts && isAuthenticated && !!token,
      retry: false,
    })),
  });
  
  // Calculate revenue from paid costs only
  const paidCosts = useMemo(() => {
    if (!canViewCosts) return [];
    return costQueries
      .map(query => query.data)
      .filter((cost): cost is NonNullable<typeof cost> => {
        if (!cost) return false;
        const status = cost.status?.toLowerCase();
        return status === 'paid' || status === 'done';
      });
  }, [costQueries, canViewCosts]);

  // Create a map of examination costs for easy lookup
  const examinationCosts = useMemo(() => {
    const costsMap: Record<string, { totalCost: number; status: string }> = {};
    costQueries.forEach((query) => {
      const cost = query.data;
      if (cost && examinationIds.includes(cost.id)) {
        costsMap[cost.id] = {
          totalCost: cost.totalCost || 0,
          status: cost.status || 'wait',
        };
      }
    });
    return costsMap;
  }, [costQueries, examinationIds]);

  // Update planDetailDialog when treatmentPlans data changes
  useEffect(() => {
    if (planDetailDialog && treatmentPlans.length > 0) {
      const updatedPlan = treatmentPlans.find(p => p.id === planDetailDialog.id);
      if (updatedPlan) {
        setPlanDetailDialog(updatedPlan);
      }
    }
  }, [treatmentPlans, planDetailDialog?.id]);

  const { data: serviceCategories = [] } = useQuery({
    queryKey: queryKeys.services.categories,
    queryFn: doctorAPI.getDentalCategories,
    enabled: isAuthenticated && !!token,
  });

  const { data: services = [] } = useQuery({
    queryKey: queryKeys.services.all,
    queryFn: doctorAPI.getDentalServices,
    enabled: isAuthenticated && !!token,
  });

  const { data: prescriptionCatalog = [] } = useQuery({
    queryKey: queryKeys.doctor.catalog,
    queryFn: doctorAPI.getPrescriptionCatalog,
    enabled: isAuthenticated && !!token,
  });

  const { data: doctorDirectoryRaw = [] } = useQuery({
    queryKey: queryKeys.doctor.doctorDirectory,
    queryFn: doctorAPI.getDoctorDirectory,
    enabled: isAuthenticated && !!token && canPickDoctor, // Only fetch if user has PICK_DOCTOR permission
    retry: false, // Don't retry on 401 - this endpoint requires PICK_DOCTOR permission
  });
  
  // Ensure doctorDirectory is always an array
  const doctorDirectory = useMemo(() => {
    if (!doctorDirectoryRaw) return [];
    return Array.isArray(doctorDirectoryRaw) ? doctorDirectoryRaw : [];
  }, [doctorDirectoryRaw]);

  // Fetch all nurses with their assigned treatment plans
  const { data: nursesPick = [], isLoading: loadingNursesPick } = useQuery({
    queryKey: ['nurses', 'pick'],
    queryFn: () => nurseAPI.getAllNursesForPick(),
    enabled: isAuthenticated && !!token,
    retry: 1,
    retryDelay: 1000,
  });

  // Fetch detailed info for each nurse
  const nurseInfoQueries = useQueries({
    queries: (nursesPick || []).map((nurse: NursePick) => ({
      queryKey: ['nurse', 'info', nurse.id],
      queryFn: () => nurseAPI.getNurseInfo(nurse.id),
      enabled: !!nurse.id && isAuthenticated && !!token,
      retry: 1,
    })),
  });

  // Combine nurses with their assigned treatment plans
  const nursesWithPlans = useMemo(() => {
    if (!nursesPick || nursesPick.length === 0) return [];
    
    return nursesPick.map((nursePick: NursePick, index: number) => {
      const nurseInfo = nurseInfoQueries[index]?.data;
      if (!nurseInfo) {
        // Fallback to basic info from pick
        return {
          id: nursePick.id,
          fullName: nursePick.fullName,
          phone: '',
          email: '',
          assignedPlans: [] as TreatmentPlan[],
        };
      }

      // Find assigned treatment plans for this nurse
      const assignedPlans = treatmentPlans.filter(
        (plan) => plan.nurseId === nurseInfo.id
      );

      return {
        ...nurseInfo,
        assignedPlans,
      };
    });
  }, [nursesPick, nurseInfoQueries, treatmentPlans]);

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
    onSuccess: async (updatedPlan) => {
      // Invalidate and refetch to get latest data including nurseFullname
      await queryClient.invalidateQueries({ queryKey: queryKeys.doctor.treatmentPlans });
      await queryClient.refetchQueries({ queryKey: queryKeys.doctor.treatmentPlans });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctor.treatmentPhases() });
      
      // Update planDetailDialog if it's currently open for the updated plan
      // Wait a bit for refetch to complete, then update with fresh data
      setTimeout(() => {
        if (planDetailDialog && planDetailDialog.id === updatedPlan.id) {
          // Get fresh data from query cache
          const freshPlans = queryClient.getQueryData<TreatmentPlan[]>(queryKeys.doctor.treatmentPlans);
          if (freshPlans) {
            const freshPlan = freshPlans.find(p => p.id === updatedPlan.id);
            if (freshPlan) {
              setPlanDetailDialog(freshPlan);
            }
          } else {
            // Fallback to updatedPlan from response
            setPlanDetailDialog(updatedPlan);
          }
        }
      }, 100);
      
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
      // This ensures we have the token available for the request
      await apiClient.post('/api/v1/auth/logout', { token: currentToken }, {
        // Add a custom config to mark this as logout request
        headers: {
          'X-Logout-Request': 'true',
        },
      });
    } catch (error: any) {
      // Ignore logout errors - still clear local state
      // 401/400 is expected if token was already invalidated or invalid
      // These errors are already handled in the interceptor
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

  const nextAppointment = useMemo(() => getNextAppointment(scheduledAppointments), [scheduledAppointments]);
  
  // Calculate revenue from costs with payment status = "paid" or "Done"
  // This is a simplified calculation - in production, fetch costs and filter by status
  const totalRevenue = useMemo(() => {
    // Revenue calculation will be done in OverviewSection component
    // using examination and treatment phase data
    // For accurate calculation, we need to fetch Cost records and check status
    return 0; // Placeholder - actual calculation in OverviewSection
  }, []);
  const doneAppointments = useMemo(
    () => Array.isArray(allAppointments) ? allAppointments.filter((app) => app.status?.toLowerCase() === 'done') : [],
    [allAppointments],
  );
  const cancelledAppointments = useMemo(
    () => Array.isArray(allAppointments) ? allAppointments.filter((app) => app.status?.toLowerCase() === 'cancel') : [],
    [allAppointments],
  );
  const activePhases = useMemo(() => aggregatePhases(treatmentPlans, phasesByPlan), [treatmentPlans, phasesByPlan]);

  // Chỉ block loading nếu các API quan trọng đang load
  // Nếu một số API fail, vẫn cho phép render (với empty data)
  // Timeout: Nếu đã load quá 10 giây, cho phép render để tránh infinite loading
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    if (isAuthenticated && token) {
      setLoadingTimeout(false); // Reset timeout when auth changes
      const timer = setTimeout(() => {
        // Loading timeout - allowing render with partial data
        setLoadingTimeout(true);
      }, 10000); // 10 seconds timeout
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [isAuthenticated, token, loadingProfile, loadingScheduled, loadingAppointments, loadingExaminations, loadingPlans, profileError, scheduledError, appointmentsError, examinationsError, treatmentPlansError]);
  
  const isLoadingPage = !loadingTimeout && (
    loadingProfile || 
    loadingScheduled || 
    loadingAppointments || 
    loadingExaminations || 
    (loadingPlans && !treatmentPlansError)
  );

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
          onLogout={handleLogout}
        />

        <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 lg:px-6">
          {isLoadingPage ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loading size="lg" />
            </div>
          ) : (
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
                    phasesByPlan={phasesByPlan}
                    paidCosts={paidCosts}
                    onCreateExam={() => {
                      if (scheduledAppointments.length) {
                        setExamDialog({ mode: 'create', appointment: scheduledAppointments[0] });
                      }
                    }}
                    onCreatePhase={(plan) => setPhaseDialog({ mode: 'create', plan })}
                  />
              ) : activeSection === 'profile' ? (
                <ProfileSection />
              ) : activeSection === 'account' ? (
                <AccountSection />
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
                    nurses={nursesWithPlans}
                    isLoadingNurses={loadingNursesPick || nurseInfoQueries.some(q => q.isLoading)}
                    examinationCosts={examinationCosts}
                    onCreateExam={(appointment) => setExamDialog({ mode: 'create', appointment })}
                    onEditExam={(examination) => setExamDialog({ mode: 'update', examination })}
                    onViewExamDetail={(examination) => setExamDetailDialog(examination)}
                    onCreatePhase={(plan) => setPhaseDialog({ mode: 'create', plan })}
                    onEditPhase={(plan, phase) => setPhaseDialog({ mode: 'update', plan, phase })}
                    onCreatePlan={(examination) => setPlanDialog({ open: true, examination })}
                    onUpdatePlanStatus={handlePlanStatusChange}
                  onViewPlanDetail={(plan) => setPlanDetailDialog(plan)}
                  onViewAppointmentDetail={(appointment) => setAppointmentDetailDialog(appointment)}
                    onPhaseClick={(planId, phaseId) => {
                      // Chuyển đến section treatment
                      setActiveSection('treatment');
                      // Tìm plan và phase tương ứng
                      const plan = treatmentPlans.find((p) => p.id === planId);
                      const phases = phasesByPlan[planId] || [];
                      const phase = phases.find((p) => p.id === phaseId);
                      if (plan && phase) {
                        // Mở modal với phase tương ứng
                        setPhaseDialog({ mode: 'update', plan, phase });
                      }
                    }}
                    onAddPhase={() => {
                      // Chuyển đến section treatment
                      setActiveSection('treatment');
                      // Tìm plan đầu tiên để tạo phase mới
                      // Nếu có nhiều plans, lấy plan đầu tiên
                      // Nếu không có plan, có thể cần tạo plan trước
                      if (treatmentPlans.length > 0) {
                        const firstPlan = treatmentPlans[0];
                        setPhaseDialog({ mode: 'create', plan: firstPlan });
                      } else {
                        showNotification.info('Vui lòng tạo phác đồ điều trị trước khi thêm tiến trình');
                      }
                    }}
                  />
                )}
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
        plan={planDialog.plan}
        examinations={examinations}
        onOpenChange={(open) => setPlanDialog({ open, examination: undefined, plan: undefined })}
        onSubmit={(form) => {
          if (planDialog.plan) {
            // Edit mode - map form to update payload
            const updatePayload: Parameters<typeof doctorAPI.updateTreatmentPlan>[1] = {
              title: form.title,
              description: form.description,
              duration: form.duration || '',
              notes: form.notes || '',
              status: planDialog.plan.status, // Keep current status
            };
            // Only include nurseId if it's provided and not empty
            if (form.nurseId && form.nurseId.trim() !== '') {
              updatePayload.nurseId = form.nurseId;
            }
            updatePlanMutation.mutate({ 
              planId: planDialog.plan.id, 
              payload: updatePayload
            });
          } else {
            // Create mode
            createPlanMutation.mutate(form);
          }
        }}
        isLoading={createPlanMutation.isPending || updatePlanMutation.isPending}
      />

      <ExaminationDetailDialog
        open={!!examDetailDialog}
        examination={examDetailDialog}
        costData={examDetailDialog ? examinationCosts[examDetailDialog.id] : undefined}
        onOpenChange={(open) => !open && setExamDetailDialog(null)}
        onEdit={(exam) => {
          setExamDetailDialog(null);
          setExamDialog({ mode: 'update', examination: exam });
        }}
      />

      <TreatmentPhaseDetailDialog
        open={!!phaseDetailDialog}
        phase={phaseDetailDialog?.phase || null}
        plan={phaseDetailDialog?.plan || null}
        allPhases={phaseDetailDialog?.plan ? phasesByPlan[phaseDetailDialog.plan.id] || [] : []}
        onOpenChange={(open) => !open && setPhaseDetailDialog(null)}
        onEdit={(phase, plan) => {
          setPhaseDetailDialog(null);
          setPhaseDialog({ mode: 'update', plan, phase });
        }}
        onRefresh={() => {
          // Refresh treatment phases data
          queryClient.invalidateQueries({ queryKey: queryKeys.doctor.treatmentPhases() });
          queryClient.invalidateQueries({ queryKey: queryKeys.doctor.treatmentPlans });
        }}
      />
      <TreatmentPlanDetailDialog
        open={!!planDetailDialog}
        plan={planDetailDialog}
        phases={planDetailDialog ? phasesByPlan[planDetailDialog.id] || [] : []}
        onOpenChange={(open) => !open && setPlanDetailDialog(null)}
        onEdit={(plan) => {
          setPlanDetailDialog(null);
          setPlanDialog({ open: true, plan });
        }}
        onCreatePhase={(plan) => {
          // Close detail dialog and open phase dialog
          setPlanDetailDialog(null);
          setPhaseDialog({ mode: 'create', plan });
        }}
        onEditPhase={(plan, phase) => {
          setPlanDetailDialog(null);
          setPhaseDetailDialog({ phase, plan });
        }}
      />
      <AppointmentDetailDialog
        open={!!appointmentDetailDialog}
        appointment={appointmentDetailDialog}
        onOpenChange={(open) => !open && setAppointmentDetailDialog(null)}
        onCreateExam={(appointment) => {
          setAppointmentDetailDialog(null);
          setExamDialog({ mode: 'create', appointment });
        }}
        onCreatePhase={(plan) => {
          setAppointmentDetailDialog(null);
          setPhaseDialog({ mode: 'create', plan });
        }}
        treatmentPlans={treatmentPlans}
      />
    </div>
  );
};

export default DoctorDashboard;
