import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Input, Alert, AlertTitle, AlertDescription, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Badge } from '@/components/ui';
import { showNotification } from '@/components/ui';
import { patientAPI } from '@/services/api/patient';
import { doctorAPI } from '@/services/api/doctor';
import { nurseAPI } from '@/services/api/nurse';
import type { TreatmentPhase } from '@/types/doctor';
import type { DoctorSummary } from '@/types/doctor';
import type { NurseInfo } from '@/services/api/nurse';
import { pdf } from '@react-pdf/renderer';
import TreatmentPlanPDF from './PatientTreatmentPlan/TreatmentPlanPDF';
import ImageViewer from '@/components/ui/ImageViewer';
import { CheckCircle2, Hourglass, Activity, Clock, FileText } from 'lucide-react';

interface TreatmentPlanApi {
  id: string;
  title: string;
  description: string;
  duration: string;
  notes: string;
  status: string; // free text from BE
  totalCost?: number;
  doctorFullname?: string;
  doctorId?: string;
  nurseId?: string;
  patientId?: string;
  createAt?: string; // dd/MM/yyyy
}

const PatientTreatmentPlan = () => {
  // Global loading & data
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlanApi[]>([]);

  // Sidebar & filters
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Phases for selected plan
  const [phases, setPhases] = useState<TreatmentPhase[]>([]);
  const [loadingPhases, setLoadingPhases] = useState(false);

  // Dialog states
  const [showDoctorDialog, setShowDoctorDialog] = useState(false);
  const [showNurseDialog, setShowNurseDialog] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState<DoctorSummary | null>(null);
  const [nurseInfo, setNurseInfo] = useState<NurseInfo | null>(null);
  const [loadingDoctor, setLoadingDoctor] = useState(false);
  const [loadingNurse, setLoadingNurse] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    setFetching(true);
    setError(null);
    patientAPI
      .getMyTreatmentPlans()
      .then((data) => {
        setTreatmentPlans(data);
        // Chọn mặc định phác đồ đầu tiên
        if (data && data.length > 0) {
          setSelectedPlanId((prev) => prev || data[0].id);
        }
      })
      .catch(() => setError('Không thể tải phác đồ điều trị'))
      .finally(() => setFetching(false));
  }, []);

  // Load phases whenever selected plan changes
  useEffect(() => {
    if (!selectedPlanId) {
      setPhases([]);
      return;
    }
    setLoadingPhases(true);
    doctorAPI
      .getTreatmentPhases(selectedPlanId)
      .then((data) => setPhases(data))
      .catch(() => {
        setPhases([]);
        showNotification.error('Không thể tải danh sách tiến trình');
      })
      .finally(() => setLoadingPhases(false));
  }, [selectedPlanId]);

  const normalizedStatus = (s?: string) => {
    const v = (s || '').toLowerCase();
    if (v.includes('hoàn')) return 'completed';
    if (v.includes('tạm')) return 'paused';
    return 'active';
  };

  const total = treatmentPlans.length;
  const activeCount = useMemo(() => treatmentPlans.filter(p => normalizedStatus(p.status) === 'active').length, [treatmentPlans]);
  const completedCount = useMemo(() => treatmentPlans.filter(p => normalizedStatus(p.status) === 'completed').length, [treatmentPlans]);
  const pausedCount = useMemo(() => treatmentPlans.filter(p => normalizedStatus(p.status) === 'paused').length, [treatmentPlans]);

  const getStatusColor = (status: string) => {
    const n = normalizedStatus(status);
    switch (n) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => status || 'Không xác định';

  // Helper functions for timeline status
  const getStatusIcon = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('hoàn')) return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (s.includes('tạm')) return <Hourglass className="h-5 w-5 text-amber-600" />;
    if (s.includes('đang') || s.includes('diễn')) return <Activity className="h-5 w-5 text-blue-600" />;
    return <Clock className="h-5 w-5 text-gray-600" />;
  };

  const getStatusBadgeClass = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('hoàn')) return 'bg-green-50 text-green-600 border-green-100';
    if (s.includes('tạm')) return 'bg-amber-50 text-amber-600 border-amber-100';
    if (s.includes('đang') || s.includes('diễn')) return 'bg-blue-50 text-blue-600 border-blue-100';
    return 'bg-gray-50 text-gray-600 border-gray-100';
  };

  const formatDateLabel = (date?: string) => {
    if (!date) return 'Chưa có ngày';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;
      
      const monthNames = ['Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6', 'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'];
      const day = d.getDate();
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return date;
    }
  };

  const avatarOf = (name?: string) => {
    const ch = (name || '?').trim().charAt(0).toUpperCase();
    return ch || 'U';
  };

  const handleDownloadPDF = async (plan: TreatmentPlanApi) => {
    try {
      showNotification.info('Đang tạo file PDF...');

      // Lấy thông tin bác sĩ và y tá nếu có
      let doctor: DoctorSummary | null = null;
      let nurse: NurseInfo | null = null;

      if (plan.doctorId) {
        try {
          doctor = await nurseAPI.getDoctorById(plan.doctorId);
        } catch (error) {
          // Ignore error, continue without doctor info
        }
      }

      if (plan.nurseId) {
        try {
          nurse = await nurseAPI.getNurseInfo(plan.nurseId);
        } catch (error) {
          // Ignore error, continue without nurse info
        }
      }

      // Lấy danh sách tiến trình
      let phases: TreatmentPhase[] = [];
      try {
        phases = await doctorAPI.getTreatmentPhases(plan.id);
      } catch (error) {
        // Continue without phases
      }

      // Tạo PDF document
      const doc = <TreatmentPlanPDF plan={plan} doctor={doctor} nurse={nurse} phases={phases} />;

      // Generate PDF blob
      const blob = await pdf(doc).toBlob();

      // Tạo URL và tải xuống
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Phac-do-dieu-tri-${plan.title.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification.success('Tải xuống PDF thành công!');
    } catch (error: any) {
      showNotification.error('Không thể tạo file PDF: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  const handleViewDoctor = async (doctorId: string) => {
    if (!doctorId) {
      showNotification.error('Không có thông tin bác sĩ');
      return;
    }
    setShowDoctorDialog(true);
    setLoadingDoctor(true);
    try {
      const doctor = await nurseAPI.getDoctorById(doctorId);
      setDoctorInfo(doctor);
    } catch (error) {
      showNotification.error('Không thể tải thông tin bác sĩ');
      setDoctorInfo(null);
    } finally {
      setLoadingDoctor(false);
    }
  };

  const handleViewNurse = async (nurseId: string) => {
    if (!nurseId) {
      showNotification.error('Không có thông tin y tá');
      return;
    }
    setShowNurseDialog(true);
    setLoadingNurse(true);
    try {
      const nurse = await nurseAPI.getNurseInfo(nurseId);
      setNurseInfo(nurse);
    } catch (error) {
      showNotification.error('Không thể tải thông tin y tá');
      setNurseInfo(null);
    } finally {
      setLoadingNurse(false);
    }
  };

  // Derived data for sidebar
  const filteredPlans = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return treatmentPlans.filter((plan) => {
      const status = normalizedStatus(plan.status);
      if (statusFilter === 'active' && status !== 'active') return false;
      if (statusFilter === 'completed' && status !== 'completed') return false;

      if (!term) return true;
      return (
        plan.title.toLowerCase().includes(term) ||
        (plan.doctorFullname || '').toLowerCase().includes(term)
      );
    });
  }, [treatmentPlans, statusFilter, searchTerm]);

  const selectedPlan = useMemo(
    () => treatmentPlans.find((p) => p.id === selectedPlanId) || filteredPlans[0] || null,
    [treatmentPlans, filteredPlans, selectedPlanId]
  );

  // Nếu danh sách lọc không chứa plan đang chọn thì tự động chọn lại plan đầu
  useEffect(() => {
    if (!selectedPlan && filteredPlans.length > 0) {
      setSelectedPlanId(filteredPlans[0].id);
    }
  }, [filteredPlans, selectedPlan]);

  return (
    <div className="min-h-screen bg-white">
      <div className="flex h-screen overflow-hidden">
        {error && (
          <Alert variant="destructive" className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl">
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* LEFT SIDEBAR - Danh sách phác đồ */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Phác đồ điều trị</h2>
            
            {/* Search Bar */}
            <div className="relative mb-4">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input
                placeholder="Tìm tên phác đồ, bác sĩ..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Đang điều trị
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === 'completed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Hoàn thành
              </button>
            </div>
          </div>

          {/* Treatment Plans List */}
          <div className="flex-1 overflow-y-auto p-4">
            {fetching && (
              <div className="text-sm text-gray-500 py-8 text-center">Đang tải phác đồ...</div>
            )}
            {!fetching && filteredPlans.length === 0 && (
              <div className="text-sm text-gray-500 py-8 text-center">Không có phác đồ phù hợp</div>
            )}
            {!fetching && filteredPlans.length > 0 && (
              <div className="space-y-3">
                {filteredPlans.map((plan) => {
                  const isActive = selectedPlan && selectedPlan.id === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`w-full text-left rounded-lg px-4 py-3 transition-all relative ${
                        isActive
                          ? 'bg-blue-50 border-l-4 border-blue-600 shadow-sm'
                          : 'bg-white border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon placeholder - có thể thay bằng icon thực tế */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isActive ? 'bg-blue-600' : 'bg-blue-100'
                        }`}>
                          <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-blue-600'}`}>
                            {plan.title?.charAt(0) || 'P'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold mb-1 line-clamp-1 ${
                            isActive ? 'text-gray-900' : 'text-gray-900'
                          }`}>
                            {plan.title || 'Không có tiêu đề'}
                          </p>
                          <p className="text-xs text-gray-600 mb-1">
                            Mã hồ sơ: #{plan.id.slice(0, 8).toUpperCase()}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0A7 7 0 013 16z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs text-gray-600">
                              {plan.doctorFullname ? `BS. ${plan.doctorFullname}` : 'Chưa có bác sĩ'}
                            </span>
                          </div>
                          {plan.createAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Cập nhật: {plan.createAt}
                            </p>
                          )}
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                            normalizedStatus(plan.status) === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : normalizedStatus(plan.status) === 'active'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {getStatusText(plan.status)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE - Chi tiết phác đồ */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {!selectedPlan ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Chọn một phác đồ ở bên trái để xem chi tiết</p>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Header Section */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h1 className="text-2xl font-bold text-gray-900">
                        {selectedPlan.title}
                      </h1>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          normalizedStatus(selectedPlan.status) === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : normalizedStatus(selectedPlan.status) === 'active'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {getStatusText(selectedPlan.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {selectedPlan.description ||
                        'Phác đồ điều trị chi tiết nhằm tối ưu kết quả điều trị và trải nghiệm cho bệnh nhân.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(selectedPlan)}
                      className="flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      In phác đồ
                    </Button>
                    <Button variant="primary" size="sm" className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Đặt lịch hẹn
                    </Button>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  <div className="bg-blue-50 rounded-lg px-4 py-3 border border-blue-100">
                    <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">
                      Thời gian dự kiến
                    </p>
                    <p className="text-lg font-semibold text-blue-900">
                      {selectedPlan.duration || '—'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                      Tổng chi phí
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedPlan.totalCost
                        ? new Intl.NumberFormat('vi-VN').format(selectedPlan.totalCost) + ' ₫'
                        : '—'}
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg px-4 py-3 border border-emerald-100">
                    <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">
                      Đã thanh toán
                    </p>
                    <p className="text-lg font-semibold text-emerald-900">
                      {/* Placeholder - có thể tính từ phases hoặc từ BE */}
                      {selectedPlan.totalCost
                        ? new Intl.NumberFormat('vi-VN').format(Math.round(selectedPlan.totalCost * 0.5)) + ' ₫'
                        : '—'}
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-lg px-4 py-3 border border-amber-100">
                    <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-1">
                      Tiến độ
                    </p>
                    <div className="mt-1">
                      <p className="text-lg font-semibold text-amber-900 mb-1">
                        {phases.length
                          ? `${Math.round(
                              (phases.filter((p) => p.status?.toLowerCase().includes('hoàn')).length /
                                phases.length) *
                                100
                            )}%`
                          : '0%'}
                      </p>
                      <div className="w-full bg-amber-200 rounded-full h-2">
                        <div
                          className="bg-amber-600 h-2 rounded-full transition-all"
                          style={{
                            width: phases.length
                              ? `${Math.round(
                                  (phases.filter((p) => p.status?.toLowerCase().includes('hoàn')).length /
                                    phases.length) *
                                    100
                                )}%`
                              : '0%',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

                {/* Đội ngũ điều trị */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900">Đội ngũ điều trị</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                          {avatarOf(selectedPlan.doctorFullname)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {selectedPlan.doctorFullname || 'Chưa có bác sĩ chỉ định'}
                          </p>
                          <p className="text-xs text-gray-500">Bác sĩ chỉ định chính</p>
                        </div>
                      </div>
                      {selectedPlan.doctorId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDoctor(selectedPlan.doctorId!)}
                        >
                          Xem chi tiết
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">
                          {avatarOf(nurseInfo?.fullName || '')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {nurseInfo?.fullName || 'Điều dưỡng phụ trách'}
                          </p>
                          <p className="text-xs text-gray-500">Điều dưỡng hỗ trợ</p>
                        </div>
                      </div>
                      {selectedPlan.nurseId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewNurse(selectedPlan.nurseId!)}
                        >
                          Xem chi tiết
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Chi tiết các giai đoạn */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900">Chi tiết các giai đoạn</h3>
                  </div>

                  {loadingPhases ? (
                    <div className="text-center py-8 text-sm text-gray-500">Đang tải...</div>
                  ) : phases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-sm text-gray-500">Chưa có tiến trình nào cho phác đồ này</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Vertical timeline line with gradient */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200" />

                      {/* Timeline items */}
                      <div className="space-y-6 pb-4">
                        {phases.map((phase, index) => (
                          <div key={phase.id || index} className="relative flex gap-4">
                            {/* Icon */}
                            <div className="relative z-10 flex-shrink-0">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border-2 border-blue-500 shadow-md">
                                {getStatusIcon(phase.status)}
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-6">
                              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md hover:border-blue-300">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-semibold text-blue-600">
                                        {formatDateLabel(phase.startDate)}
                                      </span>
                                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200">
                                        Tiến trình {phase.phaseNumber}
                                      </Badge>
                                    </div>
                                    <h4 className="text-sm font-semibold text-gray-900 mt-1">
                                      {phase.description?.split('.')[0] || `Giai đoạn ${phase.phaseNumber}`}
                                    </h4>
                                  </div>
                                  <Badge className={`text-xs ${getStatusBadgeClass(phase.status)}`}>
                                    {phase.status || 'Đang thực hiện'}
                                  </Badge>
                                </div>

                                {/* Description */}
                                {phase.description && (
                                  <div className="mb-3">
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                      {phase.description}
                                    </p>
                                  </div>
                                )}

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs mb-3">
                                  {phase.startDate && (
                                    <div>
                                      <span className="text-gray-500 font-medium">Ngày bắt đầu: </span>
                                      <span className="text-gray-900">{phase.startDate}</span>
                                    </div>
                                  )}
                                  {phase.endDate && (
                                    <div>
                                      <span className="text-gray-500 font-medium">Ngày kết thúc: </span>
                                      <span className="text-gray-900">{phase.endDate}</span>
                                    </div>
                                  )}
                                  {phase.cost && (
                                    <div>
                                      <span className="text-gray-500 font-medium">Chi phí: </span>
                                      <span className="text-gray-900">
                                        {new Intl.NumberFormat('vi-VN').format(phase.cost) + ' ₫'}
                                      </span>
                                    </div>
                                  )}
                                  {phase.nextAppointment && (
                                    <div className="sm:col-span-2 md:col-span-1">
                                      <span className="text-gray-500 font-medium">Lịch hẹn tiếp theo: </span>
                                      <span className="text-gray-900">{phase.nextAppointment}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Comments */}
                                {phase.listComment && phase.listComment.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <div className="flex items-start gap-2">
                                      <FileText className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                          Nhận xét
                                        </p>
                                        <div className="space-y-1">
                                          {phase.listComment.map((comment, idx) => (
                                            <p key={idx} className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                                              {comment}
                                            </p>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Images */}
                                {phase.listImage && phase.listImage.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                      Hình ảnh
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                      {phase.listImage.map((img, idx) => {
                                        const getImageTypeLabel = (type: string) => {
                                          switch (type) {
                                            case 'treatmentPhasesTeeth':
                                            case 'examinationTeeth':
                                              return 'Ảnh răng';
                                            case 'treatmentPhasesFace':
                                            case 'examinationFace':
                                              return 'Ảnh mặt';
                                            case 'treatmentPhasesXray':
                                            case 'examinationXray':
                                              return 'Ảnh X-quang';
                                            default:
                                              return type;
                                          }
                                        };

                                        return (
                                          <div
                                            key={idx}
                                            className="flex flex-col cursor-pointer group"
                                            onClick={() => img.url && setSelectedImage(img.url)}
                                          >
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-blue-600 text-white shadow-sm mb-2 w-fit group-hover:bg-blue-700 transition-colors">
                                              {getImageTypeLabel(img.type || '')}
                                            </span>
                                            <img
                                              src={img.url}
                                              alt={`treatment phase ${img.type || ''}`}
                                              className="rounded-md border border-gray-200 w-full h-auto hover:border-blue-400 transition-colors"
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
            </div>
          )}
        </div>
      </div>

      {/* Dialog hiển thị thông tin bác sĩ */}
        <Dialog open={showDoctorDialog} onOpenChange={(open) => {
          if (!open) {
            setShowDoctorDialog(false);
            setDoctorInfo(null);
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Thông tin bác sĩ</DialogTitle>
            </DialogHeader>
            <div className="mt-4">

                {loadingDoctor ? (
                  <div className="text-center py-8">Đang tải...</div>
                ) : doctorInfo ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
                        {doctorInfo.fullName?.charAt(0).toUpperCase() || 'D'}
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900">{doctorInfo.fullName || '-'}</h4>
                        <p className="text-gray-600">{doctorInfo.specialization || '-'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                      {doctorInfo.licenseNumber && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Số giấy phép: </span>
                          <span className="text-sm text-gray-900">{doctorInfo.licenseNumber}</span>
                        </div>
                      )}
                      {doctorInfo.phone && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Số điện thoại: </span>
                          <span className="text-sm text-gray-900">{doctorInfo.phone}</span>
                        </div>
                      )}
                      {doctorInfo.email && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Email: </span>
                          <span className="text-sm text-gray-900">{doctorInfo.email}</span>
                        </div>
                      )}
                      {doctorInfo.address && (
                        <div className="md:col-span-2">
                          <span className="text-sm font-medium text-gray-500">Địa chỉ: </span>
                          <span className="text-sm text-gray-900">{doctorInfo.address}</span>
                        </div>
                      )}
                      {doctorInfo.gender && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Giới tính: </span>
                          <span className="text-sm text-gray-900">
                            {doctorInfo.gender === 'male' ? 'Nam' : doctorInfo.gender === 'female' ? 'Nữ' : doctorInfo.gender}
                          </span>
                        </div>
                      )}
                      {doctorInfo.dob && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Ngày sinh: </span>
                          <span className="text-sm text-gray-900">
                            {new Date(doctorInfo.dob).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      )}
                      {doctorInfo.yearsExperience !== undefined && doctorInfo.yearsExperience !== null && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Số năm kinh nghiệm: </span>
                          <span className="text-sm text-gray-900">{doctorInfo.yearsExperience} năm</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">Không có thông tin bác sĩ</div>
                )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog hiển thị thông tin y tá */}
        <Dialog open={showNurseDialog} onOpenChange={(open) => {
          if (!open) {
            setShowNurseDialog(false);
            setNurseInfo(null);
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Thông tin y tá</DialogTitle>
            </DialogHeader>
            <div className="mt-4">

                {loadingNurse ? (
                  <div className="text-center py-8">Đang tải...</div>
                ) : nurseInfo ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-green-600 text-white flex items-center justify-center text-2xl font-bold">
                        {nurseInfo.fullName?.charAt(0).toUpperCase() || 'N'}
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900">{nurseInfo.fullName || '-'}</h4>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                      {nurseInfo.phone && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Số điện thoại: </span>
                          <span className="text-sm text-gray-900">{nurseInfo.phone}</span>
                        </div>
                      )}
                      {nurseInfo.email && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Email: </span>
                          <span className="text-sm text-gray-900">{nurseInfo.email}</span>
                        </div>
                      )}
                      {nurseInfo.address && (
                        <div className="md:col-span-2">
                          <span className="text-sm font-medium text-gray-500">Địa chỉ: </span>
                          <span className="text-sm text-gray-900">{nurseInfo.address}</span>
                        </div>
                      )}
                      {nurseInfo.gender && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Giới tính: </span>
                          <span className="text-sm text-gray-900">
                            {nurseInfo.gender === 'MALE' ? 'Nam' : nurseInfo.gender === 'FEMALE' ? 'Nữ' : nurseInfo.gender}
                          </span>
                        </div>
                      )}
                      {nurseInfo.dob && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Ngày sinh: </span>
                          <span className="text-sm text-gray-900">
                            {new Date(nurseInfo.dob).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">Không có thông tin y tá</div>
                )}
            </div>
          </DialogContent>
        </Dialog>

      <ImageViewer
        open={!!selectedImage}
        imageUrl={selectedImage}
        alt="Treatment phase image"
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
};

export default PatientTreatmentPlan;
