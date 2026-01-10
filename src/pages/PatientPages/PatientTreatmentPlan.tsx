import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Input, Alert, AlertTitle, AlertDescription, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Badge, Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui';
import { showNotification } from '@/components/ui';
import { patientAPI, type CostResponse } from '@/services/api/patient';
import { doctorAPI } from '@/services/api/doctor';
import { nurseAPI } from '@/services/api/nurse';
import type { TreatmentPhase } from '@/types/doctor';
import type { DoctorSummary } from '@/types/doctor';
import type { NurseInfo } from '@/services/api/nurse';
import { pdf } from '@react-pdf/renderer';
import TreatmentPlanPDF from './PatientTreatmentPlan/TreatmentPlanPDF';
import ImageViewer from '@/components/ui/ImageViewer';
import { CheckCircle2, Hourglass, Activity, Clock, FileText, Stethoscope, Image as ImageIcon, Eye, Wallet } from 'lucide-react';

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
  createAt?: string; // dd/MM/yyyy or ISO date string
}

// Helper function to format date from various formats to dd/MM/yyyy
const formatDateDisplay = (dateStr?: string): string => {
  if (!dateStr) return '';
  
  // Backend trả về dd/MM/yyyy format (do @JsonFormat), nên nếu đã đúng format thì return luôn
  if (dateStr.includes('/') && dateStr.length === 10) {
    const parts = dateStr.split('/');
    // Validate format: should be dd/MM/yyyy
    if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
      return dateStr;
    }
  }
  
  // Nếu không phải dd/MM/yyyy, thử parse từ các format khác
  try {
    let date: Date;
    
    if (dateStr.includes('T')) {
      // ISO format: "2025-12-13T17:00:00.000Z"
      date = new Date(dateStr);
      // Với ISO string có Z (UTC), dùng UTC methods để lấy đúng ngày
      if (dateStr.endsWith('Z')) {
        const day = date.getUTCDate();
        const month = date.getUTCMonth() + 1;
        const year = date.getUTCFullYear();
        return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
      }
    } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Date-only format: "2025-12-13" - parse as local date
      const [year, month, day] = dateStr.split('-').map(Number);
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    } else {
      date = new Date(dateStr);
    }
    
    if (!isNaN(date.getTime())) {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    }
  } catch {
    // If parsing fails, return original string
  }
  
  return dateStr;
};

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
  
  // Phases for all plans (to get latest start_date)
  const [allPlansPhases, setAllPlansPhases] = useState<Map<string, TreatmentPhase[]>>(new Map());

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
        // Map dữ liệu để đảm bảo create_at được map đúng
        const mappedData: TreatmentPlanApi[] = data.map((plan: any) => ({
          ...plan,
          createAt: plan.createAt || plan.create_at || undefined,
        }));
        setTreatmentPlans(mappedData);
        
        // Fetch phases cho tất cả plans để lấy start_date mới nhất
        const phasesMap = new Map<string, TreatmentPhase[]>();
        Promise.all(
          mappedData.map((plan) =>
            doctorAPI
              .getTreatmentPhases(plan.id)
              .then((phases) => {
                phasesMap.set(plan.id, phases);
              })
              .catch(() => {
                // Ignore errors, just set empty array
                phasesMap.set(plan.id, []);
              })
          )
        ).then(() => {
          setAllPlansPhases(phasesMap);
        });
        
        // Chọn mặc định phác đồ đầu tiên
        if (mappedData && mappedData.length > 0) {
          setSelectedPlanId((prev) => prev || mappedData[0].id);
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


  // Load nurse info whenever selected plan changes
  useEffect(() => {
    if (!selectedPlanId) {
      setNurseInfo(null);
      return;
    }
    const plan = treatmentPlans.find((p) => p.id === selectedPlanId);
    if (!plan || !plan.nurseId) {
      setNurseInfo(null);
      return;
    }
    setLoadingNurse(true);
    nurseAPI
      .getNurseInfo(plan.nurseId)
      .then((data) => setNurseInfo(data))
      .catch(() => {
        setNurseInfo(null);
        // Không hiển thị error notification vì có thể không có nurse
      })
      .finally(() => setLoadingNurse(false));
  }, [selectedPlanId, treatmentPlans]);

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

  const getStatusText = (status: string) => {
    if (!status) return 'Không xác định';
    const s = status.toLowerCase().trim();
    
    // Dịch các label phổ biến sang tiếng Việt
    if (s === 'inprogress' || s === 'in progress' || s === 'đang điều trị' || s.includes('đang')) {
      return 'Đang điều trị';
    }
    if (s === 'completed' || s === 'hoàn thành' || s.includes('hoàn')) {
      return 'Hoàn thành';
    }
    if (s === 'paused' || s === 'tạm dừng' || s.includes('tạm')) {
      return 'Tạm dừng';
    }
    if (s === 'active' || s === 'đang hoạt động') {
      return 'Đang điều trị';
    }
    if (s === 'planned' || s === 'kế hoạch' || s.includes('kế hoạch')) {
      return 'Kế hoạch';
    }
    if (s === 'cancelled' || s === 'hủy' || s.includes('hủy')) {
      return 'Đã hủy';
    }
    
    // Nếu không khớp với bất kỳ label nào, trả về status gốc
    return status;
  };

  // Helper function to extract description before "Ghi chú:"
  const extractDescriptionBeforeNote = (text: string | null | undefined): string => {
    if (!text) return '';
    
    // Tìm vị trí của "Ghi chú:" (case insensitive)
    const noteIndex = text.toLowerCase().indexOf('ghi chú:');
    if (noteIndex !== -1) {
      // Lấy phần trước "Ghi chú:" và trim
      return text.substring(0, noteIndex).trim();
    }
    
    // Nếu không có "Ghi chú:", trả về toàn bộ text
    return text.trim();
  };

  // Helper function to extract note after "Ghi chú:"
  const extractNote = (text: string | null | undefined): string | null => {
    if (!text) return null;
    
    // Tìm vị trí của "Ghi chú:" (case insensitive)
    const noteIndex = text.toLowerCase().indexOf('ghi chú:');
    if (noteIndex !== -1) {
      // Lấy phần sau "Ghi chú:" và trim
      const noteText = text.substring(noteIndex + 'Ghi chú:'.length).trim();
      return noteText || null;
    }
    
    return null;
  };

  // Helper function to determine status based on end_date
  const getStatusByEndDate = (status?: string, endDate?: string): string => {
    // Nếu status đã là "Hoàn thành" hoặc "Completed", giữ nguyên
    const s = (status || '').toLowerCase();
    if (s.includes('hoàn') || s === 'completed') {
      return status || 'Hoàn thành';
    }
    
    // Nếu có end_date, kiểm tra xem đã qua ngày end_date chưa
    if (endDate) {
      try {
        // Parse end_date từ format dd/MM/yyyy
        const parseDate = (dateStr: string): Date => {
          if (dateStr.includes('/')) {
            const [day, month, year] = dateStr.split('/').map(Number);
            return new Date(year, month - 1, day);
          }
          // Fallback cho format khác
          return new Date(dateStr);
        };
        
        const endDateObj = parseDate(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        endDateObj.setHours(0, 0, 0, 0);
        
        // Nếu ngày hiện tại > end_date → "Hoàn thành"
        if (today > endDateObj) {
          return 'Hoàn thành';
        }
      } catch (error) {
        // Nếu parse lỗi, giữ nguyên status
        console.error('Error parsing end_date:', endDate, error);
      }
    }
    
    // Nếu chưa qua end_date hoặc không có end_date, giữ nguyên status
    return status || 'Đang điều trị';
  };

  // Helper functions for timeline status
  const getStatusIcon = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('hoàn') || s === 'completed' || s === 'hoàn thành') return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (s.includes('tạm') || s === 'paused') return <Hourglass className="h-5 w-5 text-amber-600" />;
    if (s.includes('đang') || s.includes('diễn') || s === 'inprogress' || s === 'active') return <Activity className="h-5 w-5 text-blue-600" />;
    return <Clock className="h-5 w-5 text-gray-600" />;
  };

  const getStatusBadgeClass = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('hoàn') || s === 'completed' || s === 'hoàn thành') return 'bg-green-50 text-green-600 border-green-100';
    if (s.includes('tạm') || s === 'paused') return 'bg-amber-50 text-amber-600 border-amber-100';
    if (s.includes('đang') || s.includes('diễn') || s === 'inprogress' || s === 'active') return 'bg-blue-50 text-blue-600 border-blue-100';
    return 'bg-gray-50 text-gray-600 border-gray-100';
  };

  const avatarOf = (name?: string) => {
    const ch = (name || '?').trim().charAt(0).toUpperCase();
    return ch || 'U';
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
  };

  // Helper function to calculate phase cost from services and prescriptions
  const calculatePhaseCost = (phase: TreatmentPhase): number => {
    const services = phase.listDentalServicesEntityOrder || [];
    const prescriptions = phase.listPrescriptionOrder || [];
    
    const calculateServiceCost = (service: typeof services[0]) => {
      if (service.cost && service.cost > 0) {
        return service.cost;
      }
      return (service.quantity || 0) * (service.unitPrice || 0);
    };

    const calculatePrescriptionCost = (prescription: typeof prescriptions[0]) => {
      if (prescription.cost && prescription.cost > 0) {
        return prescription.cost;
      }
      return (prescription.quantity || 0) * (prescription.unitPrice || 0);
    };

    const servicesTotal = services.reduce((sum, item) => sum + calculateServiceCost(item), 0);
    const prescriptionsTotal = prescriptions.reduce((sum, item) => sum + calculatePrescriptionCost(item), 0);
    const calculatedTotal = servicesTotal + prescriptionsTotal;
    
    // Nếu có services hoặc prescriptions, dùng calculatedTotal, ngược lại dùng phase.cost
    if (services.length > 0 || prescriptions.length > 0) {
      return calculatedTotal;
    }
    
    return phase.cost || 0;
  };

  // Component để hiển thị tooltip chi tiết giá tiền
  const CostTooltip: React.FC<{
    phase: TreatmentPhase;
    children: React.ReactNode;
  }> = ({ phase, children }) => {
    const services = phase.listDentalServicesEntityOrder || [];
    const prescriptions = phase.listPrescriptionOrder || [];
    const hasDetails = services.length > 0 || prescriptions.length > 0;

    if (!hasDetails || !phase.cost || phase.cost <= 0) return <>{children}</>;

    // Calculate cost from quantity * unitPrice if cost is not provided or seems incorrect
    const calculateServiceCost = (service: typeof services[0]) => {
      if (service.cost && service.cost > 0) {
        return service.cost;
      }
      return (service.quantity || 0) * (service.unitPrice || 0);
    };

    const calculatePrescriptionCost = (prescription: typeof prescriptions[0]) => {
      if (prescription.cost && prescription.cost > 0) {
        return prescription.cost;
      }
      return (prescription.quantity || 0) * (prescription.unitPrice || 0);
    };

    const servicesTotal = services.reduce((sum, item) => sum + calculateServiceCost(item), 0);
    const prescriptionsTotal = prescriptions.reduce((sum, item) => sum + calculatePrescriptionCost(item), 0);
    const calculatedTotal = servicesTotal + prescriptionsTotal;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-pointer hover:text-blue-600 transition-colors">
              {children}
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">
            <div className="space-y-3 text-sm">
              <div className="font-semibold text-base border-b pb-2">Chi tiết giá tiền</div>
              
              {services.length > 0 && (
                <div>
                  <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Dịch vụ:
                  </div>
                  <div className="space-y-1.5">
                    {services.map((service, idx) => (
                      <div key={idx} className="flex items-start justify-between text-xs bg-blue-50/50 p-2 rounded">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{service.name}</div>
                          <div className="text-gray-600">
                            {service.quantity} {service.unit} × {formatCurrency(service.unitPrice)}
                          </div>
                        </div>
                        <div className="font-semibold text-blue-600 ml-2">
                          {formatCurrency(calculateServiceCost(service))}
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-1 border-t font-semibold">
                      <span>Tổng dịch vụ:</span>
                      <span className="text-blue-600">{formatCurrency(servicesTotal)}</span>
                    </div>
                  </div>
                </div>
              )}

              {prescriptions.length > 0 && (
                <div>
                  <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Thuốc:
                  </div>
                  <div className="space-y-1.5">
                    {prescriptions.map((prescription, idx) => (
                      <div key={idx} className="flex items-start justify-between text-xs bg-green-50/50 p-2 rounded">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{prescription.name}</div>
                          <div className="text-gray-600">
                            {prescription.quantity} × {formatCurrency(prescription.unitPrice)}
                          </div>
                          {prescription.dosage && (
                            <div className="text-gray-600 text-xs">
                              Liều: {prescription.dosage} - {prescription.frequency} - {prescription.duration}
                            </div>
                          )}
                        </div>
                        <div className="font-semibold text-green-600 ml-2">
                          {formatCurrency(calculatePrescriptionCost(prescription))}
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-1 border-t font-semibold">
                      <span>Tổng thuốc:</span>
                      <span className="text-green-600">{formatCurrency(prescriptionsTotal)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t-2 font-bold text-base">
                <span>Tổng cộng:</span>
                <span className="text-blue-600">{formatCurrency(calculatedTotal)}</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
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

  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-white">
      <div className="flex h-screen overflow-hidden relative">
        {error && (
          <Alert variant="destructive" className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl">
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* LEFT SIDEBAR - Danh sách phác đồ */}
        <div className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } lg:w-80 border-r border-gray-200 bg-white flex flex-col overflow-hidden transition-all duration-300 ${
          sidebarOpen ? 'fixed lg:relative z-40' : 'hidden lg:flex'
        }`}>
          <div className="p-4 sm:p-6 border-b border-gray-200">
            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute top-4 right-4 p-1 text-gray-500 hover:text-gray-700"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
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
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold mb-1 line-clamp-1 ${
                            isActive ? 'text-gray-900' : 'text-gray-900'
                          }`}>
                            {plan.title || 'Không có tiêu đề'}
                          </p>
                          <p className="text-xs text-gray-600 mb-1">
                            Mã phác đồ: {plan.id}
                          </p>
                          {(() => {
                            // Lấy start_date của phase mới nhất
                            const planPhases = allPlansPhases.get(plan.id) || [];
                            const latestPhase = planPhases
                              .filter((p) => p.startDate)
                              .sort((a, b) => {
                                // Parse dd/MM/yyyy format
                                const parseDate = (dateStr: string): number => {
                                  const parts = dateStr.split('/');
                                  if (parts.length === 3) {
                                    const [day, month, year] = parts.map(Number);
                                    return new Date(year, month - 1, day).getTime();
                                  }
                                  // Fallback to ISO format
                                  return new Date(dateStr).getTime();
                                };
                                
                                try {
                                  const dateA = parseDate(a.startDate);
                                  const dateB = parseDate(b.startDate);
                                  return dateB - dateA; // Descending order
                                } catch {
                                  return 0;
                                }
                              })[0];
                            
                            if (latestPhase?.startDate) {
                              return (
                                <p className="text-xs text-gray-500 mt-1">
                                  Cập nhật: {formatDateDisplay(latestPhase.startDate)}
                                </p>
                              );
                            }
                            // Fallback to createAt if no phases
                            if (plan.createAt) {
                              return (
                                <p className="text-xs text-gray-500 mt-1">
                                  Cập nhật: {formatDateDisplay(plan.createAt)}
                                </p>
                              );
                            }
                            return null;
                          })()}
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
        <div className="flex-1 overflow-y-auto bg-gray-50 relative">
          {/* Mobile sidebar toggle button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-md shadow-md border border-gray-200 hover:bg-gray-50"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {!selectedPlan ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Chọn một phác đồ ở bên trái để xem chi tiết</p>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Header Section */}
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                {/* Title and Status */}
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
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
                    {selectedPlan.createAt && (
                      <p className="text-xs text-gray-500">
                        Ngày tạo: {formatDateDisplay(selectedPlan.createAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(selectedPlan)}
                      className="flex items-center gap-2 flex-1 sm:flex-initial"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span className="hidden sm:inline">Tải xuống phác đồ</span>
                      <span className="sm:hidden">Tải xuống</span>
                    </Button>
                  </div>
                </div>

                {/* Description Section */}
                {selectedPlan.description && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Mô tả</h3>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {selectedPlan.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                {selectedPlan.notes && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Ghi chú</h3>
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {selectedPlan.notes}
                      </p>
                    </div>
                  </div>
                )}

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
                      Tổng tiến trình
                    </p>
                    <p className="text-lg font-semibold text-amber-900">
                      {phases.length || 0}
                    </p>
                  </div>
                </div>

              </div>

                {/* Đội ngũ điều trị */}
                <Card className="p-4 sm:p-6">
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
                <Card className="p-4 sm:p-6">
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
                                {getStatusIcon(getStatusByEndDate(phase.status, phase.endDate))}
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
                                        {formatDateDisplay(phase.startDate)}
                                      </span>
                                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200">
                                        Tiến trình {phase.phaseNumber}
                                      </Badge>
                                    </div>
                                  </div>
                                  <Badge className={`text-xs ${getStatusBadgeClass(getStatusByEndDate(phase.status, phase.endDate))}`}>
                                    {getStatusText(getStatusByEndDate(phase.status, phase.endDate))}
                                  </Badge>
                                </div>

                                {/* Description */}
                                {phase.description && (
                                  <div className="mb-3 space-y-3">
                                    {/* Mô tả - phần trước "Ghi chú:" */}
                                    {extractDescriptionBeforeNote(phase.description) && (
                                      <div>
                                        <h5 className="text-xs font-semibold text-gray-600 mb-1">Mô tả</h5>
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                          {extractDescriptionBeforeNote(phase.description)}
                                        </p>
                                      </div>
                                    )}
                                    
                                    {/* Ghi chú - phần sau "Ghi chú:" */}
                                    {extractNote(phase.description) && (
                                      <div className="pt-2 border-t border-gray-200">
                                        <h5 className="text-xs font-semibold text-gray-600 mb-1">Ghi chú</h5>
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                          {extractNote(phase.description)}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs mb-3">
                                  {phase.startDate && (
                                    <div>
                                      <span className="text-gray-500 font-medium">Ngày bắt đầu: </span>
                                      <span className="text-gray-900">{formatDateDisplay(phase.startDate)}</span>
                                    </div>
                                  )}
                                  {phase.endDate && (
                                    <div>
                                      <span className="text-gray-500 font-medium">Ngày kết thúc: </span>
                                      <span className="text-gray-900">{formatDateDisplay(phase.endDate)}</span>
                                    </div>
                                  )}
                                  {(() => {
                                    const phaseCost = calculatePhaseCost(phase);
                                    if (phaseCost > 0) {
                                      return (
                                        <div>
                                          <span className="text-gray-500 font-medium">Chi phí: </span>
                                          <CostTooltip phase={phase}>
                                            <span className="text-gray-900 font-medium">
                                              {new Intl.NumberFormat('vi-VN').format(phaseCost) + ' ₫'}
                                            </span>
                                          </CostTooltip>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
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

                                {/* Images - Chia 3 phần như PatientInitialExamination */}
                                {phase.listImage && phase.listImage.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <div className="flex items-center gap-2 mb-4">
                                      <ImageIcon className="h-4 w-4 text-gray-500" />
                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Hình ảnh
                                      </p>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                      {/* Ảnh răng */}
                                      {(() => {
                                        const teethImages = phase.listImage.filter(img => 
                                          img.type === 'treatmentPhasesTeeth' || img.type === 'examinationTeeth'
                                        );
                                        return (
                                          <div className="space-y-3">
                                            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                                              <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                                                Ảnh răng
                                              </Badge>
                                              <span className="text-xs text-gray-500">({teethImages.length})</span>
                                            </div>
                                            {teethImages.length > 0 ? (
                                              <div className="space-y-2">
                                                {teethImages.map((img, idx) => (
                                                  <div
                                                    key={idx}
                                                    className="group cursor-pointer relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all duration-300"
                                                    onClick={() => img.url && setSelectedImage(img.url)}
                                                  >
                                                    <img
                                                      src={img.url}
                                                      alt="Ảnh răng"
                                                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                                                      <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <p className="text-sm text-gray-400 text-center py-4">Không có ảnh răng</p>
                                            )}
                                          </div>
                                        );
                                      })()}

                                      {/* Ảnh mặt */}
                                      {(() => {
                                        const faceImages = phase.listImage.filter(img => 
                                          img.type === 'treatmentPhasesFace' || img.type === 'examinationFace'
                                        );
                                        return (
                                          <div className="space-y-3">
                                            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                                              <Badge className="bg-green-100 text-green-800 border-green-300">
                                                Ảnh mặt
                                              </Badge>
                                              <span className="text-xs text-gray-500">({faceImages.length})</span>
                                            </div>
                                            {faceImages.length > 0 ? (
                                              <div className="space-y-2">
                                                {faceImages.map((img, idx) => (
                                                  <div
                                                    key={idx}
                                                    className="group cursor-pointer relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-green-500 transition-all duration-300"
                                                    onClick={() => img.url && setSelectedImage(img.url)}
                                                  >
                                                    <img
                                                      src={img.url}
                                                      alt="Ảnh mặt"
                                                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                                                      <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <p className="text-sm text-gray-400 text-center py-4">Không có ảnh mặt</p>
                                            )}
                                          </div>
                                        );
                                      })()}

                                      {/* Ảnh X-quang */}
                                      {(() => {
                                        const xrayImages = phase.listImage.filter(img => 
                                          img.type === 'treatmentPhasesXray' || img.type === 'examinationXray'
                                        );
                                        return (
                                          <div className="space-y-3">
                                            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                                              <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                                                Ảnh X-quang
                                              </Badge>
                                              <span className="text-xs text-gray-500">({xrayImages.length})</span>
                                            </div>
                                            {xrayImages.length > 0 ? (
                                              <div className="space-y-2">
                                                {xrayImages.map((img, idx) => (
                                                  <div
                                                    key={idx}
                                                    className="group cursor-pointer relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-purple-500 transition-all duration-300"
                                                    onClick={() => img.url && setSelectedImage(img.url)}
                                                  >
                                                    <img
                                                      src={img.url}
                                                      alt="Ảnh X-quang"
                                                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                                                      <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <p className="text-sm text-gray-400 text-center py-4">Không có ảnh X-quang</p>
                                            )}
                                          </div>
                                        );
                                      })()}
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
