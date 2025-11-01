import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Input, Alert } from '@/components/ui';
import { FileTextOutlined, TeamOutlined, HistoryOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { showNotification } from '@/components/ui';
import apiClient from '@/services/api/client';

interface ExaminationListItem {
  id: string;
  symptoms: string;
  diagnosis: string;
  notes: string;
  treatment: string;
  examined_at?: string; // doctor name
  createAt?: string;    // dd/MM/yyyy
}

interface ExaminationDetail extends ExaminationListItem {
  totalCost?: number;
  listImage?: { publicId: string; url: string }[];
}

const PatientInitialExamination = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [examinations, setExaminations] = useState<ExaminationListItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ExaminationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    setFetching(true);
    setError(null);
    apiClient.get('/api/v1/patient/myExamination')
      .then(res => {
        setExaminations(res.data.result || res.data || []);
      })
      .catch(() => setError('Không thể tải hồ sơ khám ban đầu'))
      .finally(() => setFetching(false));
  }, []);

  const totalVisits = examinations.length;
  const doctorCount = useMemo(() => {
    const setD = new Set<string>();
    examinations.forEach(e => { if (e.examined_at) setD.add(e.examined_at); });
    return setD.size;
  }, [examinations]);
  const latestDate = useMemo(() => {
    // createAt format dd/MM/yyyy; convert to comparable YYYYMMDD
    const toKey = (d?: string) => {
      if (!d) return '';
      const [dd, mm, yyyy] = d.split('/');
      return `${yyyy}${mm}${dd}`;
    };
    const max = examinations.reduce((acc, cur) => {
      const k = toKey(cur.createAt);
      return k > acc.k ? { k, v: cur.createAt } : acc;
    }, { k: '', v: '' as string });
    return max.v;
  }, [examinations]);

  const openDetail = (id: string) => {
    setDetailId(id);
    setDetail(null);
    setDetailLoading(true);
    apiClient.get(`/api/v1/patient/examination/${id}`)
      .then(res => setDetail(res.data.result || res.data))
      .catch(() => showNotification.error('Không thể tải chi tiết hồ sơ'))
      .finally(() => setDetailLoading(false));
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return examinations.slice(start, start + pageSize);
  }, [examinations, page]);
  const totalPages = Math.ceil(examinations.length / pageSize) || 1;

  const avatarOf = (name?: string) => {
    const ch = (name || '?').trim().charAt(0).toUpperCase();
    return ch || 'U';
  };

  const handleAddExamination = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showNotification.success('Thêm hồ sơ khám thành công!');
      setIsAdding(false);
    } catch (error) {
      showNotification.error('Có lỗi xảy ra khi thêm hồ sơ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="pl-4 sm:pl-6 lg:pl-8 pr-0">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hồ sơ khám ban đầu</h1>
              <p className="text-gray-600 mt-1">
                Lịch sử khám bệnh và chẩn đoán ban đầu
              </p>
            </div>
            {/* Nút thêm hồ sơ được ẩn theo yêu cầu */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-0 py-8">
        {error && <Alert variant="error" message={error} className="mb-6" />}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 flex items-center gap-3">
            <div className="text-blue-600 text-2xl"><FileTextOutlined /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Tổng số lần khám</p>
              <p className="text-2xl font-bold text-gray-900">{totalVisits}</p>
            </div>
          </Card>
          <Card className="p-6 flex items-center gap-3">
            <div className="text-green-600 text-2xl"><TeamOutlined /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Bác sĩ đã khám</p>
              <p className="text-2xl font-bold text-gray-900">{doctorCount}</p>
            </div>
          </Card>
          <Card className="p-6 flex items-center gap-3">
            <div className="text-purple-600 text-2xl"><HistoryOutlined /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Lần khám gần nhất</p>
              <p className="text-lg font-bold text-gray-900">{latestDate || '-'}</p>
            </div>
          </Card>
        </div>

        {/* Examination Records */}
        <div className="space-y-6">
          {!fetching && paginated.map((examination, idx) => (
            <Card key={examination.id} className="p-6">
              <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Lần khám ngày {examination.createAt || '-'}
                  </h3>
                  <p className="text-gray-600 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                      {avatarOf(examination.examined_at)}
                    </span>
                    Bác sĩ: {examination.examined_at || '-'}
                  </p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 self-start">
                  Hoàn thành
                </span>
              </div>

              {expandedIds.has(examination.id) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Triệu chứng</h4>
                    <p className="text-gray-700 text-sm">{examination.symptoms || '-'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Chẩn đoán</h4>
                    <p className="text-gray-700 text-sm">{examination.diagnosis || '-'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Điều trị</h4>
                    <p className="text-gray-700 text-sm">{examination.treatment || '-'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Ghi chú</h4>
                    <p className="text-gray-700 text-sm">{examination.notes || '-'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-gray-700 text-sm">
                  {examination.symptoms || '-'}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => toggleExpand(examination.id)} aria-label="Mở rộng/Thu gọn">
                    {expandedIds.has(examination.id) ? 'Thu gọn' : 'Mở rộng'}
                  </Button>
                  <div className="flex justify-end gap-2">
                    <Button aria-label="Xem chi tiết khám" variant="outline" size="sm" onClick={() => openDetail(examination.id)}>
                      <span className="flex items-center gap-1"><EyeOutlined /> Xem chi tiết</span>
                    </Button>
                    <Button aria-label="Tải xuống hồ sơ" variant="primary" size="sm">
                      <span className="flex items-center gap-1"><DownloadOutlined /> Tải xuống</span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {fetching && <Card className="p-6">Đang tải hồ sơ...</Card>}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}>Trước</Button>
            <span className="text-sm text-gray-600">Trang {page}/{totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}>Sau</Button>
          </div>
        )}

        {/* Detail Modal */}
        {detailId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Chi tiết hồ sơ khám</h3>
                  <button onClick={() => setDetailId(null)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
                {detailLoading && <div>Đang tải...</div>}
                {!detailLoading && detail && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><span className="font-medium">Ngày khám:</span> {detail.createAt || '-'}</div>
                      <div><span className="font-medium">Bác sĩ:</span> {detail.examined_at || '-'}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="font-medium mb-1">Triệu chứng</div>
                        <div className="text-sm text-gray-700">{detail.symptoms || '-'}</div>
                      </div>
                      <div>
                        <div className="font-medium mb-1">Chẩn đoán</div>
                        <div className="text-sm text-gray-700">{detail.diagnosis || '-'}</div>
                      </div>
                      <div>
                        <div className="font-medium mb-1">Điều trị</div>
                        <div className="text-sm text-gray-700">{detail.treatment || '-'}</div>
                      </div>
                      <div>
                        <div className="font-medium mb-1">Ghi chú</div>
                        <div className="text-sm text-gray-700">{detail.notes || '-'}</div>
                      </div>
                    </div>
                    {!!detail.totalCost && (
                      <div><span className="font-medium">Chi phí:</span> {detail.totalCost.toLocaleString()} đ</div>
                    )}
                    {detail.listImage && detail.listImage.length > 0 && (
                      <div>
                        <div className="font-medium mb-2">Hình ảnh</div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {detail.listImage.map((img, idx) => (
                            <img key={idx} src={img.url} alt="examination" className="rounded-md border" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Add New Examination Modal (kept; not wired to BE) */}
        {isAdding && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Thêm hồ sơ khám mới
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
                        Ngày khám
                      </label>
                      <Input type="date" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bác sĩ khám
                      </label>
                      <Input placeholder="Tên bác sĩ" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Triệu chứng
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mô tả triệu chứng..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chẩn đoán
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Chẩn đoán của bác sĩ..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phương pháp điều trị
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Phương pháp điều trị..."
                    />
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
                      onClick={handleAddExamination}
                      variant="primary"
                      loading={isLoading}
                    >
                      Lưu hồ sơ
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

export default PatientInitialExamination;
