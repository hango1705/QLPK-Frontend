import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Input, Alert } from '@/components/ui';
import { showNotification } from '@/components/ui';
import apiClient from '@/services/api/client';

interface TreatmentPlanApi {
  id: string;
  title: string;
  description: string;
  duration: string;
  notes: string;
  status: string; // free text from BE
  totalCost?: number;
  doctorFullname?: string;
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

  useEffect(() => {
    setFetching(true);
    setError(null);
    apiClient.get('/api/v1/patient/myTreatmentPlans')
      .then(res => setTreatmentPlans(res.data.result || res.data || []))
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
              <p className="text-gray-600 mt-1">
                Kế hoạch điều trị được bác sĩ chỉ định
              </p>
            </div>
            {/* Ẩn nút thêm phác đồ theo yêu cầu */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-0 py-8">
        {error && <Alert variant="error" message={error} className="mb-6" />}
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
                    <Button variant="outline" size="sm">Xem chi tiết</Button>
                    <Button variant="primary" size="sm">Tải xuống</Button>
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
        {isAdding && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Thêm phác đồ điều trị mới
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
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientTreatmentPlan;
