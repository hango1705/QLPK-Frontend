import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button, Input } from '@/components/ui';
import { Users, Search, Calendar, Stethoscope } from 'lucide-react';
import type { ExaminationSummary, TreatmentPlan, AppointmentSummary, TreatmentPhase } from '@/types/doctor';
import { formatDate, formatDateTime } from '../utils';
import PatientDetailPage from './PatientDetailPage';

interface PatientsSectionProps {
  examinations: ExaminationSummary[];
  treatmentPlans: TreatmentPlan[];
  appointments: AppointmentSummary[];
  phasesByPlan?: Record<string, TreatmentPhase[]>;
}

interface PatientInfo {
  patientId: string;
  patientName?: string;
  lastExamination?: ExaminationSummary;
  lastExaminationDate?: string;
  totalExaminations: number;
  activePlans: number;
  totalPlans: number;
  nextAppointment?: AppointmentSummary;
  totalCost: number;
}

const PatientsSection: React.FC<PatientsSectionProps> = ({
  examinations,
  treatmentPlans,
  appointments,
  phasesByPlan = {},
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedPatientId, setSelectedPatientId] = React.useState<string | null>(null);

  // Aggregate patient data from examinations and treatment plans
  const patientsMap = useMemo(() => {
    const map = new Map<string, PatientInfo>();

    // Process examinations
    examinations.forEach((exam) => {
      const patientId = (exam as any).patientId || (exam as any).patient?.id || 'unknown';
      if (!map.has(patientId)) {
        map.set(patientId, {
          patientId,
          patientName: (exam as any).patientName || (exam as any).patient?.fullName,
          totalExaminations: 0,
          activePlans: 0,
          totalPlans: 0,
          totalCost: 0,
        });
      }
      const patient = map.get(patientId)!;
      patient.totalExaminations += 1;
      patient.totalCost += exam.totalCost || 0;
      
      // Update last examination
      if (!patient.lastExaminationDate || 
          (exam.createAt && new Date(exam.createAt) > new Date(patient.lastExaminationDate))) {
        patient.lastExamination = exam;
        patient.lastExaminationDate = exam.createAt;
      }
    });

    // Process treatment plans
    treatmentPlans.forEach((plan) => {
      const patientId = (plan as any).patientId || (plan as any).patient?.id || 'unknown';
      if (!map.has(patientId)) {
        map.set(patientId, {
          patientId,
          patientName: (plan as any).patientName || (plan as any).patient?.fullName,
          totalExaminations: 0,
          activePlans: 0,
          totalPlans: 0,
          totalCost: 0,
        });
      }
      const patient = map.get(patientId)!;
      patient.totalPlans += 1;
      patient.totalCost += plan.totalCost || 0;
      
      if (plan.status?.toLowerCase() === 'inprogress') {
        patient.activePlans += 1;
      }
    });

    // Process appointments to find next appointments
    appointments.forEach((appointment) => {
      const patientId = (appointment as any).patientId || (appointment as any).patient?.id || 'unknown';
      if (map.has(patientId)) {
        const patient = map.get(patientId)!;
        if (appointment.status?.toLowerCase() === 'scheduled') {
          if (!patient.nextAppointment || 
              (appointment.dateTime && new Date(appointment.dateTime) < new Date(patient.nextAppointment.dateTime || ''))) {
            patient.nextAppointment = appointment;
          }
        }
      }
    });

    return map;
  }, [examinations, treatmentPlans, appointments]);

  const patients = useMemo(() => {
    const list = Array.from(patientsMap.values());
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return list.filter(
        (p) =>
          p.patientId.toLowerCase().includes(query) ||
          p.patientName?.toLowerCase().includes(query)
      );
    }
    
    // Sort by last examination date (most recent first)
    return list.sort((a, b) => {
      const dateA = a.lastExaminationDate ? new Date(a.lastExaminationDate).getTime() : 0;
      const dateB = b.lastExaminationDate ? new Date(b.lastExaminationDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [patientsMap, searchQuery]);

  // Get selected patient data
  const selectedPatient = React.useMemo(() => {
    if (!selectedPatientId) return null;
    const patient = patients.find((p) => p.patientId === selectedPatientId);
    if (!patient) return null;

    // Try to get patient info from examinations
    const patientExam = examinations.find(
      (e) => ((e as any).patientId === selectedPatientId || !selectedPatientId || selectedPatientId === 'unknown')
    );
    
    return {
      patientId: patient.patientId,
      patientName: patient.patientName,
      patientData: {
        fullName: patient.patientName,
        allergy: (patientExam as any)?.patient?.allergy || (patientExam as any)?.allergy,
        bloodGroup: (patientExam as any)?.patient?.bloodGroup || (patientExam as any)?.bloodGroup,
        medicalHistory: (patientExam as any)?.patient?.medicalHistory || (patientExam as any)?.medicalHistory,
        avatar: (patientExam as any)?.patient?.avatar || (patientExam as any)?.avatar,
      },
    };
  }, [selectedPatientId, patients, examinations]);

  // If patient is selected, show detail page
  if (selectedPatient) {
    return (
      <PatientDetailPage
        patientId={selectedPatient.patientId}
        patientName={selectedPatient.patientName}
        patientData={selectedPatient.patientData}
        examinations={examinations.filter(
          (e) => ((e as any).patientId === selectedPatient.patientId || !selectedPatient.patientId || selectedPatient.patientId === 'unknown')
        )}
        treatmentPlans={treatmentPlans.filter(
          (p) => ((p as any).patientId === selectedPatient.patientId || !selectedPatient.patientId || selectedPatient.patientId === 'unknown')
        )}
        phasesByPlan={phasesByPlan}
        onBack={() => setSelectedPatientId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-none bg-white/90 shadow-medium">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg">Danh sách bệnh nhân</CardTitle>
            <CardDescription>Quản lý thông tin bệnh nhân đang điều trị</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm bệnh nhân..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {patients.length} bệnh nhân
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {patients.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
              {searchQuery ? 'Không tìm thấy bệnh nhân nào' : 'Chưa có bệnh nhân nào'}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {patients.map((patient) => (
                <Card
                  key={patient.patientId}
                  className="border border-border/70 bg-white/70 transition hover:shadow-md cursor-pointer"
                  onClick={() => setSelectedPatientId(patient.patientId)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Patient Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Users className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {patient.patientName || `Bệnh nhân ${patient.patientId.slice(0, 8)}`}
                            </h3>
                            <p className="text-xs text-muted-foreground">ID: {patient.patientId}</p>
                          </div>
                        </div>
                        {patient.activePlans > 0 && (
                          <Badge className="bg-green-50 text-green-600 border border-green-100">
                            Đang điều trị
                          </Badge>
                        )}
                      </div>

                      {/* Statistics */}
                      <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/50 bg-muted/30 p-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Lần khám</p>
                          <p className="font-semibold text-foreground">{patient.totalExaminations}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Phác đồ</p>
                          <p className="font-semibold text-foreground">
                            {patient.activePlans > 0 && (
                              <span className="text-green-600">{patient.activePlans} đang điều trị / </span>
                            )}
                            {patient.totalPlans}
                          </p>
                        </div>
                      </div>

                      {/* Last Examination */}
                      {patient.lastExamination && (
                        <div className="space-y-1 rounded-xl border border-border/50 bg-white/50 p-2 text-xs">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Stethoscope className="h-3.5 w-3.5" />
                            <span>Lần khám gần nhất</span>
                          </div>
                          <p className="font-medium text-foreground">
                            {patient.lastExamination.diagnosis || 'Chưa có chẩn đoán'}
                          </p>
                          {patient.lastExaminationDate && (
                            <p className="text-muted-foreground">
                              {formatDate(patient.lastExaminationDate)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Next Appointment */}
                      {patient.nextAppointment && (
                        <div className="space-y-1 rounded-xl border border-primary/30 bg-primary/5 p-2 text-xs">
                          <div className="flex items-center gap-2 text-primary">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Lịch hẹn sắp tới</span>
                          </div>
                          <p className="font-medium text-foreground">
                            {formatDateTime(patient.nextAppointment.dateTime)}
                          </p>
                          <p className="text-muted-foreground">{patient.nextAppointment.type}</p>
                        </div>
                      )}

                      {/* Total Cost */}
                      {patient.totalCost > 0 && (
                        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-white/50 px-2 py-1.5 text-xs">
                          <span className="text-muted-foreground">Tổng chi phí:</span>
                          <span className="font-semibold text-primary">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                              maximumFractionDigits: 0,
                            }).format(patient.totalCost)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientsSection;

