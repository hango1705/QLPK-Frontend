import React, { useEffect, useState, Suspense } from 'react';
import { Card, Alert, Button, Input } from '@/components/ui';
import { Select, Modal, Tag } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, HourglassOutlined, DashboardOutlined, IdcardOutlined, FileSearchOutlined, ProfileOutlined, LineChartOutlined, DollarCircleOutlined, CalendarOutlined, ScheduleOutlined, UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/services/api/client'; 

const LazyBasicInfo = React.lazy(() => import('./PatientBasicInfo'));
const LazyInitialExam = React.lazy(() => import('./PatientInitialExamination'));
const LazyTreatmentPlan = React.lazy(() => import('./PatientTreatmentPlan'));
const LazyTreatmentProgress = React.lazy(() => import('./PatientTreatmentProgress'));
const LazyPayment = React.lazy(() => import('./PatientPayment'));

function getUsernameFromToken(token: string): string | null {
  if (!token) return null;
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const decoded = JSON.parse(atob(payload));
    return decoded.sub || null;
  } catch {
    return null;
  }
}

interface PatientProfile {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  dob: string;
  emergencyContactName: string;
  emergencyPhoneNumber: string;
  bloodGroup: string;
  allergy: string;
  medicalHistory: string;
}

type Section = 'overview' | 'basic' | 'initial' | 'plan' | 'progress' | 'payment' | 'appointment' | 'appointments' | 'account';

