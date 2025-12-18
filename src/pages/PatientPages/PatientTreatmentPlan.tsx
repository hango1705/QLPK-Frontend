111111111111111111111111111111111111111111import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Input, Alert, AlertTitle, AlertDescription, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui';
import { showNotification } from '@/components/ui';
import { patientAPI } from '@/services/api/patient';
import { doctorAPI } from '@/services/api/doctor';
import { nurseAPI } from '@/services/api/nurse';
import type { TreatmentPhase } from '@/types/doctor';
import type { DoctorSummary } from '@/types/doctor';
import type { NurseInfo } from '@/services/api/nurse';
import { pdf } from '@react-pdf/renderer';
import TreatmentPlanPDF from './PatientTreatmentPlan/TreatmentPlanPDF';

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
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlanApi[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 5;
  
  // Dialog states
  const [showPhasesDialog, setShowPhasesDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [phases, setPhases] = useState<TreatmentPhase[]>([]);
  const [loadingPhases, setLoadingPhases] = useState(false);
  
  const [showDoctorDialog, setShowDoctorDialog] = useState(false);
  const [showNurseDialog, setShowNurseDialog] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState<DoctorSummary | null>(null);
  const [nurseInfo, setNurseInfo] = useState<NurseInfo | null>(null);
  const [loadingDoctor, setLoadingDoctor] = useState(false);
  const [loadingNurse, setLoadingNurse] = useState(false);

  useEffect(() => {
    setFetching(true);
    setError(null);
    patientAPI.getMyTreatmentPlans()
      .then(data => setTreatmentPlans(data))
      .catch(() => setError('Không thể tải phác đồ điều trị'))
      .finally(() => setFetching(false));
  }, []);

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

  const handleAddPlan = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showNotification.success('Thêm phác đồ điều trị thành công!');
      setIsAdding(false);
    } catch (error) {
      showNotification.error('Có lỗi xảy ra khi thêm phác đồ');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
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

  const handleViewPhases = async (planId: string) => {
    setSelectedPlanId(planId);
    setShowPhasesDialog(true);
    setLoadingPhases(true);
    try {
      const phasesData = await doctorAPI.getTreatmentPhases(planId);
      setPhases(phasesData);
    } catch (error) {
      showNotification.error('Không thể tải danh sách tiến trình');
      setPhases([]);
    } finally {
      setLoadingPhases(false);
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

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return treatmentPlans.slice(start, start + pageSize);
  }, [treatmentPlans, page]);
  const totalPages = Math.ceil(treatmentPlans.length / pageSize) || 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="pl-4 sm:pl-6 lg:pl-8 pr-0">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Phác đồ điều trị</h1>
            </div>
            {/* Ẩn nút thêm phác đồ theo yêu cầu */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-0 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-500">Tổng phác đồ</p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-500">Đang thực hiện</p>
            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-500">Hoàn thành</p>
            <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-500">Tạm dừng</p>
            <p className="text-2xl font-bold text-gray-900">{pausedCount}</p>
          </Card>
        </div>

        {/* Treatment Plans */}
        <div className="space-y-6">
          {!fetching && paginated.map((plan) => (
            <Card key={plan.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {plan.title}
                  </h3>
                  <p className="text-gray-600 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                      {avatarOf(plan.doctorFullname)}
                    </span>
                    Bác sĩ: {plan.doctorFullname || '-'} • Ngày: {plan.createAt || '-'}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                  {getStatusText(plan.status)}
                </span>
              </div>

              {expandedIds.has(plan.id) ? (
                <>
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Mô tả</h4>
                    <p className="text-gray-700 text-sm">{plan.description || '-'}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Thời gian điều trị</h4>
                      <p className="text-gray-700 text-sm">{plan.duration || '-'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Ghi chú</h4>
                      <p className="text-gray-700 text-sm">{plan.notes || '-'}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-gray-700 text-sm">{plan.description || '-'}</div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => toggleExpand(plan.id)}>
                    {expandedIds.has(plan.id) ? 'Thu gọn' : 'Mở rộng'}
                  </Button>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewPhases(plan.id)}>
                      Xem chi tiết
                    </Button>
                    {plan.doctorId && (
                      <Button variant="outline" size="sm" onClick={() => handleViewDoctor(plan.doctorId!)}>
                        Xem thông tin bác sĩ
                      </Button>
                    )}
                    {plan.nurseId && (
                      <Button variant="outline" size="sm" onClick={() => handleViewNurse(plan.nurseId!)}>
                        Xem thông tin y tá
                      </Button>
                    )}
                    <Button variant="primary" size="sm" onClick={() => handleDownloadPDF(plan)}>
                      Tải xuống
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {fetching && <Card className="p-6">Đang tải phác đồ...</Card>}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}>Trước</Button>
            <span className="text-sm text-gray-600">Trang {page}/{totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}>Sau</Button>
          </div>
        )}

        {/* Add New Treatment Plan Modal */}
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thêm phác đồ điều trị mới</DialogTitle>
              <DialogDescription>
                Tạo phác đồ điều trị mới cho bệnh nhân
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">

                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên phác đồ
                      </label>
                      <Input placeholder="Tên phác đồ điều trị" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bác sĩ chỉ định
                      </label>
                      <Input placeholder="Tên bác sĩ" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mô tả phác đồ điều trị..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Thời gian điều trị
                      </label>
                      <Input placeholder="Ví dụ: 2 tuần" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trạng thái
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="active">Đang thực hiện</option>
                        <option value="paused">Tạm dừng</option>
                        <option value="completed">Hoàn thành</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ghi chú
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ghi chú thêm..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button 
                      onClick={() => setIsAdding(false)} 
                      variant="outline"
                    >
                      Hủy
                    </Button>
                    <Button 
                      onClick={handleAddPlan}
                      variant="primary"
                      loading={isLoading}
                    >
                      Lưu phác đồ
                    </Button>
                  </div>
                </form>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog hiển thị các tiến trình */}
        <Dialog open={showPhasesDialog} onOpenChange={(open) => {
          if (!open) {
            setShowPhasesDialog(false);
            setSelectedPlanId(null);
            setPhases([]);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Danh sách tiến trình điều trị</DialogTitle>
            </DialogHeader>
            <div className="mt-4">

                {loadingPhases ? (
                  <div className="text-center py-8">Đang tải...</div>
                ) : phases.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Chưa có tiến trình nào</div>
                ) : (
                  <div className="space-y-4">
                    {phases.map((phase, index) => (
                      <Card key={phase.id || index} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">
                            Tiến trình {phase.phaseNumber}
                          </h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            phase.status?.toLowerCase().includes('hoàn') 
                              ? 'bg-blue-100 text-blue-800'
                              : phase.status?.toLowerCase().includes('tạm')
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {phase.status || 'Đang thực hiện'}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm mb-2">{phase.description || '-'}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Ngày bắt đầu: </span>
                            <span className="text-gray-900">{phase.startDate || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Ngày kết thúc: </span>
                            <span className="text-gray-900">{phase.endDate || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Chi phí: </span>
                            <span className="text-gray-900">
                              {phase.cost ? new Intl.NumberFormat('vi-VN').format(phase.cost) + ' VNĐ' : '-'}
                            </span>
                          </div>
                          {phase.nextAppointment && (
                            <div>
                              <span className="text-gray-500">Lịch hẹn tiếp theo: </span>
                              <span className="text-gray-900">{phase.nextAppointment}</span>
                            </div>
                          )}
                        </div>
                        {phase.listComment && phase.listComment.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Nhận xét:</h5>
                            <div className="space-y-1">
                              {phase.listComment.map((comment, idx) => (
                                <p key={idx} className="text-xs text-gray-600">{comment}</p>
                              ))}
                            </div>
                          </div>
                        )}
                        {phase.listImage && phase.listImage.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Hình ảnh</h5>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {phase.listImage.map((img, idx) => {
                                // Map type từ database sang label tiếng Việt
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
                                      return type; // Fallback nếu có type khác
                                  }
                                };

                                return (
                                  <div key={idx} className="flex flex-col">
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-600 text-white shadow-sm mb-2 w-fit">
                                      {getImageTypeLabel(img.type || '')}
                                    </span>
                                    <img 
                                      src={img.url} 
                                      alt={`treatment phase ${img.type || ''}`} 
                                      className="rounded-md border w-full h-auto"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
            </div>
          </DialogContent>
        </Dialog>

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
      </div>
    </div>
  );
};

export default PatientTreatmentPlan;
