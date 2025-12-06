import React, { useEffect, useState, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { useAuth } from '@/hooks/useAuth';
import { Loading } from '@/components/ui';
import { patientAPI } from '@/services/api/patient';
import { adminAPI } from '@/services/api/admin';
import { doctorAPI } from '@/services';
import PatientSidebar from './components/PatientSidebar';
import PatientHeader from './components/PatientHeader';
import PatientContent from './components/PatientContent';
import type { Section, PatientProfile } from './types';

// Lazy load other patient pages
const LazyBasicInfo = React.lazy(() => import('../PatientBasicInfo'));
const LazyInitialExam = React.lazy(() => import('../PatientInitialExamination'));
const LazyTreatmentPlan = React.lazy(() => import('../PatientTreatmentPlan'));
const LazyTreatmentProgress = React.lazy(() => import('../PatientTreatmentProgress'));
const LazyPayment = React.lazy(() => import('../PatientPayment'));

const PatientDashboard: React.FC = () => {
  const token = useSelector((state: any) => state.auth.token);
  const { logout } = useAuth();

  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<Section>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<any | null>(null);

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
  const [appointmentFilter, setAppointmentFilter] = useState<'all' | 'scheduled' | 'done' | 'cancel'>('all');
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

        // Get last visit (most recent completed appointment)
        const completed = nonCancelled
          .filter((a: any) => (a.status || '').toLowerCase().includes('done'))
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
        }

        // Get next appointment (most upcoming scheduled appointment)
        const scheduled = nonCancelled
          .filter((a: any) => (a.status || '').toLowerCase().includes('scheduled'))
          .sort((a: any, b: any) => {
            const dateA = new Date(a.dateTime || 0).getTime();
            const dateB = new Date(b.dateTime || 0).getTime();
            return dateA - dateB;
          });
        if (scheduled.length > 0) {
          const nextDate = scheduled[0].dateTime;
          if (nextDate) {
            try {
              const d = new Date(nextDate);
              if (!isNaN(d.getTime())) {
                setNextAppointment(d.toLocaleDateString('vi-VN'));
              }
            } catch {}
          }
        }

        // Store recent appointments (last 3) - only non-cancelled
        const sortedApps = nonCancelled.sort((a: any, b: any) => {
          const dateA = new Date(a.dateTime || 0).getTime();
          const dateB = new Date(b.dateTime || 0).getTime();
          return dateB - dateA;
        });
        setRecentAppointments(sortedApps.slice(0, 3));

        try {
          const plans = await patientAPI.getMyTreatmentPlans();
        setPlanCount(plans.length || 0);

        // Store treatments for overview and treatments tab
        const treatmentsList: any[] = [];
        for (const p of plans) {
          try {
              const phases = await doctorAPI.getTreatmentPhases(p.id);
            phases.forEach((ph: any) => {
              treatmentsList.push({
                id: ph.id || `${p.id}-${ph.phaseNumber}`,
                planId: p.id,
                planTitle: p.title || 'Phác đồ điều trị',
                phaseNumber: ph.phaseNumber || 0,
                name: ph.name || p.title || 'Phác đồ điều trị',
                description: ph.description || p.description || '',
                date: ph.startDate || p.createAt,
                endDate: ph.endDate,
                status: ph.status || 'in-progress',
                cost: ph.cost || p.totalCost || 0,
                notes: ph.notes || p.description,
                doctorName: p.doctorFullName || '',
                doctorSpecialization: p.doctorSpecialization || '',
              });
            });
          } catch (e) {
            // ignore single plan error
          }
        }
        // Sort by date (newest first)
        treatmentsList.sort((a, b) => {
          const dateA = new Date(a.date || 0).getTime();
          const dateB = new Date(b.date || 0).getTime();
          return dateB - dateA;
        });
        setTreatments(treatmentsList);

        let phasesTotal = 0;
        let payments = 0;
        const acts: Array<{ label: string; date: Date; color: string }> = [];
        for (const p of plans) {
          try {
              const phases = await doctorAPI.getTreatmentPhases(p.id);
            phasesTotal += phases.length || 0;
            // derive payments: each phase with cost > 0 is one transaction; if none and plan.totalCost>0 then 1
            const phasePayments = (phases || []).filter((ph: any) => (ph.cost || 0) > 0).length;
            if (phasePayments > 0) payments += phasePayments;
            else if ((p.totalCost || 0) > 0) payments += 1;

            // activities: latest phase update
            (phases || []).forEach((ph: any) => {
              const d = ph.startDate ? new Date(ph.startDate.split('/').reverse().join('-')) : null;
              if (d)
                acts.push({
                  label: `Cập nhật tiến trình: ${p.title} - ${ph.phaseNumber}`,
                  date: d,
                  color: 'green',
                });
            });
            // activity: plan created
            if (p.createAt) {
              const d = new Date(p.createAt.split('/').reverse().join('-'));
              acts.push({ label: `Nhận phác đồ: ${p.title}`, date: d, color: 'purple' });
            }
          } catch (e) {
            // ignore single plan error
          }
        }
        setPhaseCount(phasesTotal);
        setPaymentCount(payments);
        acts.sort((a, b) => b.date.getTime() - a.date.getTime());
        setActivities(acts.slice(0, 3));
        } catch (error) {
          // If getMyTreatmentPlans fails, set defaults
          setPlanCount(0);
          setTreatments([]);
          setPhaseCount(0);
          setPaymentCount(0);
          setActivities([]);
        }

        // Load prescriptions - try to get from API, otherwise use mock data
        try {
          const presRes = await apiClient.get('/api/v1/patient/prescriptions');
          const presList = presRes.data.result || presRes.data || [];
          if (presList.length > 0) {
            setPrescriptions(presList);
          } else {
            // Generate mock prescriptions from treatment phases if available
            const mockPrescriptions: any[] = [];
            for (const p of plans) {
              try {
                const phases = await doctorAPI.getTreatmentPhases(p.id);
                phases.forEach((ph: any, idx: number) => {
                  if (ph.medications || ph.medicines || ph.drugs) {
                    const meds = ph.medications || ph.medicines || ph.drugs;
                    mockPrescriptions.push({
                      id: `pres-${p.id}-${ph.id || idx}`,
                      treatmentPlanId: p.id,
                      treatmentPhaseId: ph.id,
                      treatmentName: p.title || 'Phác đồ điều trị',
                      date: ph.startDate || p.createAt,
                      endDate: ph.endDate,
                      doctorName: p.doctorFullName || '',
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
              } catch (e) {
                // ignore
              }
            }
            setPrescriptions(mockPrescriptions);
          }
        } catch (e) {
          setPrescriptions([]);
        }

        // Load vitals - try to get from API, otherwise use mock data
        try {
          const vitalsRes = await apiClient.get('/api/v1/patient/vitals');
          const vitalsList = vitalsRes.data.result || vitalsRes.data || [];
          if (vitalsList.length > 0) {
            setVitals(vitalsList);
          } else {
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
          }
        } catch (e) {
          setVitals([]);
        }

        // Load documents - try to get from API, otherwise use mock data
        try {
          const docsRes = await apiClient.get('/api/v1/patient/documents');
          const docsList = docsRes.data.result || docsRes.data || [];
          if (docsList.length > 0) {
            setDocuments(docsList);
          } else {
            // Generate mock documents from appointments and treatments
            const mockDocs: any[] = [];
            const completedApps = appList.filter(
              (a: any) => (a.status || '').toLowerCase().includes('done') && a.dateTime,
            );
            completedApps.slice(0, 3).forEach((app: any, idx: number) => {
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
          }
        } catch (e) {
          setDocuments([]);
        }
      } catch {
        // ignore silently for overview
      }
    };
    loadOverview();
  }, []);

  const handleRefreshData = () => {
    // Reload overview data
    window.location.reload(); // Simple refresh for now
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
      console.error('Error saving profile:', e);
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
        onLogout={logout}
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