const PatientDashboard = () => {
  const token = useSelector((state: any) => state.auth.token);
  const { logout } = useAuth();

  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<Section>('overview');
  const [appointmentCount, setAppointmentCount] = useState<number>(0);
  const [planCount, setPlanCount] = useState<number>(0);
  const [phaseCount, setPhaseCount] = useState<number>(0);
  const [paymentCount, setPaymentCount] = useState<number>(0);
  const [activities, setActivities] = useState<Array<{label: string; date: Date; color: string}>>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setPatient(null);
    if (!token) {
      setError('Bạn chưa đăng nhập.');
      setLoading(false);
      return;
    }
    apiClient.get('/api/v1/patient/myInfo', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(patientRes => {
        const patientData = patientRes.data.result;
      if (patientData) {
        setPatient(patientData);
        } else if (patientRes.data) {
          setPatient(patientRes.data);
      } else {
          setError('Không tìm thấy thông tin bệnh nhân!');
      }
      setLoading(false);
      })
      .catch(err => {
        setError('Không thể tải dữ liệu hồ sơ bệnh nhân!');
      setPatient(null);
      setLoading(false);
    });
  }, [token]); 

  // Load overview counters
  useEffect(() => {
    const loadOverview = async () => {
      try {
        const apps = await apiClient.get('/api/v1/patient/myAppointment');
        const appList = apps.data.result || apps.data || [];
        setAppointmentCount(appList.filter((a: any) => (a.status || '').toLowerCase() !== 'cancel').length);

        const plansRes = await apiClient.get('/api/v1/patient/myTreatmentPlans');
        const plans = plansRes.data.result || plansRes.data || [];
        setPlanCount(plans.length || 0);

        let phasesTotal = 0;
        let payments = 0;
        const acts: Array<{label: string; date: Date; color: string}> = [];
        for (const p of plans) {
          try {
            const phasesRes = await apiClient.get(`/api/v1/doctor/treatmentPhases/${p.id}`);
            const phases = phasesRes.data.result || phasesRes.data || [];
            phasesTotal += phases.length || 0;
            // derive payments: each phase with cost > 0 is one transaction; if none and plan.totalCost>0 then 1
            const phasePayments = (phases || []).filter((ph: any) => (ph.cost || 0) > 0).length;
            if (phasePayments > 0) payments += phasePayments; else if ((p.totalCost || 0) > 0) payments += 1;

            // activities: latest phase update
            (phases || []).forEach((ph: any) => {
              const d = ph.startDate ? new Date(ph.startDate.split('/').reverse().join('-')) : null;
              if (d) acts.push({ label: `Cập nhật tiến trình: ${p.title} - ${ph.phaseNumber}`, date: d, color: 'green' });
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
        acts.sort((a,b) => b.date.getTime() - a.date.getTime());
        setActivities(acts.slice(0,3));
      } catch {
        // ignore silently for overview
      }
    };
    loadOverview();
  }, []);

  const renderHeader = () => {
    if (loading) {
      return (
        <div className="animate-pulse">
          <div className="h-9 bg-gray-200 rounded w-3/4"></div>
          <div className="h-5 bg-gray-200 rounded w-1/2 mt-2"></div>
        </div>
      );
    }

    if (error || !patient) {
      return (
        <div>
          <h1 className="text-3xl font-bold text-red-600">
            Không thể tải thông tin
          </h1>
          <p className="text-gray-600 mt-1">
            {error || 'Không tìm thấy dữ liệu bệnh nhân.'}
          </p>
        </div>
      );
    }

    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Chào mừng, {patient.fullName}!
        </h1>
        <p className="text-gray-600 mt-1">
          Quản lý thông tin và theo dõi quá trình điều trị của bạn
        </p>
        {/* Nút đặt lịch đã chuyển vào sidebar */}
      </div>
    );
  };

  const SidebarLink: React.FC<{label: React.ReactNode; active: boolean; onClick: () => void;}> = ({label, active, onClick}) => (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-md transition cursor-pointer ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-primary-glow'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {renderHeader()}
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={async () => {
                  try { await apiClient.post('/api/v1/auth/logout', {}); } catch {}
                  logout();
                }}
              >Đăng xuất</Button>
              <div className="text-right">
                <p className="text-sm text-gray-500">Vai trò</p>
                <p className="font-medium text-gray-900">Bệnh nhân</p>
              </div>
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {(() => {
                    if (loading || error || !patient) return 'L';
                    const ch = patient.fullName && patient.fullName.length > 0 ? patient.fullName.charAt(0) : 'L';
                    return ch.toUpperCase();
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && !loading && (
          <Alert 
            variant="error" 
            message={error} 
            closable 
            onClose={() => setError(null)} 
            className="mb-6" 
          />
        )}
        
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 self-start sticky top-4">
            <nav className="bg-popover border border-border rounded-xl p-2 shadow-medium">
              <ul className="flex flex-col gap-1 text-sm">
                <li><SidebarLink label={<span className="flex items-center gap-2"><DashboardOutlined /> <span>Tổng quan</span></span>} active={section==='overview'} onClick={() => setSection('overview')} /></li>
                <li><SidebarLink label={<span className="flex items-center gap-2"><IdcardOutlined /> <span>Thông tin cơ bản</span></span>} active={section==='basic'} onClick={() => setSection('basic')} /></li>
                <li><SidebarLink label={<span className="flex items-center gap-2"><FileSearchOutlined /> <span>Hồ sơ khám ban đầu</span></span>} active={section==='initial'} onClick={() => setSection('initial')} /></li>
                <li><SidebarLink label={<span className="flex items-center gap-2"><ProfileOutlined /> <span>Phác đồ điều trị</span></span>} active={section==='plan'} onClick={() => setSection('plan')} /></li>
                <li><SidebarLink label={<span className="flex items-center gap-2"><LineChartOutlined /> <span>Tiến trình điều trị</span></span>} active={section==='progress'} onClick={() => setSection('progress')} /></li>
                <li><SidebarLink label={<span className="flex items-center gap-2"><DollarCircleOutlined /> <span>Thanh toán</span></span>} active={section==='payment'} onClick={() => setSection('payment')} /></li>
                <li><SidebarLink label={<span className="flex items-center gap-2"><CalendarOutlined /> <span>Đặt lịch hẹn</span></span>} active={section==='appointment'} onClick={() => setSection('appointment')} /></li>
                <li><SidebarLink label={<span className="flex items-center gap-2"><ScheduleOutlined /> <span>Xem lịch hẹn</span></span>} active={section==='appointments'} onClick={() => setSection('appointments')} /></li>
                <li><SidebarLink label={<span className="flex items-center gap-2"><UserOutlined /> <span>Tài khoản</span></span>} active={section==='account'} onClick={() => setSection('account')} /></li>
              </ul>
            </nav>
          </aside>

          {/* Main right content */}
          <main className="flex-1">
            {section === 'overview' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
                <p className="text-sm font-medium text-gray-500">Lần khám</p>
                    <p className="text-2xl font-bold text-gray-900">{appointmentCount}</p>
          </Card>
          <Card className="p-6">
                <p className="text-sm font-medium text-gray-500">Phác đồ</p>
                    <p className="text-2xl font-bold text-gray-900">{planCount}</p>
          </Card>
          <Card className="p-6">
                <p className="text-sm font-medium text-gray-500">Tiến trình</p>
                    <p className="text-2xl font-bold text-gray-900">{phaseCount}</p>
          </Card>
          <Card className="p-6">
                <p className="text-sm font-medium text-gray-500">Thanh toán</p>
                    <p className="text-2xl font-bold text-gray-900">{paymentCount}</p>
          </Card>
              </div>

        <div className="mt-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h3>
            <div className="space-y-4">
                      {activities.map((a, idx) => (
                        <div key={idx} className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${a.color==='green'?'bg-green-400':a.color==='purple'?'bg-purple-400':'bg-blue-400'}`}></div>
                <div className="flex-1">
                            <p className="text-sm text-gray-900">{a.label}</p>
                            <p className="text-xs text-gray-500">{a.date.toLocaleDateString('vi-VN')}</p>
              </div>
              </div>
                      ))}
                      {activities.length===0 && <p className="text-sm text-gray-500">Chưa có hoạt động.</p>}
            </div>
          </Card>
                </div>
              </>
            )}

            {section !== 'overview' && (
              <Suspense fallback={<div>Đang tải...</div>}>
                {section === 'basic' && <LazyBasicInfo />}
                {section === 'initial' && <LazyInitialExam />}
                {section === 'plan' && <LazyTreatmentPlan />}
                {section === 'progress' && <LazyTreatmentProgress />}
                {section === 'payment' && <LazyPayment />}
                {section === 'appointment' && (
                  <div className="px-0 py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="p-6 lg:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Đặt lịch hẹn</h3>
                        <AppointmentForm onBooked={() => setSection('appointments')} />
                      </Card>
                    </div>
                  </div>
                )}
                {section === 'appointments' && (
                  <div className="px-0 py-4">
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Lịch hẹn của tôi</h3>
                      <AppointmentList />
                    </Card>
                  </div>
                )}
                {section === 'account' && (
                  <div className="px-0 py-4">
          <Card className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tài khoản</h3>
                      <AccountPanel />
                    </Card>
                  </div>
                )}
              </Suspense>
            )}
          </main>
              </div>
              </div>
            </div>
  );
};

export default PatientDashboard;

// ----- Inline Appointment components -----
const formatBackendDateTime = (date: string, time: string) => {
  if (!date || !time) return '';
  const [y,m,d] = date.split('-');
  return `${time} ${d}/${m}/${y}`;
};

const AppointmentForm: React.FC<{ onBooked: () => void }> = ({ onBooked }) => {
  const [doctorId, setDoctorId] = React.useState('');
  const [doctors, setDoctors] = React.useState<Array<{id:string; fullName:string; specialization:string}>>([]);
  const [type, setType] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [date, setDate] = React.useState('');
  const [time, setTime] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string|null>(null);
  const [error, setError] = React.useState<string|null>(null);
  const [services, setServices] = React.useState<Array<{id:string; name:string; unit:string; unitPrice:number}>>([]);
  const [bookedSet, setBookedSet] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get('/api/v1/doctor/doctors');
        const list = res.data.result || res.data || [];
        if (mounted) setDoctors(list);
      } catch {
        // silent; dropdown will be empty
      }
      try {
        const resS = await apiClient.get('/api/v1/dentalService');
        const listS = resS.data.result || resS.data || [];
        if (mounted) setServices(listS);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  // Helper to convert dateTime from backend (ISO or HH:mm dd/MM/yyyy) to 'HH:mm dd/MM/yyyy'
  const normalizeDateTime = (dt: string): string => {
    if (!dt) return '';
    // If already in format 'HH:mm dd/MM/yyyy', return as is
    if (/^\d{2}:\d{2}\s\d{2}\/\d{2}\/\d{4}$/.test(dt)) return dt;
    // Try to parse ISO format (2025-10-21T13:00:00 or 2025-10-21T13:00:00.000)
    try {
      const d = new Date(dt);
      if (!isNaN(d.getTime())) {
        const hh = d.getHours().toString().padStart(2, '0');
        const mm = d.getMinutes().toString().padStart(2, '0');
        const dd = d.getDate().toString().padStart(2, '0');
        const MM = (d.getMonth() + 1).toString().padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${hh}:${mm} ${dd}/${MM}/${yyyy}`;
      }
    } catch {}
    return dt; // fallback to original
  };

  // Fetch booked time slots of selected doctor - only Scheduled status
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!doctorId) { setBookedSet(new Set()); return; }
      try {
        // Fetch appointments with status to filter only Scheduled
        const res = await apiClient.get(`/api/v1/doctor/appointment/${doctorId}`);
        const list = res.data.result || res.data || [];
        // Filter only Scheduled appointments (exact match, case-insensitive)
        const scheduledList = list.filter((x: any) => {
          const status = (x.status || '').toLowerCase().trim();
          return status === 'scheduled';
        });
        // Normalize dateTime to 'HH:mm dd/MM/yyyy' format
        const s = new Set<string>(
          scheduledList
            .map((x: any) => normalizeDateTime(x.dateTime || ''))
            .filter(Boolean)
        );
        if (mounted) setBookedSet(s);
      } catch (e) {
        console.error('Error fetching booked slots:', e);
        if (mounted) setBookedSet(new Set());
      }
    })();
    return () => { mounted = false; };
  }, [doctorId]);

  const submit = async () => {
    const payloadDate = formatBackendDateTime(date, time);
    if (!doctorId || !payloadDate || !type) return setError('Thiếu bác sĩ, thời gian hoặc loại dịch vụ');
    setLoading(true); setError(null); setMsg(null);
    try {
      await apiClient.post('/api/v1/patient/appointment/booking', {
        doctorId,
        dateTime: payloadDate,
        type,
        notes,
        listDentalServicesEntity: services.filter(s => s.name === type).slice(0,1).map(s => ({ id: s.id })),
      });
      setMsg('Đặt lịch thành công!');
      onBooked();
    } catch {
      setError('Đặt lịch thất bại');
    } finally { setLoading(false); }
  };

  const toVietnamDate = (isoDate: string) => {
    // iso yyyy-mm-dd -> dd/MM/yyyy
    const [y,m,d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  };

  const generateSlots = () => {
    // 08:00 -> 19:00, cách nhau 60 phút
    const slots: string[] = [];
    for (let hour = 8; hour <= 19; hour += 1) {
      const hh = hour.toString().padStart(2, '0');
      slots.push(`${hh}:00`);
    }
    return slots;
  };

  const isSlotDisabled = (slot: string) => {
    if (!date || !doctorId) return true;
    
    // Format key to match normalized format: 'HH:mm dd/MM/yyyy'
    const key = `${slot} ${toVietnamDate(date)}`;
    
    // Debug: log để kiểm tra
    // console.log('Checking slot:', slot, 'date:', date, 'key:', key, 'bookedSet:', Array.from(bookedSet));
    
    // Check if this slot is booked with Scheduled status
    if (bookedSet.has(key)) {
      // console.log('Slot disabled because booked:', key);
      return true;
    }
    
    // Disable past time slots for today
    const today = new Date();
    const [y, m, d] = date.split('-').map(Number);
    const isSameDate = today.getFullYear() === y && (today.getMonth()+1) === m && today.getDate() === d;
    if (isSameDate) {
      const [hh, mi] = slot.split(':').map(Number);
      const slotDateTime = new Date(y, m-1, d, hh, mi, 0, 0);
      const now = new Date();
      if (slotDateTime.getTime() <= now.getTime()) {
        // console.log('Slot disabled because past:', key);
        return true;
      }
    }
    
    return false;
  };

  return (
    <div>
      {error && <Alert variant="error" message={error} className="mb-3" />}
      {msg && <div className="mb-3 text-green-700 font-medium">{msg}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Chọn bác sĩ</label>
          <Select
            showSearch
            placeholder="Chọn bác sĩ"
            className="w-full"
            value={doctorId || undefined}
            onChange={(v) => setDoctorId(v)}
            optionFilterProp="label"
            options={doctors.map(d => ({
              label: `${d.fullName} — ${d.specialization || 'Chưa cập nhật'}`,
              value: d.id
            }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Loại dịch vụ</label>
          <Select
            showSearch
            placeholder="Chọn dịch vụ"
            className="w-full"
            value={type || undefined}
            onChange={(v) => setType(v)}
            optionFilterProp="label"
            options={services.map(s => ({
              label: `${s.name} — ${s.unit} (${s.unitPrice.toLocaleString('vi-VN')} đ)`,
              value: s.name
            }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ngày</label>
          <Input type="date" value={date} onChange={e=>{ setDate(e.target.value); setTime(''); }} />
              </div>
        <div>
          <label className="block text-sm font-medium mb-1">Khung giờ</label>
          <div className="grid grid-cols-3 gap-2">
            {generateSlots().map((s) => {
              const disabled = isSlotDisabled(s);
              const selected = time === s;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={disabled}
                  onClick={() => setTime(s)}
                  className={`border rounded-md py-2 text-sm transition ${
                    disabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : selected
                        ? 'bg-blue-600 text-white border-blue-600 cursor-pointer'
                        : 'hover:border-gray-400 hover:bg-blue-50 cursor-pointer'
                  }`}
                >
                  {s}
                </button>
              );
            })}
              </div>
            </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Ghi chú</label>
          <textarea className="w-full border rounded-md px-3 py-2" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Ghi chú cho bác sĩ..." />
        </div>
              </div>
      <div className="flex gap-3 mt-4">
        <Button onClick={submit} loading={loading}>Đặt lịch</Button>
              </div>
            </div>
  );
};

const AppointmentList: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string|null>(null);
  const [items, setItems] = React.useState<Array<{id:string; dateTime:string; status:string; type:string; doctorFullName:string; doctorSpecialization?:string; doctorId?:string; notes?:string; listDentalServicesEntity?:Array<{id:string}>}>>([]);
  const [filter, setFilter] = React.useState<'all' | 'scheduled' | 'done' | 'cancel'>('all');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [rescheduleId, setRescheduleId] = React.useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = React.useState('');
  const [rescheduleTime, setRescheduleTime] = React.useState('');
  const [rescheduleLoading, setRescheduleLoading] = React.useState(false);
  const [rescheduleDoctorId, setRescheduleDoctorId] = React.useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = React.useState<string | null>(null);
  const [services, setServices] = React.useState<Array<{id:string; name:string}>>([]);
  const [detailOpenId, setDetailOpenId] = React.useState<string | null>(null);
  const [examDetail, setExamDetail] = React.useState<any | null>(null);
  const [doctorsMap, setDoctorsMap] = React.useState<Map<string, string>>(new Map()); // doctorFullName -> doctorId

  // Load doctors map and services for lookup
  React.useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/api/v1/doctor/doctors');
        const list = res.data.result || res.data || [];
        const map = new Map<string, string>();
        list.forEach((d: any) => {
          if (d.fullName) map.set(d.fullName, d.id);
        });
        setDoctorsMap(map);
      } catch {}
      try {
        const resS = await apiClient.get('/api/v1/dentalService');
        const listS = resS.data.result || resS.data || [];
        setServices(listS.map((s: any) => ({ id: s.id, name: s.name })));
      } catch {}
    })();
  }, []);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiClient.get('/api/v1/patient/myAppointment');
      const list = res.data.result || res.data || [];
      // Enrich with doctorId from doctorsMap
      const enriched = list.map((item: any) => ({
        ...item,
        doctorId: doctorsMap.get(item.doctorFullName) || undefined
      }));
      setItems(enriched);
    } catch {
      setError('Không tải được danh sách lịch hẹn');
    } finally { setLoading(false); }
  };

  React.useEffect(() => { if (doctorsMap.size > 0) load(); }, [doctorsMap]);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatDateTimeVi = (s?: string) => {
    if (!s) return '';
    if (/^\d{2}:\d{2}\s\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const hh = pad(d.getHours());
      const mm = pad(d.getMinutes());
      const dd = pad(d.getDate());
      const mm2 = pad(d.getMonth() + 1);
      const yyyy = d.getFullYear();
      return `${hh}:${mm} ${dd}/${mm2}/${yyyy}`;
    }
    return s;
  };

  const statusClass = (s?: string) => {
    const k = (s || '').toLowerCase();
    if (k.includes('done')) return 'bg-green-100 text-green-700 border border-green-200';
    if (k.includes('scheduled')) return 'bg-blue-100 text-blue-700 border border-blue-200';
    if (k.includes('cancel')) return 'bg-red-100 text-red-700 border border-red-200';
    return 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  // Helpers reused from booking
  const toVietnamDate = (isoDate: string) => {
    const [y,m,d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  };
  const generateSlots = () => {
    const slots: string[] = [];
    for (let hour = 8; hour <= 19; hour += 1) {
      const hh = hour.toString().padStart(2, '0');
      slots.push(`${hh}:00`);
    }
    return slots;
  };
  // Helper to normalize dateTime (same as in AppointmentForm)
  const normalizeDateTime = (dt: string): string => {
    if (!dt) return '';
    if (/^\d{2}:\d{2}\s\d{2}\/\d{2}\/\d{4}$/.test(dt)) return dt;
    try {
      const d = new Date(dt);
      if (!isNaN(d.getTime())) {
        const hh = d.getHours().toString().padStart(2, '0');
        const mm = d.getMinutes().toString().padStart(2, '0');
        const dd = d.getDate().toString().padStart(2, '0');
        const MM = (d.getMonth() + 1).toString().padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${hh}:${mm} ${dd}/${MM}/${yyyy}`;
      }
    } catch {}
    return dt;
  };

  const [bookedSet, setBookedSet] = React.useState<Set<string>>(new Set());
  React.useEffect(() => {
    // refresh bookedSet when reschedule open and has doctorId - only Scheduled status
    (async () => {
      if (!rescheduleId || !rescheduleDoctorId) { setBookedSet(new Set()); return; }
      try {
        // Fetch appointments with status to filter only Scheduled
        const res = await apiClient.get(`/api/v1/doctor/appointment/${rescheduleDoctorId}`);
        const list = res.data.result || res.data || [];
        // Filter only Scheduled appointments (exact match)
        const scheduledList = list.filter((x: any) => {
          const status = (x.status || '').toLowerCase().trim();
          return status === 'scheduled';
        });
        // Exclude current appointment being rescheduled
        const otherScheduled = scheduledList.filter((x: any) => x.id !== rescheduleId);
        // Normalize dateTime to 'HH:mm dd/MM/yyyy' format
        setBookedSet(new Set<string>(
          otherScheduled.map((x: any) => normalizeDateTime(x.dateTime || '')).filter(Boolean)
        ));
      } catch { setBookedSet(new Set()); }
    })();
  }, [rescheduleId, rescheduleDoctorId]);
  const isSlotDisabled = (slot: string) => {
    if (!rescheduleDate) return true;
    const key = `${slot} ${toVietnamDate(rescheduleDate)}`;
    if (bookedSet.has(key)) return true;
    const today = new Date();
    const [y, m, d] = rescheduleDate.split('-').map(Number);
    const isSameDate = today.getFullYear() === y && (today.getMonth()+1) === m && today.getDate() === d;
    if (!isSameDate) return false;
    const [hh, mi] = slot.split(':').map(Number);
    const dt = new Date(y, m-1, d, hh, mi, 0, 0);
    return dt.getTime() <= today.getTime();
  };

  const formatBackendDateTime = (date: string, time: string) => {
    if (!date || !time) return '';
    const [y,m,d] = date.split('-');
    return `${time} ${d}/${m}/${y}`;
  };

  const cancelAppointment = async (id: string) => {
    setCancelConfirmId(id);
  };

  const confirmCancel = async () => {
    if (!cancelConfirmId) return;
    try {
      await apiClient.put(`/api/v1/patient/appointment/booking/cancel/${cancelConfirmId}`);
      setCancelConfirmId(null);
      await load();
      setCurrentPage(1); // Reset to first page after filter
    } catch {
      setError('Hủy lịch hẹn thất bại');
      setCancelConfirmId(null);
    }
  };

  const getStatusIcon = (status?: string) => {
    const k = (status || '').toLowerCase();
    if (k.includes('done')) return <CheckCircleOutlined className="text-green-600" />;
    if (k.includes('scheduled')) return <ClockCircleOutlined className="text-blue-600" />;
    if (k.includes('cancel')) return <CloseCircleOutlined className="text-red-600" />;
    return <HourglassOutlined className="text-gray-500" />;
  };

  const getTypeTagColor = (type?: string) => {
    if (!type) return 'default';
    const t = type.toLowerCase();
    if (t.includes('niềng') || t.includes('brace')) return 'cyan';
    if (t.includes('implant') || t.includes('trụ')) return 'purple';
    if (t.includes('răng hàm') || t.includes('molar')) return 'orange';
    if (t.includes('nhổ') || t.includes('extract')) return 'red';
    if (t.includes('trám') || t.includes('fill')) return 'blue';
    return 'geekblue';
  };

  const filteredItems = React.useMemo(() => {
    let result = items;
    if (filter === 'scheduled') {
      result = items.filter(i => (i.status || '').toLowerCase().includes('scheduled'));
    } else if (filter === 'done') {
      result = items.filter(i => (i.status || '').toLowerCase().includes('done'));
    } else if (filter === 'cancel') {
      result = items.filter(i => (i.status || '').toLowerCase().includes('cancel'));
    }
    // Sort by dateTime descending (newest first)
    return result.sort((a, b) => {
      const dateA = new Date(a.dateTime || 0).getTime();
      const dateB = new Date(b.dateTime || 0).getTime();
      return dateB - dateA;
    });
  }, [items, filter]);

  const paginatedItems = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);

  const updateAppointment = async () => {
    if (!rescheduleId || !rescheduleDoctorId) { setError('Thiếu thông tin lịch hẹn'); return; }
    const dateTime = formatBackendDateTime(rescheduleDate, rescheduleTime);
    if (!dateTime) { setError('Chưa chọn ngày/giờ'); return; }
    const currentAppointment = items.find(i => i.id === rescheduleId);
    if (!currentAppointment) { setError('Không tìm thấy lịch hẹn'); return; }
    
    setRescheduleLoading(true); setError(null);
    try {
      // Build listDentalServicesEntity from type (similar to booking)
      const listDentalServicesEntity = currentAppointment.type 
        ? services.filter(s => s.name === currentAppointment.type).slice(0, 1).map(s => ({ id: s.id }))
        : currentAppointment.listDentalServicesEntity || [];
      
      await apiClient.put(`/api/v1/patient/appointment/booking/update/${rescheduleId}`, {
        doctorId: rescheduleDoctorId,
        dateTime,
        type: currentAppointment.type || '',
        notes: currentAppointment.notes || '',
        listDentalServicesEntity,
      });
      setRescheduleId(null); setRescheduleDoctorId(null); setRescheduleDate(''); setRescheduleTime('');
      await load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Cập nhật lịch hẹn thất bại');
    } finally { setRescheduleLoading(false); }
  };

  const openExamDetail = async (appointmentId: string) => {
    setDetailOpenId(appointmentId); setExamDetail(null);
    try {
      const res = await apiClient.get(`/api/v1/doctor/${appointmentId}/examination`);
      const detail = res.data.result || res.data || null;
      setExamDetail(detail);
    } catch { setExamDetail({ error: 'Không tải được hồ sơ khám' }); }
  };

  return (
    <div>
      {error && <Alert variant="error" message={error} className="mb-4" closable onClose={() => setError(null)} />}
      
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 pb-2">
        <button
          onClick={() => { setFilter('all'); setCurrentPage(1); }}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${
            filter === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Tất cả ({items.length})
        </button>
        <button
          onClick={() => { setFilter('scheduled'); setCurrentPage(1); }}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${
            filter === 'scheduled' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Sắp tới ({items.filter(i => (i.status || '').toLowerCase().includes('scheduled')).length})
        </button>
        <button
          onClick={() => { setFilter('done'); setCurrentPage(1); }}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${
            filter === 'done' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Đã hoàn thành ({items.filter(i => (i.status || '').toLowerCase().includes('done')).length})
        </button>
        <button
          onClick={() => { setFilter('cancel'); setCurrentPage(1); }}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${
            filter === 'cancel' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Đã hủy ({items.filter(i => (i.status || '').toLowerCase().includes('cancel')).length})
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-20 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      ) : (
        <>
          {paginatedItems.length === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-gray-500">
              {filter === 'all' 
                ? 'Bạn chưa có lịch hẹn nào.' 
                : `Không có lịch hẹn ${filter === 'scheduled' ? 'sắp tới' : filter === 'done' ? 'đã hoàn thành' : 'đã hủy'}.`}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {paginatedItems.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-border bg-white px-4 py-3 shadow-sm hover:shadow-md transition flex items-center gap-4"
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0 text-lg">
                    {getStatusIcon(a.status)}
                  </div>
                  
                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate mb-1">
                      {a.doctorFullName} {a.doctorSpecialization ? `— ${a.doctorSpecialization}` : ''}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag color={getTypeTagColor(a.type)} className="m-0">
                        {a.type}
                      </Tag>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <ClockCircleOutlined className="text-blue-600" />
                        <span className="font-semibold text-blue-700">{formatDateTimeVi(a.dateTime)}</span>
                      </span>
                    </div>
        </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {a.status && a.status.toLowerCase().includes('scheduled') && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setRescheduleId(a.id);
                            setRescheduleDoctorId(a.doctorId || null);
                            if (a.dateTime) {
                              const dt = normalizeDateTime(a.dateTime);
                              const match = dt.match(/^(\d{2}):(\d{2})\s(\d{2})\/(\d{2})\/(\d{4})$/);
                              if (match) {
                                const [, hh, mm, dd, MM, yyyy] = match;
                                setRescheduleTime(`${hh}:${mm}`);
                                setRescheduleDate(`${yyyy}-${MM}-${dd}`);
                              }
                            }
                          }}
                        >
                          Đổi giờ
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => cancelAppointment(a.id)}>
                          Hủy
                        </Button>
                      </>
                    )}
                    {a.status && a.status.toLowerCase().includes('done') && (
                      <Button variant="outline" size="sm" onClick={() => openExamDetail(a.id)}>
                        Xem hồ sơ khám
                      </Button>
                    )}
                    <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${statusClass(a.status)} min-w-[80px] text-center`}>
                      {a.status}
                    </span>
                  </div>
                </div>
              ))}
                  </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Trước
              </Button>
              <span className="text-sm text-gray-600">
                Trang {currentPage} / {totalPages}
                        </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Sau
              </Button>
            </div>
          )}
        </>
          )}

      {/* Cancel Confirmation Modal */}
      <Modal
        title="Xác nhận hủy lịch hẹn"
        open={!!cancelConfirmId}
        onOk={confirmCancel}
        onCancel={() => setCancelConfirmId(null)}
        okText="Xác nhận hủy"
        cancelText="Hủy bỏ"
        okButtonProps={{ danger: true }}
      >
        <p>Bạn có chắc chắn muốn hủy lịch hẹn này? Hành động này không thể hoàn tác.</p>
      </Modal>

      {/* Reschedule Modal */}
      {rescheduleId && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-5">
                <h4 className="text-base font-semibold mb-3">Đổi giờ lịch hẹn</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Ngày</label>
                    <Input type="date" value={rescheduleDate} onChange={e=>{ setRescheduleDate(e.target.value); setRescheduleTime(''); }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Khung giờ</label>
                    <div className="grid grid-cols-3 gap-2">
                      {generateSlots().map((s) => {
                        const disabled = isSlotDisabled(s);
                        const selected = rescheduleTime === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            disabled={disabled}
                            onClick={() => setRescheduleTime(s)}
                            className={`border rounded-md py-2 text-sm transition ${
                              disabled
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : selected
                                  ? 'bg-blue-600 text-white border-blue-600 cursor-pointer'
                                  : 'hover:border-gray-400 hover:bg-blue-50 cursor-pointer'
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                    </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => { setRescheduleId(null); setRescheduleDoctorId(null); setRescheduleDate(''); setRescheduleTime(''); }}>Đóng</Button>
                  <Button onClick={updateAppointment} loading={rescheduleLoading}>Lưu</Button>
                    </div>
                  </div>
                </div>
          )}
      {/* Exam Detail Modal */}
      {detailOpenId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-5">
            <h4 className="text-base font-semibold mb-3">Hồ sơ khám</h4>
                <div className="max-h-[60vh] overflow-auto text-sm space-y-4">
                  {!examDetail && <div>Đang tải...</div>}
                  {examDetail && examDetail.error && <div className="text-red-600">{examDetail.error}</div>}
                  {examDetail && !examDetail.error && (
                    <>
                      {Array.isArray(examDetail.listImage) && examDetail.listImage.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Hình ảnh</h5>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {examDetail.listImage.map((img: any, idx: number) => (
                              <a key={idx} href={img.url} target="_blank" rel="noreferrer" className="block group">
                                <div className="aspect-[4/3] overflow-hidden rounded-md border">
                                  <img src={img.url} alt={`Ảnh khám ${idx+1}`} className="w-full h-full object-cover group-hover:opacity-90" />
                                </div>
                              </a>
          ))}
        </div>
                        </div>
                      )}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Chi tiết</h5>
                        <pre className="whitespace-pre-wrap break-words">{JSON.stringify(examDetail, null, 2)}</pre>
                      </div>
                    </>
                  )}
                </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setDetailOpenId(null); setExamDetail(null); }}>Đóng</Button>
            </div>
                </div>
              </div>
      )}
    </div>
  );
};

const AccountPanel: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string|null>(null);
  const [user, setUser] = React.useState<any | null>(null);
  const [pwdLoading, setPwdLoading] = React.useState(false);
  const [pwdSuccess, setPwdSuccess] = React.useState<string|null>(null);
  const [passwords, setPasswords] = React.useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = React.useState({ current: false, new: false, confirm: false });
  const [fieldErrors, setFieldErrors] = React.useState<{current?: string; new?: string; confirm?: string}>({});
  const [copiedUserId, setCopiedUserId] = React.useState(false);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiClient.get('/api/v1/users/myInfo');
      setUser(res.data.result || res.data || null);
    } catch {
      setError('Không tải được thông tin tài khoản');
    } finally { setLoading(false); }
  };
  React.useEffect(() => { load(); }, []);

  const validatePassword = () => {
    const errors: {current?: string; new?: string; confirm?: string} = {};
    if (!passwords.currentPassword) errors.current = 'Vui lòng nhập mật khẩu hiện tại';
    if (!passwords.newPassword) {
      errors.new = 'Vui lòng nhập mật khẩu mới';
    } else if (passwords.newPassword.length < 6) {
      errors.new = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    if (!passwords.confirmPassword) {
      errors.confirm = 'Vui lòng xác nhận mật khẩu';
    } else if (passwords.newPassword !== passwords.confirmPassword) {
      errors.confirm = 'Mật khẩu xác nhận không khớp';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const changePassword = async () => {
    if (!user || !user.id) { setError('Thiếu userId'); return; }
    if (!validatePassword()) return;
    
    setPwdLoading(true); setError(null); setPwdSuccess(null);
    try {
      await apiClient.put(`/api/v1/users/updatePassword/${user.id}`, {
        oldPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setFieldErrors({});
      setPwdSuccess('Đổi mật khẩu thành công!');
      setTimeout(() => setPwdSuccess(null), 5000);
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Đổi mật khẩu thất bại';
      setError(msg);
      if (msg.toLowerCase().includes('sai') || msg.toLowerCase().includes('incorrect')) {
        setFieldErrors({ current: 'Mật khẩu hiện tại không đúng' });
      }
    } finally { setPwdLoading(false); }
  };

  const copyUserId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedUserId(true);
      setTimeout(() => setCopiedUserId(false), 2000);
    }
  };

  const getAvatarInitial = () => {
    if (user?.email) return user.email.charAt(0).toUpperCase();
    if (user?.username) return user.username.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <div>
      {error && <Alert variant="error" message={error} className="mb-4" closable onClose={() => setError(null)} />}
      {pwdSuccess && <Alert variant="success" message={pwdSuccess} className="mb-4" closable onClose={() => setPwdSuccess(null)} />}
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      ) : (
        <>
          {user ? (
            <div className="space-y-6">
              {/* Thông tin đăng nhập */}
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md">
                    {getAvatarInitial()}
                  </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Thông tin đăng nhập</h3>
                    <p className="text-sm text-gray-600">Quản lý thông tin tài khoản của bạn</p>
                </div>
              </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 py-2 border-b border-blue-100">
                    <span className="text-sm font-medium text-gray-700 w-28">Email:</span>
                    <span className="text-sm font-medium text-gray-900 flex-1">{user.email}</span>
                  </div>
                  {user.username && (
                    <div className="flex items-center gap-3 py-2 border-b border-blue-100">
                      <span className="text-sm font-medium text-gray-700 w-28">Username:</span>
                      <span className="text-sm font-medium text-gray-900 flex-1">{user.username}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-sm font-medium text-gray-700 w-28">User ID:</span>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs font-mono text-gray-600 bg-white px-2 py-1 rounded border">
                        {user.id.substring(0, 8)}...{user.id.substring(user.id.length - 4)}
                      </span>
                      <button
                        onClick={copyUserId}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition"
                        title="Copy User ID"
                      >
                        {copiedUserId ? 'Đã copy' : 'Copy'}
                      </button>
                </div>
              </div>
            </div>
          </Card>

              {/* Đổi mật khẩu */}
              <Card className="p-6 bg-white border border-gray-200 shadow-sm">
                <div className="mb-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Đổi mật khẩu</h3>
                  <p className="text-sm text-gray-600">Cập nhật mật khẩu để bảo mật tài khoản của bạn</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mật khẩu hiện tại <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showPasswords.current ? "text" : "password"}
                        value={passwords.currentPassword}
                        onChange={e => {
                          setPasswords({...passwords, currentPassword: e.target.value});
                          if (fieldErrors.current) setFieldErrors({...fieldErrors, current: undefined});
                        }}
                        placeholder="Nhập mật khẩu hiện tại"
                        className={`w-full ${fieldErrors.current ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                        aria-label={showPasswords.current ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPasswords.current ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      </button>
                    </div>
                    {fieldErrors.current && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.current}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showPasswords.new ? "text" : "password"}
                        value={passwords.newPassword}
                        onChange={e => {
                          setPasswords({...passwords, newPassword: e.target.value});
                          if (fieldErrors.new) setFieldErrors({...fieldErrors, new: undefined});
                          if (fieldErrors.confirm && passwords.confirmPassword) {
                            setFieldErrors({...fieldErrors, confirm: undefined});
                          }
                        }}
                        placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                        className={`w-full ${fieldErrors.new ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                        aria-label={showPasswords.new ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPasswords.new ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      </button>
                    </div>
                    {fieldErrors.new && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.new}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwords.confirmPassword}
                        onChange={e => {
                          setPasswords({...passwords, confirmPassword: e.target.value});
                          if (fieldErrors.confirm) {
                            if (e.target.value === passwords.newPassword) {
                              setFieldErrors({...fieldErrors, confirm: undefined});
                            } else {
                              setFieldErrors({...fieldErrors, confirm: 'Mật khẩu xác nhận không khớp'});
                            }
                          }
                        }}
                        placeholder="Nhập lại mật khẩu mới"
                        className={`w-full ${fieldErrors.confirm ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                        aria-label={showPasswords.confirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPasswords.confirm ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      </button>
                    </div>
                    {fieldErrors.confirm && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.confirm}</p>
                    )}
        </div>
      </div>
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={changePassword}
                    loading={pwdLoading}
                    variant="primary"
                    className="px-6 py-2 font-medium shadow-sm hover:shadow-md transition"
                  >
                    Lưu thay đổi
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">Không có dữ liệu tài khoản.</div>
          )}
        </>
      )}
    </div>
  );
};

// removed old "Xem lịch trống" helpers as logic is now inline