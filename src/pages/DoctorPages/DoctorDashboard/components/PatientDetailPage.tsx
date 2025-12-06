import React, { useEffect, useState } from 'react';
import { Button, Card, CardContent } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import PatientInfoCard from './PatientInfoCard';
import OdontogramView from './OdontogramView';
import TreatmentHistoryTimeline from './TreatmentHistoryTimeline';
import type { ExaminationSummary, TreatmentPlan, TreatmentPhase } from '@/types/doctor';
import { patientAPI, type PatientResponse } from '@/services/api/patient';
import { showNotification } from '@/components/ui';

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
    avatar?: string;
  };
  examinations: ExaminationSummary[];
  treatmentPlans: TreatmentPlan[];
  phasesByPlan: Record<string, TreatmentPhase[]>;
  onBack: () => void;
  onPhaseClick?: (planId: string, phaseId: string) => void;
  onAddPhase?: () => void;
}

const PatientDetailPage: React.FC<PatientDetailPageProps> = ({
  patientId,
  patientName: initialPatientName,
  patientData: initialPatientData,
  examinations,
  treatmentPlans,
  phasesByPlan,
  onBack,
  onPhaseClick,
  onAddPhase,
}) => {
  // State để lưu thông tin bệnh nhân đã load từ API
  const [patientData, setPatientData] = useState<PatientDetailPageProps['patientData']>(initialPatientData);
  const [patientName, setPatientName] = useState<string | undefined>(initialPatientName);
  const [loading, setLoading] = useState(false);

  // Load patient data từ API nếu có patientId nhưng chưa có patientData
  useEffect(() => {
    // Kiểm tra nếu patientId hợp lệ (UUID format, không phải 'unknown')
    const isValidPatientId = patientId && 
                             patientId !== 'unknown' && 
                             patientId.length > 10 && // UUID thường dài hơn 10 ký tự
                             !initialPatientData?.fullName; // Chưa có data
    
    if (!isValidPatientId) {
      // Đã có data hoặc không có patientId hợp lệ, không cần load
      return;
    }

    const loadPatientData = async () => {
      setLoading(true);
      try {
        console.log('Loading patient data for ID:', patientId);
        const data = await patientAPI.getPatientById(patientId);
        console.log('Loaded patient data:', data);
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
        });
        setPatientName(data.fullName);
      } catch (error: any) {
        console.error('Error loading patient data:', error);
        console.error('Error details:', {
          patientId,
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
        });
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

  // Aggregate treatment history from examinations and treatment phases
  const treatmentHistory = React.useMemo(() => {
    const history: Array<{
      id: string;
      date: string;
      condition: string;
      treatment: string;
      dentist: string;
      notes?: string;
      status: 'done' | 'pending' | 'in-progress';
      type: 'examination' | 'phase';
    }> = [];

    // Add examinations
    examinations.forEach((exam) => {
      if ((exam as any).patientId === patientId || !patientId || patientId === 'unknown') {
        history.push({
          id: exam.id,
          date: exam.createAt || exam.examined_at || '',
          condition: exam.diagnosis || exam.symptoms || 'Chưa có chẩn đoán',
          treatment: exam.treatment || 'Chưa có',
          dentist: (exam as any).doctorFullName || 'Chưa xác định',
          notes: exam.notes,
          status: 'done',
          type: 'examination',
        });
      }
    });

    // Add treatment phases
    Object.entries(phasesByPlan).forEach(([planId, phases]) => {
      const plan = treatmentPlans.find((p) => p.id === planId);
      if (plan && ((plan as any).patientId === patientId || !patientId || patientId === 'unknown')) {
        phases.forEach((phase) => {
          history.push({
            id: phase.id,
            date: phase.startDate || '',
            condition: phase.description || 'Điều trị',
            treatment: `Giai đoạn ${phase.phaseNumber}`,
            dentist: plan.doctorFullname || 'Chưa xác định',
            notes: phase.description,
            status:
              phase.status?.toLowerCase() === 'done'
                ? 'done'
                : phase.status?.toLowerCase() === 'inprogress'
                  ? 'in-progress'
                  : 'pending',
            type: 'phase',
            planId: planId,
            phaseId: phase.id,
          });
        });
      }
    });

    // Sort by date (newest first)
    return history.sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    });
  }, [examinations, treatmentPlans, phasesByPlan, patientId]);

  // Extract teeth data from examinations and phases
  const teethData = React.useMemo(() => {
    const teeth: Array<{ number: number; status: string; condition?: string }> = [];
    
    // Extract from examinations (if they have teeth data)
    examinations.forEach((exam) => {
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
  }, [examinations, phasesByPlan]);

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

      {/* Patient Info Card */}
      <PatientInfoCard
        patientName={
          loading 
            ? 'Đang tải...' 
            : patientName || patientData?.fullName || `Bệnh nhân ${patientId?.slice(0, 8) || 'unknown'}`
        }
        avatar={patientData?.avatar}
        allergy={patientData?.allergy}
        bloodGroup={patientData?.bloodGroup}
        medicalHistory={patientData?.medicalHistory}
      />

      {/* Main Content: Odontogram and Timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Odontogram */}
        <div className="lg:col-span-1">
          <OdontogramView patientId={patientId} teeth={teethData} />
        </div>

        {/* Right: Treatment History Timeline */}
        <div className="lg:col-span-1">
          <TreatmentHistoryTimeline 
            treatments={treatmentHistory} 
            onPhaseClick={onPhaseClick}
            onAddPhase={onAddPhase}
          />
        </div>
      </div>
    </div>
  );
};

export default PatientDetailPage;

