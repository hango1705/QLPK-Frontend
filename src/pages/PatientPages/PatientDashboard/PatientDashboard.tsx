import React, { useEffect, useState, Suspense, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useAuth, usePermission } from '@/hooks';
import { Loading } from '@/components/ui';
import { patientAPI } from '@/services/api/patient';
import { adminAPI } from '@/services/api/admin';
import { doctorAPI } from '@/services';
import { queryKeys } from '@/services/queryClient';
import apiClient from '@/services/api/client';
import PatientSidebar from './components/PatientSidebar';
import PatientHeader from './components/PatientHeader';
import PatientContent from './components/PatientContent';
import type { Section, PatientProfile } from './types';

// Lazy load other patient pages
const LazyBasicInfo = React.lazy(() => import('../PatientBasicInfo'));
const LazyInitialExam = React.lazy(() => import('../PatientInitialExamination'));
const LazyTreatmentPlan = React.lazy(() => import('../PatientTreatmentPlan'));
const LazyPayment = React.lazy(() => import('../PatientPayment'));

const PatientDashboard: React.FC = () => {
  const token = useSelector((state: any) => state.auth.token);
  const { logout } = useAuth();
  const { hasPermission } = usePermission();
  const queryClient = useQueryClient();
  const canGetAllTreatmentPhases = hasPermission('GET_ALL_TREATMENT_PHASES');
  const [searchParams, setSearchParams] = useSearchParams();

  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize section from URL query param or default to 'overview'
  const initialSection = (searchParams.get('section') as Section) || 'overview';
  const [section, setSection] = useState<Section>(initialSection);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<any | null>(null);

  // Fetch treatment plans with React Query
  const { data: treatmentPlans = [] } = useQuery({
    queryKey: queryKeys.patient.myTreatmentPlans,
    queryFn: patientAPI.getMyTreatmentPlans,
    enabled: canGetAllTreatmentPhases,
  });

  // Fetch costs to count payment records
  const { data: costs = [] } = useQuery({
    queryKey: ['patient', 'costs'],
    queryFn: patientAPI.getAllMyCost,
    enabled: true,
  });

  // Fetch phases for all plans in parallel
  const phaseQueries = useQueries({
    queries: treatmentPlans.map((plan) => ({
      queryKey: queryKeys.patient.treatmentPhases(plan.id),
      queryFn: () => doctorAPI.getTreatmentPhases(plan.id),
      enabled: canGetAllTreatmentPhases && !!plan.id,
      retry: false,
    })),
  });

  // Overview data
  const [appointmentCount, setAppointmentCount] = useState<number>(0);
  const [planCount, setPlanCount] = useState<number>(0);
  const [phaseCount, setPhaseCount] = useState<number>(0);
  const [paymentCount, setPaymentCount] = useState<number>(0);
  const [activities, setActivities] = useState<Array<{ label: string; date: Date; color: string }>>([]);
  const [lastVisit, setLastVisit] = useState<string | null>(null);
  const [nextAppointment, setNextAppointment] = useState<string | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<Array<any>>([]);
  const [allAppointments, setAllAppointments] = useState<Array<any>>([]);
  const [treatments, setTreatments] = useState<Array<any>>([]);

  // Filters and pagination
  const [appointmentFilter, setAppointmentFilter] = useState<'scheduled' | 'done' | 'cancel'>('scheduled');
  const [appointmentPage, setAppointmentPage] = useState(1);
  const [appointmentPageSize] = useState(10);
  const [treatmentFilter, setTreatmentFilter] = useState<'all' | 'in-progress' | 'completed' | 'planned'>('all');
  const [treatmentPage, setTreatmentPage] = useState(1);
  const [treatmentPageSize] = useState(10);
  const [prescriptions, setPrescriptions] = useState<Array<any>>([]);
  const [prescriptionFilter, setPrescriptionFilter] = useState<'all' | 'active' | 'completed' | 'expired'>('all');
  const [prescriptionPage, setPrescriptionPage] = useState(1);
  const [prescriptionPageSize] = useState(10);
  const [vitals, setVitals] = useState<Array<any>>([]);
  const [vitalsPage, setVitalsPage] = useState(1);
  const [vitalsPageSize] = useState(10);
  const [documents, setDocuments] = useState<Array<any>>([]);
  const [documentFilter, setDocumentFilter] = useState<'all' | 'xray' | 'report' | 'lab' | 'other'>('all');
  const [documentPage, setDocumentPage] = useState(1);
  const [documentPageSize] = useState(10);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Handle section change from URL query param
  useEffect(() => {
    const sectionParam = searchParams.get('section');
    if (sectionParam && ['overview', 'basic', 'initial', 'plan', 'payment', 'appointment', 'appointments', 'account'].includes(sectionParam)) {
      setSection(sectionParam as Section);
      // Remove query param after setting section to keep URL clean
      if (searchParams.has('section')) {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('section');
        setSearchParams(newSearchParams, { replace: true });
      }
    }
  }, [searchParams, setSearchParams]);

  // Load patient and user info
  useEffect(() => {
    setLoading(true);
    setError(null);
    setPatient(null);
    if (!token) {
      setError('Bạn chưa đăng nhập.');
      setLoading(false);
      return;
    }
    Promise.all([
      adminAPI.getMyInfo(),
      patientAPI.getMyInfo(),
    ])
      .then(([userData, patientData]) => {
        if (userData) {
          setUser(userData);
        }
        if (patientData) {
          setPatient(patientData);
        } else {
          setError('Không tìm thấy thông tin bệnh nhân!');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError('Không thể tải dữ liệu hồ sơ bệnh nhân!');
        setPatient(null);
        setLoading(false);
      });
  }, [token]);

  // Compute treatments, phases, payments, and activities from React Query data
  const computedTreatmentData = useMemo(() => {
    if (!canGetAllTreatmentPhases || !treatmentPlans.length) {
      return {
        treatments: [],
        phasesTotal: 0,
        payments: 0,
        activities: [],
        planCount: 0,
      };
    }

    const treatmentsList: any[] = [];
    let phasesTotal = 0;
    let payments = 0;
    const acts: Array<{ label: string; date: Date; color: string }> = [];

    treatmentPlans.forEach((plan, index) => {
      const phases = phaseQueries[index]?.data || [];
      
      // Build treatments list
      phases.forEach((ph: any) => {
        treatmentsList.push({
          id: ph.id || `${plan.id}-${ph.phaseNumber}`,
          planId: plan.id,
          planTitle: plan.title || 'Phác đồ điều trị',
          phaseNumber: ph.phaseNumber || 0,
          name: ph.name || plan.title || 'Phác đồ điều trị',
          description: ph.description || plan.description || '',
          date: ph.startDate || plan.createAt,
          endDate: ph.endDate,
          status: ph.status || 'in-progress',
          cost: ph.cost || plan.totalCost || 0,
          notes: ph.notes || plan.description,
          doctorName: plan.doctorFullName || '',
          doctorSpecialization: plan.doctorSpecialization || '',
        });
      });

      // Calculate statistics
      phasesTotal += phases.length || 0;
      const phasePayments = (phases || []).filter((ph: any) => (ph.cost || 0) > 0).length;
      if (phasePayments > 0) payments += phasePayments;
      else if ((plan.totalCost || 0) > 0) payments += 1;

      // Build activities
      phases.forEach((ph: any) => {
        const d = ph.startDate ? new Date(ph.startDate.split('/').reverse().join('-')) : null;
        if (d) {
          acts.push({
            label: `Cập nhật tiến trình: ${plan.title} - ${ph.phaseNumber}`,
            date: d,
            color: 'green',
          });
        }
      });
      
      if (plan.createAt) {
        const d = new Date(plan.createAt.split('/').reverse().join('-'));
        acts.push({ label: `Nhận phác đồ: ${plan.title}`, date: d, color: 'purple' });
      }
    });

    // Sort treatments by date (newest first)
    treatmentsList.sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    });

    // Sort activities by date (newest first)
    acts.sort((a, b) => b.date.getTime() - a.date.getTime());

    return {
      treatments: treatmentsList,
      phasesTotal,
      payments,
      activities: acts.slice(0, 3),
      planCount: treatmentPlans.length,
    };
  }, [treatmentPlans, phaseQueries, canGetAllTreatmentPhases]);

  // Generate mock prescriptions from treatment phases
  const mockPrescriptions = useMemo(() => {
    if (!canGetAllTreatmentPhases || !treatmentPlans.length) return [];
    
    const prescriptions: any[] = [];
    treatmentPlans.forEach((plan, index) => {
      const phases = phaseQueries[index]?.data || [];
      phases.forEach((ph: any, idx: number) => {
        if (ph.medications || ph.medicines || ph.drugs) {
          const meds = ph.medications || ph.medicines || ph.drugs;
          prescriptions.push({
            id: `pres-${plan.id}-${ph.id || idx}`,
            treatmentPlanId: plan.id,
            treatmentPhaseId: ph.id,
            treatmentName: plan.title || 'Phác đồ điều trị',
            date: ph.startDate || plan.createAt,
            endDate: ph.endDate,
            doctorName: plan.doctorFullName || '',
            medications: Array.isArray(meds)
              ? meds
              : typeof meds === 'string'
                ? meds.split(',').map((m: string) => m.trim())
                : [],
            status: ph.status || 'active',
            notes: ph.notes || ph.description || '',
          });
        }
      });
    });
    return prescriptions;
  }, [treatmentPlans, phaseQueries, canGetAllTreatmentPhases]);

  // Load overview data
  useEffect(() => {
    const loadOverview = async () => {
      try {
        const appList = await patientAPI.getMyAppointments();
        const nonCancelled = appList.filter((a: any) => (a.status || '').toLowerCase() !== 'cancel');
        setAppointmentCount(nonCancelled.length);

        // Store all appointments (including cancelled) for appointments tab
        const allAppsSorted = appList.sort((a: any, b: any) => {
          const dateA = new Date(a.dateTime || 0).getTime();
          const dateB = new Date(b.dateTime || 0).getTime();
          return dateB - dateA;
        });
        setAllAppointments(allAppsSorted);

        // Get last visit (most recent completed appointment with dateTime <= today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const completed = nonCancelled
          .filter((a: any) => {
            const status = (a.status || '').toLowerCase();
            if (!status.includes('done')) return false;
            if (!a.dateTime) return false;
            try {
              const appDate = new Date(a.dateTime);
              appDate.setHours(0, 0, 0, 0);
              return appDate.getTime() <= today.getTime();
            } catch {
              return false;
            }
          })
          .sort((a: any, b: any) => {
            const dateA = new Date(a.dateTime || 0).getTime();
            const dateB = new Date(b.dateTime || 0).getTime();
            return dateB - dateA;
          });
        if (completed.length > 0) {
          const lastDate = completed[0].dateTime;
          if (lastDate) {
            try {
              const d = new Date(lastDate);
              if (!isNaN(d.getTime())) {
                setLastVisit(d.toLocaleDateString('vi-VN'));
              }
            } catch {}
          }
        } else {
          setLastVisit(null);
        }

        // Get next appointment (closest appointment date >= today) or next phase in treatment
        const upcoming = nonCancelled
          .filter((a: any) => {
            if (!a.dateTime) return false;
            try {
              const appDate = new Date(a.dateTime);
              appDate.setHours(0, 0, 0, 0);
              return appDate.getTime() >= today.getTime();
            } catch {
              return false;
            }
          })
          .sort((a: any, b: any) => {
            const dateA = new Date(a.dateTime || 0).getTime();
            const dateB = new Date(b.dateTime || 0).getTime();
            return dateA - dateB;
          });
        
        if (upcoming.length > 0) {
          const nextDate = upcoming[0].dateTime;
          if (nextDate) {
            try {
              const d = new Date(nextDate);
              if (!isNaN(d.getTime())) {
                setNextAppointment(d.toLocaleDateString('vi-VN'));
              }
            } catch {}
          }
        } else {
          // If no upcoming appointment, check for next phase in treatment plans
          setNextAppointment(null);
        }

        // Store recent appointments (last 3) - only non-cancelled
        const sortedApps = nonCancelled.sort((a: any, b: any) => {
          const dateA = new Date(a.dateTime || 0).getTime();
          const dateB = new Date(b.dateTime || 0).getTime();
          return dateB - dateA;
        });
        setRecentAppointments(sortedApps.slice(0, 3));

        // NOTE: /api/v1/patient/prescriptions endpoint does not exist in Backend
          // Mock prescriptions will be set from React Query data in useEffect below
          setPrescriptions([]);

        // NOTE: /api/v1/patient/vitals endpoint does not exist in Backend
            // Generate mock vitals from appointments if available
            const mockVitals: any[] = [];
            const completedApps = appList.filter(
              (a: any) => (a.status || '').toLowerCase().includes('done') && a.dateTime,
            );
            completedApps.slice(0, 5).forEach((app: any, idx: number) => {
              const baseDate = app.dateTime ? new Date(app.dateTime) : new Date();
              mockVitals.push({
                id: `vital-${app.id || idx}`,
                appointmentId: app.id,
                date: baseDate.toISOString(),
                bloodPressure: {
                  systolic: 120 + Math.floor(Math.random() * 20),
                  diastolic: 80 + Math.floor(Math.random() * 10),
                },
                heartRate: 70 + Math.floor(Math.random() * 20),
                temperature: (36.5 + Math.random() * 0.8).toFixed(1),
                weight: (60 + Math.random() * 15).toFixed(1),
                height: 160 + Math.floor(Math.random() * 20),
                bmi: 0, // will calculate
                bloodOxygen: 95 + Math.floor(Math.random() * 5),
                respiratoryRate: 16 + Math.floor(Math.random() * 4),
                notes: app.notes || '',
              });
            });
            // Calculate BMI
            mockVitals.forEach((v: any) => {
              if (v.height && v.weight) {
                const heightInM = v.height / 100;
                v.bmi = (parseFloat(v.weight) / (heightInM * heightInM)).toFixed(1);
              }
            });
            setVitals(mockVitals);

        // NOTE: /api/v1/patient/documents endpoint does not exist in Backend
            // Generate mock documents from appointments and treatments
            const mockDocs: any[] = [];
        const completedAppsForDocs = appList.filter(
              (a: any) => (a.status || '').toLowerCase().includes('done') && a.dateTime,
            );
        completedAppsForDocs.slice(0, 3).forEach((app: any, idx: number) => {
              const baseDate = app.dateTime ? new Date(app.dateTime) : new Date();
              mockDocs.push(
                {
                  id: `doc-xray-${app.id || idx}`,
                  type: 'xray',
                  name: `X-quang răng hàm mặt - ${baseDate.toLocaleDateString('vi-VN')}`,
                  date: baseDate.toISOString(),
                  size: Math.floor(Math.random() * 5 + 2) * 1024 * 1024, // 2-7 MB
                  format: 'image/jpeg',
                  url: '#',
                  appointmentId: app.id,
                  description: 'X-quang toàn cảnh răng hàm mặt',
                },
                {
                  id: `doc-report-${app.id || idx}`,
                  type: 'report',
                  name: `Báo cáo khám bệnh - ${baseDate.toLocaleDateString('vi-VN')}`,
                  date: baseDate.toISOString(),
                  size: Math.floor(Math.random() * 500 + 100) * 1024, // 100-600 KB
                  format: 'application/pdf',
                  url: '#',
                  appointmentId: app.id,
                  description: 'Báo cáo kết quả khám và điều trị',
                },
              );
            });
            setDocuments(mockDocs);
      } catch {
        // ignore silently for overview
      }
    };
    loadOverview();
  }, []);

  // Update state from computed React Query data
  useEffect(() => {
    setPlanCount(computedTreatmentData.planCount);
    setTreatments(computedTreatmentData.treatments);
    setPhaseCount(computedTreatmentData.phasesTotal);
    // paymentCount is now set from costs array, not from computedTreatmentData
    setActivities(computedTreatmentData.activities);
  }, [computedTreatmentData]);

  // Update payment count from costs
  useEffect(() => {
    setPaymentCount(costs.length);
  }, [costs]);

  // Update next appointment from treatment phases if no upcoming appointment
  useEffect(() => {
    if (!nextAppointment && canGetAllTreatmentPhases && treatmentPlans.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find next phase appointment date
      let nextPhaseDate: Date | null = null;
      treatmentPlans.forEach((plan, index) => {
        const phases = phaseQueries[index]?.data || [];
        phases.forEach((ph: any) => {
          if (ph.nextAppointment) {
            try {
              // Parse nextAppointment format: "HH:mm dd/MM/yyyy"
              const match = ph.nextAppointment.match(/^(\d{2}):(\d{2})\s(\d{2})\/(\d{2})\/(\d{4})$/);
              if (match) {
                const [, , , dd, MM, yyyy] = match;
                const phaseDate = new Date(`${yyyy}-${MM}-${dd}`);
                phaseDate.setHours(0, 0, 0, 0);
                if (phaseDate.getTime() >= today.getTime()) {
                  if (!nextPhaseDate || phaseDate.getTime() < nextPhaseDate.getTime()) {
                    nextPhaseDate = phaseDate;
                  }
                }
              }
            } catch {}
          }
        });
      });
      
      if (nextPhaseDate) {
        setNextAppointment(nextPhaseDate.toLocaleDateString('vi-VN'));
      }
    }
  }, [nextAppointment, treatmentPlans, phaseQueries, canGetAllTreatmentPhases]);

  // Update prescriptions with mock data from React Query
  useEffect(() => {
    if (prescriptions.length === 0 && mockPrescriptions.length > 0) {
      setPrescriptions(mockPrescriptions);
    }
  }, [mockPrescriptions, prescriptions.length]);

  const handleRefreshData = async () => {
    // Sau khi đặt lịch, reload lại danh sách lịch hẹn và chuyển sang tab "Xem lịch hẹn"
    try {
      const appList = await patientAPI.getMyAppointments();
      const nonCancelled = appList.filter((a: any) => (a.status || '').toLowerCase() !== 'cancel');
      setAppointmentCount(nonCancelled.length);

      // Cập nhật tất cả lịch hẹn (bao gồm cả đã huỷ) cho tab xem lịch
      const allAppsSorted = appList.sort((a: any, b: any) => {
        const dateA = new Date(a.dateTime || 0).getTime();
        const dateB = new Date(b.dateTime || 0).getTime();
        return dateB - dateA;
      });
      setAllAppointments(allAppsSorted);

      // Cập nhật lịch hẹn gần nhất đã hoàn thành (dateTime <= today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const completed = nonCancelled
        .filter((a: any) => {
          const status = (a.status || '').toLowerCase();
          if (!status.includes('done')) return false;
          if (!a.dateTime) return false;
          try {
            const appDate = new Date(a.dateTime);
            appDate.setHours(0, 0, 0, 0);
            return appDate.getTime() <= today.getTime();
          } catch {
            return false;
          }
        })
        .sort((a: any, b: any) => {
          const dateA = new Date(a.dateTime || 0).getTime();
          const dateB = new Date(b.dateTime || 0).getTime();
          return dateB - dateA;
        });
      if (completed.length > 0) {
        const lastDate = completed[0].dateTime;
        if (lastDate) {
          try {
            const d = new Date(lastDate);
            if (!isNaN(d.getTime())) {
              setLastVisit(d.toLocaleDateString('vi-VN'));
            }
          } catch {}
        }
      } else {
        setLastVisit(null);
      }

      // Cập nhật lịch hẹn sắp tới (closest appointment date >= today)
      const upcoming = nonCancelled
        .filter((a: any) => {
          if (!a.dateTime) return false;
          try {
            const appDate = new Date(a.dateTime);
            appDate.setHours(0, 0, 0, 0);
            return appDate.getTime() >= today.getTime();
          } catch {
            return false;
          }
        })
        .sort((a: any, b: any) => {
          const dateA = new Date(a.dateTime || 0).getTime();
          const dateB = new Date(b.dateTime || 0).getTime();
          return dateA - dateB;
        });
      if (upcoming.length > 0) {
        const nextDate = upcoming[0].dateTime;
        if (nextDate) {
          try {
            const d = new Date(nextDate);
            if (!isNaN(d.getTime())) {
              setNextAppointment(d.toLocaleDateString('vi-VN'));
            }
          } catch {}
        }
      } else {
        // If no upcoming appointment, check for next phase in treatment plans
        setNextAppointment(null);
      }

      // Cập nhật danh sách 3 lịch hẹn gần nhất (không tính huỷ)
      const sortedApps = nonCancelled.sort((a: any, b: any) => {
        const dateA = new Date(a.dateTime || 0).getTime();
        const dateB = new Date(b.dateTime || 0).getTime();
        return dateB - dateA;
      });
      setRecentAppointments(sortedApps.slice(0, 3));
    } catch (e) {
      // Nếu lỗi thì bỏ qua, vẫn chuyển tab
    } finally {
      setSection('appointments');
    }
  };

  const handleBookAppointment = () => {
    setSection('appointment');
  };

  const handleEditProfile = () => {
    if (!user || !patient) return;
    setEditForm({
      fullName: user?.fullName || patient?.fullName || '',
      dob: user?.dob || patient?.dob || '',
      email: user?.email || patient?.email || '',
      phone: user?.phone || patient?.phone || '',
      address: user?.address || patient?.address || '',
      bloodGroup: patient?.bloodGroup || '',
      gender: user?.gender || patient?.gender || '',
      allergy: patient?.allergy || '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!user?.id || !patient?.id) {
      return;
    }
    setSaving(true);
    try {
      await adminAPI.updateUserInfo(user.id, {
        fullName: editForm.fullName,
        phone: editForm.phone,
        email: editForm.email,
        address: editForm.address,
        gender: editForm.gender,
        dob: editForm.dob,
      });
      await patientAPI.updateMedicalInformation(patient.id, {
        bloodGroup: editForm.bloodGroup,
        allergy: editForm.allergy,
      });
      // Reload data
      const [userData, patientData] = await Promise.all([
        adminAPI.getMyInfo(),
        patientAPI.getMyInfo(),
      ]);
      if (userData) setUser(userData);
      if (patientData) setPatient(patientData);
      setEditDialogOpen(false);
    } catch (e: any) {
      // Error saving profile
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <PatientHeader
        profile={patient}
        user={user}
        activeSection={section}
        onLogout={() => {
          logout();
        }}
        onEditProfile={handleEditProfile}
        isLoading={loading}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex">
        <PatientSidebar
          activeSection={section}
          onSectionChange={setSection}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-6 lg:p-8">
          <PatientContent
            activeSection={section}
            patient={patient}
            user={user}
            loading={loading}
            error={error}
            appointmentCount={appointmentCount}
            planCount={planCount}
            phaseCount={phaseCount}
            paymentCount={paymentCount}
            activities={activities}
            lastVisit={lastVisit}
            nextAppointment={nextAppointment}
            recentAppointments={recentAppointments}
            allAppointments={allAppointments}
            treatments={treatments}
            appointmentFilter={appointmentFilter}
            appointmentPage={appointmentPage}
            appointmentPageSize={appointmentPageSize}
            onAppointmentFilterChange={setAppointmentFilter}
            onAppointmentPageChange={setAppointmentPage}
            treatmentFilter={treatmentFilter}
            treatmentPage={treatmentPage}
            treatmentPageSize={treatmentPageSize}
            onTreatmentFilterChange={setTreatmentFilter}
            onTreatmentPageChange={setTreatmentPage}
            prescriptions={prescriptions}
            prescriptionFilter={prescriptionFilter}
            prescriptionPage={prescriptionPage}
            prescriptionPageSize={prescriptionPageSize}
            onPrescriptionFilterChange={setPrescriptionFilter}
            onPrescriptionPageChange={setPrescriptionPage}
            vitals={vitals}
            vitalsPage={vitalsPage}
            vitalsPageSize={vitalsPageSize}
            onVitalsPageChange={setVitalsPage}
            documents={documents}
            documentFilter={documentFilter}
            documentPage={documentPage}
            documentPageSize={documentPageSize}
            onDocumentFilterChange={setDocumentFilter}
            onDocumentPageChange={setDocumentPage}
            onBookAppointment={handleBookAppointment}
            onRefreshData={handleRefreshData}
          />
        </main>
      </div>
    </div>
  );
};

export default PatientDashboard;

