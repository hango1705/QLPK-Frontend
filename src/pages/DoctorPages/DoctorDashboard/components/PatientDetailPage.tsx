import React, { useEffect, useState, useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { Button } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import PatientInfoCard from './PatientInfoCard';
import OdontogramView from './OdontogramView';
import TreatmentHistoryTimeline from './TreatmentHistoryTimeline';
import ExaminationRecords from './ExaminationRecords';
import type { ExaminationSummary, TreatmentPlan, TreatmentPhase, AppointmentSummary } from '@/types/doctor';
import { nurseAPI } from '@/services/api/nurse';
import { doctorAPI } from '@/services/api/doctor';
import { showNotification } from '@/components/ui';
import { queryKeys } from '@/services/queryClient';
import { useAuth } from '@/hooks';

interface PatientDetailPageProps {
  patientId: string;
  patientName?: string;
  patientData?: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    dob?: string;
    gender?: string;
    bloodGroup?: string;
    allergy?: string;
    medicalHistory?: string;
    emergencyContactName?: string;
    emergencyPhoneNumber?: string;
    avatar?: string;
  };
  examinations?: ExaminationSummary[]; // Optional - will fetch if not provided
  appointments?: AppointmentSummary[]; // Optional - needed to map examinations to patient
  treatmentPlans: TreatmentPlan[];
  phasesByPlan: Record<string, TreatmentPhase[]>;
  onBack: () => void;
  onPhaseClick?: (planId: string, phaseId: string) => void;
  onAddPhase?: () => void;
  onViewExamDetail?: (examination: ExaminationSummary) => void;
  onCreatePlan?: () => void;
  onViewPlanDetail?: (plan: TreatmentPlan) => void;
}

