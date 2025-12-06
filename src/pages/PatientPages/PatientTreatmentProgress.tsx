import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Input, Alert, AlertTitle, AlertDescription } from '@/components/ui';
import { showNotification } from '@/components/ui';
import { patientAPI } from '@/services/api/patient';
import { doctorAPI } from '@/services';

interface TreatmentPhasesApi {
  id: string;
  phaseNumber: string;
  description: string;
  status: string; // Inprogress/Completed
  startDate?: string; // dd/MM/yyyy
  endDate?: string;
  nextAppointment?: string; // ISO string
  listImage?: Array<{ publicId?: string; url: string }>; // from BE
}

interface TreatmentPlanApi {
  id: string;
  title: string;
  notes?: string;
  doctorFullname?: string;
}

interface TreatmentProgress {
  id: string;
  date: string;
  treatmentPlan: string;
  doctor: string;
  progress: number; // 0-100 (approx)
  status: 'ongoing' | 'completed' | 'delayed';
  description: string;
  nextAppointment?: string;
  notes: string;
  attachments: string[];
}

const PatientTreatmentProgress = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [progressRecords, setProgressRecords] = useState<TreatmentProgress[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true); setError(null);
      try {
        const plans = await patientAPI.getMyTreatmentPlans();
        const allPhases: TreatmentProgress[] = [];
        for (const plan of plans) {
          try {
            const phases = await doctorAPI.getTreatmentPhases(plan.id);
            phases.forEach(ph => {
              const statusNorm = (ph.status || '').toLowerCase().includes('inprogress') ? 'ongoing' : 'completed';
              allPhases.push({
                id: ph.id,
                date: ph.startDate || '-',
                treatmentPlan: plan.title,
                doctor: plan.doctorFullname || '-',
                progress: statusNorm === 'completed' ? 100 : 50,
                status: statusNorm as 'ongoing' | 'completed' | 'delayed',
                description: ph.description || '',
                nextAppointment: ph.nextAppointment,
                notes: plan.notes || '',
                attachments: (ph.listImage || []).map(img => img.url).filter(Boolean),
              });
            });
          } catch (e) {
            // ignore per-plan errors
          }
        }
        setProgressRecords(allPhases);
      } catch (e) {
        setError('Không thể tải tiến trình điều trị');
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  const completedCount = useMemo(() => progressRecords.filter(p => p.status === 'completed').length, [progressRecords]);
  const ongoingCount = useMemo(() => progressRecords.filter(p => p.status === 'ongoing').length, [progressRecords]);
  const delayedCount = useMemo(() => progressRecords.filter(p => p.status === 'delayed').length, [progressRecords]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'delayed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'Đang thực hiện';
      case 'completed':
        return 'Hoàn thành';
      case 'delayed':
        return 'Chậm tiến độ';
      default:
        return 'Không xác định';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const total = progressRecords.length;

  const avatarOf = (name?: string) => {
    const ch = (name || '?').trim().charAt(0).toUpperCase();
    return ch || 'U';
  };

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return progressRecords.slice(start, start + pageSize);
  }, [progressRecords, page]);
  const totalPages = Math.ceil(progressRecords.length / pageSize) || 1;

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="pl-4 sm:pl-6 lg:pl-8 pr-0">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tiến trình điều trị</h1>
              <p className="text-gray-600 mt-1">
                Theo dõi quá trình điều trị và tiến độ phục hồi
              </p>
            </div>
            {/* Ẩn nút thêm tiến trình */}
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
            <p className="text-sm font-medium text-gray-500">Tổng tiến trình</p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-500">Hoàn thành</p>
            <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-500">Đang thực hiện</p>
            <p className="text-2xl font-bold text-gray-900">{ongoingCount}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-medium text-gray-500">Chậm tiến độ</p>
            <p className="text-2xl font-bold text-gray-900">{delayedCount}</p>
          </Card>
        </div>

        {/* Progress Timeline */}
        <div className="space-y-6">
          {!fetching && paginated.map((record) => (
            <Card key={record.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {record.treatmentPlan}
                  </h3>
                  <p className="text-gray-600 flex items-center gap-2">
                    Ngày: {record.date} • 
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                      {avatarOf(record.doctor)}
                    </span>
                    Bác sĩ: {record.doctor}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                  {getStatusText(record.status)}
                </span>
              </div>

              {expandedIds.has(record.id) ? (
                <>
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Tiến độ</span>
                      <span className="text-sm font-bold text-gray-900">{record.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(record.progress)}`}
                        style={{ width: `${record.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Mô tả tiến trình</h4>
                    <p className="text-gray-700 text-sm">{record.description}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Ghi chú</h4>
                      <p className="text-gray-700 text-sm">{record.notes}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Lịch hẹn tiếp theo</h4>
                      <p className="text-gray-700 text-sm">
                        {record.nextAppointment ? record.nextAppointment : 'Chưa có lịch hẹn'}
                      </p>
                    </div>
                  </div>
                  {record.attachments && record.attachments.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Hình ảnh</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {record.attachments.map((url, idx) => (
                          <a key={idx} href={url} target="_blank" rel="noreferrer" className="block group">
                            <div className="aspect-[4/3] overflow-hidden rounded-md border">
                              <img src={url} alt={`Ảnh tiến trình ${idx+1}`} className="w-full h-full object-cover group-hover:opacity-90" />
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-700 text-sm">{record.description}</div>
              )}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => toggleExpand(record.id)}>
                    {expandedIds.has(record.id) ? 'Thu gọn' : 'Mở rộng'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {fetching && <Card className="p-6">Đang tải tiến trình...</Card>}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}>Trước</Button>
            <span className="text-sm text-gray-600">Trang {page}/{totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}>Sau</Button>
          </div>
        )}

        {/* Add New Progress Modal (ẩn header trigger) */}
        {isAdding && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Thêm tiến trình điều trị
                  </h3>
                  <button
                    onClick={() => setIsAdding(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phác đồ điều trị
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Chọn phác đồ</option>
                        <option value="1">Điều trị viêm nướu</option>
                        <option value="2">Trám răng sâu</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bác sĩ điều trị
                      </label>
                      <Input placeholder="Tên bác sĩ" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày cập nhật
                      </label>
                      <Input type="date" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tiến độ (%)
                      </label>
                      <Input type="number" min="0" max="100" placeholder="0-100" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả tiến trình
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mô tả tiến trình điều trị..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lịch hẹn tiếp theo
                      </label>
                      <Input type="date" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trạng thái
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="ongoing">Đang thực hiện</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="delayed">Chậm tiến độ</option>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tài liệu đính kèm
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">
                        <button type="button" className="font-medium text-blue-600 hover:text-blue-500">
                          Tải lên tài liệu
                        </button>
                        {' '}hoặc kéo thả vào đây
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button 
                      onClick={() => setIsAdding(false)} 
                      variant="outline"
                    >
                      Hủy
                    </Button>
                    <Button 
                      onClick={() => setIsAdding(false)} 
                      variant="primary"
                      loading={isLoading}
                    >
                      Lưu tiến trình
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientTreatmentProgress;