const PatientDetailPage: React.FC<PatientDetailPageProps> = ({
  patientId,
  patientName: initialPatientName,
  patientData: initialPatientData,
  examinations: propExaminations,
  appointments: propAppointments = [],
  treatmentPlans,
  phasesByPlan,
  onBack,
  onPhaseClick,
  onAddPhase,
  onViewExamDetail,
  onCreatePlan,
  onViewPlanDetail,
}) => {
  const { isAuthenticated, token } = useAuth();
  
  // State để lưu thông tin bệnh nhân đã load từ API
  const [patientData, setPatientData] = useState<PatientDetailPageProps['patientData']>(initialPatientData);
  const [patientName, setPatientName] = useState<string | undefined>(initialPatientName);
  const [loading, setLoading] = useState(false);

  // Fetch examinations from API
  const { data: fetchedExaminations = [] } = useQuery({
    queryKey: queryKeys.doctor.examinations,
    queryFn: doctorAPI.getMyExaminations,
    enabled: isAuthenticated && !!token,
    retry: 1,
    retryDelay: 1000,
  });

  // Fetch appointments (needed to map examinations to patient)
  const { data: fetchedAppointments = [] } = useQuery({
    queryKey: queryKeys.doctor.appointments('all'),
    queryFn: () => doctorAPI.getMyAppointments('all'),
    enabled: isAuthenticated && !!token,
    retry: 1,
    retryDelay: 1000,
  });

  // Use fetched data (prioritize fetched over props)
  const examinationsSummary = fetchedExaminations.length > 0 ? fetchedExaminations : (propExaminations || []);
  const appointments = fetchedAppointments.length > 0 ? fetchedAppointments : (propAppointments || []);

  // Create appointment maps for quick lookup
  const appointmentMapForLookup = useMemo(() => {
    const map = new Map<string, AppointmentSummary>();
    const patientAppointmentIds = new Set<string>();
    
    appointments.forEach((app: any) => {
      map.set(app.id, app);
      const appPatientId = (app as any).patientId || 
                          (app as any).patient_id ||
                          (app as any).patient?.id ||
                          (app as any).patient?.patientId;
      if (appPatientId === patientId) {
        patientAppointmentIds.add(app.id);
      }
    });
    
    return { byId: map, patientAppointmentIds: Array.from(patientAppointmentIds) };
  }, [appointments, patientId]);

  // Fetch examination details to get appointment_id (only for examinations that don't have appointmentId)
  const examinationDetailQueries = useQueries({
    queries: examinationsSummary
      .filter((exam) => {
        // Only fetch detail if we don't already have appointmentId
        const hasAppointmentId = (exam as any).appointmentId || (exam as any).appointment_id;
        return !hasAppointmentId && !!exam.id;
      })
      .map((exam) => ({
        queryKey: queryKeys.doctor.examinationDetail(exam.id),
        queryFn: () => doctorAPI.getExaminationDetail(exam.id),
        enabled: isAuthenticated && !!token && !!exam.id,
        retry: false,
        staleTime: 5 * 60 * 1000,
      })),
  });

  // Reverse lookup - fetch examination for each patient appointment (only if we don't have examinations already)
  const examinationByAppointmentQueries = useQueries({
    queries: appointmentMapForLookup.patientAppointmentIds
      .filter((appointmentId) => {
        // Only fetch if we don't already have an examination for this appointment
        const hasExamForAppointment = examinationsSummary.some((exam) => {
          const examAppointmentId = (exam as any).appointmentId || (exam as any).appointment_id;
          return examAppointmentId === appointmentId;
        });
        return !hasExamForAppointment;
      })
      .map((appointmentId) => ({
        queryKey: queryKeys.doctor.examinationByAppointment(appointmentId),
        queryFn: () => doctorAPI.getExaminationByAppointment(appointmentId),
        enabled: isAuthenticated && !!token && !!appointmentId && !!patientId && patientId !== 'unknown',
        retry: false,
        staleTime: 5 * 60 * 1000,
      })),
  });

  // Merge examinations from summary + details and reverse lookup
  const examinations = useMemo(() => {
    const examMap = new Map<string, ExaminationSummary>();
    
    // Create a map of examination details by exam ID for quick lookup
    const detailMap = new Map<string, any>();
    examinationDetailQueries.forEach((query) => {
      if (query.data) {
        const examId = (query.data as any).id;
        if (examId) {
          detailMap.set(examId, query.data);
        }
      }
    });
    
    // Add examinations from summary + details
    examinationsSummary.forEach((summary) => {
      const detail = detailMap.get(summary.id);
      if (detail) {
        const merged = {
          ...summary,
          ...detail,
          appointmentId: (detail as any).appointmentId || (detail as any).appointment_id || (summary as any).appointmentId,
          appointment_id: (detail as any).appointment_id || (detail as any).appointmentId || (summary as any).appointment_id,
        };
        examMap.set(merged.id, merged);
      } else {
        examMap.set(summary.id, summary);
      }
    });
    
    // Add examinations from reverse lookup
    examinationByAppointmentQueries.forEach((query) => {
      const exam = query.data;
      if (exam) {
        examMap.set(exam.id, {
          ...exam,
          appointmentId: (exam as any).appointmentId || (exam as any).appointment_id,
          appointment_id: (exam as any).appointment_id || (exam as any).appointmentId,
        } as ExaminationSummary & { appointmentId?: string; appointment_id?: string });
      }
    });

    return Array.from(examMap.values());
  }, [examinationsSummary, examinationDetailQueries, examinationByAppointmentQueries, patientId]);

  // Create appointment maps for quick lookup
  const appointmentMap = useMemo(() => {
    const map = new Map<string, AppointmentSummary>();
    const patientAppointmentIds = new Set<string>();
    
    appointments.forEach((app: any) => {
      map.set(app.id, app);
      
      // Create set of appointment IDs for this patient
      const appPatientId = (app as any).patientId || 
                          (app as any).patient_id ||
                          (app as any).patient?.id ||
                          (app as any).patient?.patientId;
      
      if (appPatientId === patientId) {
        patientAppointmentIds.add(app.id);
      }
    });
    
    return { byId: map, patientAppointmentIds };
  }, [appointments, patientId]);

  // Filter examinations for this patient
  const patientExaminations = useMemo(() => {
    if (!patientId || patientId === 'unknown') {
      return examinations;
    }

    const patientAppointmentIds = appointmentMap.patientAppointmentIds;

    // If no examinations at all, return empty array
    if (examinations.length === 0) {
      return [];
    }

    const filtered = examinations.filter((exam) => {
      // Check if examination has patientId directly
      const examPatientId = (exam as any).patientId || 
                           (exam as any).patient_id ||
                           (exam as any).patient?.id || 
                           (exam as any).patient?.patientId;
      
      if (examPatientId === patientId) {
        return true;
      }

      // Check through appointment_id -> appointment.patient_id
      const appointmentId = (exam as any).appointmentId || 
                            (exam as any).appointment_id ||
                            (exam as any).appointment?.id ||
                            (exam as any).appointment?.appointmentId;
      
      if (appointmentId) {
        if (patientAppointmentIds.has(appointmentId)) {
          return true;
        }
        
        const appointment = appointmentMap.byId.get(appointmentId);
        if (appointment) {
          const appPatientId = (appointment as any).patientId || 
                               (appointment as any).patient_id ||
                               (appointment as any).patient?.id ||
                               (appointment as any).patient?.patientId;
          
          if (appPatientId === patientId) {
            return true;
          }
        }
      }

      // More lenient fallback: If patient has appointments and we have examinations, 
      // show them if we can't definitively exclude them
      if (patientAppointmentIds.size > 0 && examinations.length > 0) {
        // If this examination is in the summary list and patient has appointments, include it
        const isInSummary = examinationsSummary.some(e => e.id === exam.id);
        if (isInSummary && !appointmentId && !examPatientId) {
          // Check if reverse lookup queries have failed or are still loading
          const allReverseLookupsFailed = examinationByAppointmentQueries.length === 0 || 
                                        examinationByAppointmentQueries.every(q => q.isError || (!q.data && !q.isLoading));
          if (allReverseLookupsFailed) {
            return true;
          }
        }
      }

      // Last resort: If only 1 examination and patient has appointments, likely it belongs to patient
      if (examinations.length === 1 && 
          patientAppointmentIds.size > 0 && 
          !appointmentId && 
          !examPatientId &&
          patientId && 
          patientId !== 'unknown') {
        return true;
      }

      return false;
    });

    // If filtered is empty but we have examinations and patient has appointments, 
    // show all examinations as fallback (less strict filtering)
    if (filtered.length === 0 && examinations.length > 0 && patientAppointmentIds.size > 0) {
      return examinations;
    }

    return filtered;
  }, [examinations, patientId, appointmentMap, examinationsSummary, examinationDetailQueries, examinationByAppointmentQueries]);

  // Luôn load lại thông tin bệnh nhân từ API (nếu patientId hợp lệ)
  useEffect(() => {
    // Kiểm tra nếu patientId hợp lệ (UUID format, không phải 'unknown')
    const isValidPatientId =
      !!patientId &&
      patientId !== 'unknown' &&
      patientId.length > 10; // UUID thường dài hơn 10 ký tự
    
    if (!isValidPatientId) {
      // Đã có data hoặc không có patientId hợp lệ, không cần load
      return;
    }

    const loadPatientData = async () => {
      setLoading(true);
      try {
        const data = await nurseAPI.getPatientById(patientId);
        setPatientData({
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          dob: data.dob,
          gender: data.gender,
          bloodGroup: data.bloodGroup,
          allergy: data.allergy,
          medicalHistory: data.medicalHistory,
          emergencyContactName: data.emergencyContactName,
          emergencyPhoneNumber: data.emergencyPhoneNumber,
        });
        setPatientName(data.fullName);
      } catch (error: any) {
        // Hiển thị notification nếu có lỗi rõ ràng
        if (error.response?.status !== 404) {
          showNotification.error('Lỗi', 'Không thể tải thông tin bệnh nhân');
        }
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
  }, [patientId, initialPatientData]);

  // Filter and sort treatment plans for this patient
  const patientTreatmentPlans = React.useMemo(() => {
    if (!patientId || patientId === 'unknown') {
      return [];
    }

    // Filter treatment plans by patientId
    const filtered = treatmentPlans.filter((plan) => {
      const planPatientId = (plan as any).patientId || 
                           (plan as any).patient_id ||
                           (plan as any).patient?.id ||
                           (plan as any).patient?.patientId;
      return planPatientId === patientId;
    });

    // Sort by date (oldest first) - using createAt or first phase startDate
    return filtered.sort((a, b) => {
      const getPlanDate = (plan: TreatmentPlan): number => {
        // Try to get date from first phase
        const phases = phasesByPlan[plan.id] || [];
        if (phases.length > 0) {
          const sortedPhases = phases
            .filter(p => p.startDate)
            .sort((p1, p2) => {
              const date1 = new Date(p1.startDate || 0).getTime();
              const date2 = new Date(p2.startDate || 0).getTime();
              return date1 - date2; // Oldest first
            });
          if (sortedPhases.length > 0) {
            return new Date(sortedPhases[0].startDate || 0).getTime();
          }
        }
        // Fallback to createAt
        return new Date(plan.createAt || 0).getTime();
      };

      const dateA = getPlanDate(a);
      const dateB = getPlanDate(b);
      return dateA - dateB; // Oldest first
    });
  }, [treatmentPlans, patientId, phasesByPlan]);

  // Extract teeth data from examinations and phases
  const teethData = React.useMemo(() => {
    const teeth: Array<{ number: number; status: string; condition?: string }> = [];
    
    // Extract from examinations (if they have teeth data)
    patientExaminations.forEach((exam) => {
      if ((exam as any).teeth && Array.isArray((exam as any).teeth)) {
        (exam as any).teeth.forEach((tooth: any) => {
          if (!teeth.find((t) => t.number === tooth.number)) {
            teeth.push({
              number: tooth.number,
              status: tooth.status || 'normal',
              condition: tooth.condition,
            });
          }
        });
      }
    });

    // Extract from treatment phases (if they have teeth data)
    Object.values(phasesByPlan).flat().forEach((phase) => {
      if ((phase as any).teeth && Array.isArray((phase as any).teeth)) {
        (phase as any).teeth.forEach((tooth: any) => {
          const existing = teeth.find((t) => t.number === tooth.number);
          if (existing) {
            existing.status = tooth.status || existing.status;
            existing.condition = tooth.condition || existing.condition;
          } else {
            teeth.push({
              number: tooth.number,
              status: tooth.status || 'normal',
              condition: tooth.condition,
            });
          }
        });
      }
    });

    return teeth;
  }, [patientExaminations, phasesByPlan]);

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Chi tiết bệnh nhân</h1>
          <p className="text-sm text-muted-foreground">
            {loading 
              ? 'Đang tải thông tin...' 
              : patientName || patientData?.fullName || `Bệnh nhân ${patientId?.slice(0, 8) || 'unknown'}`}
          </p>
        </div>
      </div>

      {/* 2x2 Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ô 1: Thông tin bệnh nhân */}
        <div className="lg:col-span-1">
          <PatientInfoCard
            patientName={
              loading 
                ? 'Đang tải...' 
                : patientName || patientData?.fullName || `Bệnh nhân ${patientId?.slice(0, 8) || 'unknown'}`
            }
            avatar={patientData?.avatar}
            email={patientData?.email}
            phone={patientData?.phone}
            address={patientData?.address}
            dob={patientData?.dob}
            gender={patientData?.gender}
            emergencyContactName={patientData?.emergencyContactName}
            emergencyPhoneNumber={patientData?.emergencyPhoneNumber}
            allergy={patientData?.allergy}
            bloodGroup={patientData?.bloodGroup}
            medicalHistory={patientData?.medicalHistory}
          />
        </div>

        {/* Ô 2: Sơ đồ răng (Odontogram) */}
        <div className="lg:col-span-1">
          <OdontogramView patientId={patientId} teeth={teethData} />
        </div>

        {/* Ô 3: Hồ sơ khám */}
        <div className="lg:col-span-1">
          <ExaminationRecords 
            examinations={patientExaminations}
            onViewDetail={onViewExamDetail}
          />
        </div>

        {/* Ô 4: Lịch sử phác đồ */}
        <div className="lg:col-span-1">
          <TreatmentHistoryTimeline 
            treatmentPlans={patientTreatmentPlans}
            phasesByPlan={phasesByPlan}
            onPhaseClick={onPhaseClick}
            onAddPhase={onAddPhase}
            onCreatePlan={onCreatePlan}
            onViewPlanDetail={onViewPlanDetail}
          />
        </div>
      </div>
    </div>
  );
};

export default PatientDetailPage;

