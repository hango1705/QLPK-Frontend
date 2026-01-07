import React, { useEffect, useMemo, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  Button, 
  Input, 
  Alert, 
  AlertTitle, 
  AlertDescription, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  Badge,
  Separator
} from '@/components/ui';
import { 
  FileText, 
  Users, 
  Calendar, 
  Download, 
  Eye, 
  ChevronDown, 
  ChevronUp,
  Stethoscope,
  Activity,
  ClipboardList,
  MessageSquare,
  Image as ImageIcon,
  DollarSign,
  User,
  Clock,
  CheckCircle2,
  Loader2,
  Pill
} from 'lucide-react';
import { showNotification } from '@/components/ui';
import { patientAPI } from '@/services/api/patient';
import ImageViewer from '@/components/ui/ImageViewer';
import type { DentalServiceOrder, PrescriptionOrder } from '@/types/doctor';

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
  listImage?: Array<{ publicId: string; url: string; type: string }>;
  listDentalServicesEntityOrder?: DentalServiceOrder[];
  listPrescriptionOrder?: PrescriptionOrder[];
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    setFetching(true);
    setError(null);
    patientAPI.getMyExaminations()
      .then(data => {
        setExaminations(data);
      })
      .catch(() => setError('Không thể tải hồ sơ khám'))
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
    patientAPI.getExaminationById(id)
      .then(data => setDetail(data))
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

  const getImageTypeLabel = (type: string) => {
    switch (type) {
      case 'examinationTeeth':
        return 'Ảnh răng';
      case 'examinationFace':
        return 'Ảnh mặt';
      case 'examinationXray':
        return 'Ảnh X-quang';
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Match horizontal padding / width with other patient pages (BasicInfo, TreatmentPlan, Payment) */}
      <div className="px-0 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6 shadow-md">
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards - Redesigned */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-blue-100 text-sm font-medium mb-1">Tổng số lần khám</p>
                  <p className="text-4xl font-bold">{totalVisits}</p>
                </div>
                <div className="bg-white/20 rounded-full p-4">
                  <FileText className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-green-100 text-sm font-medium mb-1">Bác sĩ đã khám</p>
                  <p className="text-4xl font-bold">{doctorCount}</p>
                </div>
                <div className="bg-white/20 rounded-full p-4">
                  <Users className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-purple-100 text-sm font-medium mb-1">Lần khám gần nhất</p>
                  <p className="text-2xl font-bold">{latestDate || '-'}</p>
                </div>
                <div className="bg-white/20 rounded-full p-4">
                  <Calendar className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Examination Records - Redesigned */}
        <div className="space-y-4">
          {fetching ? (
            <Card className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Đang tải hồ sơ khám...</p>
            </Card>
          ) : paginated.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có hồ sơ khám</h3>
              <p className="text-gray-600">Bạn chưa có hồ sơ khám nào trong hệ thống.</p>
            </Card>
          ) : (
            paginated.map((examination, idx) => (
              <Card 
                key={examination.id} 
                // Remove default padding so header background dính sát mép trên của card
                className="border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden p-0"
              >
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 pt-4 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-600 text-white rounded-lg p-2">
                          <Stethoscope className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-gray-900">
                            Lần khám ngày {examination.createAt || '-'}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-600 flex items-center gap-1">
                              <User className="h-4 w-4" />
                              Bác sĩ: {examination.examined_at || 'Chưa xác định'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Hoàn thành
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {expandedIds.has(examination.id) ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="h-4 w-4 text-blue-600" />
                            <h4 className="font-semibold text-gray-900">Triệu chứng</h4>
                          </div>
                          <p className="text-gray-700 text-sm bg-gray-50 rounded-lg p-3 border border-gray-200">
                            {examination.symptoms || 'Không có thông tin'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-2">
                            <ClipboardList className="h-4 w-4 text-green-600" />
                            <h4 className="font-semibold text-gray-900">Chẩn đoán</h4>
                          </div>
                          <p className="text-gray-700 text-sm bg-gray-50 rounded-lg p-3 border border-gray-200">
                            {examination.diagnosis || 'Không có thông tin'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Stethoscope className="h-4 w-4 text-purple-600" />
                            <h4 className="font-semibold text-gray-900">Điều trị</h4>
                          </div>
                          <p className="text-gray-700 text-sm bg-gray-50 rounded-lg p-3 border border-gray-200">
                            {examination.treatment || 'Không có thông tin'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-orange-600" />
                            <h4 className="font-semibold text-gray-900">Ghi chú</h4>
                          </div>
                          <p className="text-gray-700 text-sm bg-gray-50 rounded-lg p-3 border border-gray-200">
                            {examination.notes || 'Không có ghi chú'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <Activity className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-gray-700 text-sm font-medium mb-1">Triệu chứng chính:</p>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {examination.symptoms || 'Không có thông tin'}
                        </p>
                      </div>
                    </div>
                  )}

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <Button 
                      variant="outline" 
                      size="sm"  
                      onClick={() => toggleExpand(examination.id)}
                      // Width vừa phải nhưng vẫn đủ chỗ cho icon + text trên một hàng
                      className="px-3 min-w-[110px]"
                    >
                      {expandedIds.has(examination.id) ? (
                        <span className="inline-flex items-center justify-center gap-2 w-full">
                          <ChevronUp className="h-4 w-4" />
                          Thu gọn
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-2 w-full">
                          <ChevronDown className="h-4 w-4" />
                          Mở rộng
                        </span>
                      )}
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openDetail(examination.id)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Xem chi tiết
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm"
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <Download className="h-4 w-4" />
                        Tải xuống
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination - Redesigned */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-8">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.max(1, p-1))} 
              disabled={page === 1}
              className="gap-2"
            >
              <ChevronUp className="h-4 w-4 rotate-[-90deg]" />
              Trước
            </Button>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border shadow-sm">
              <span className="text-sm font-medium text-gray-700">
                Trang <span className="font-bold text-blue-600">{page}</span> / {totalPages}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.min(totalPages, p+1))} 
              disabled={page === totalPages}
              className="gap-2"
            >
              Sau
              <ChevronUp className="h-4 w-4 rotate-90" />
            </Button>
          </div>
        )}

        {/* Detail Modal - Redesigned */}
        <Dialog open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Chi tiết hồ sơ khám</DialogTitle>
              <DialogDescription>
                Thông tin chi tiết về lần khám này
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6">
              {detailLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                  <p className="text-gray-600">Đang tải chi tiết...</p>
                </div>
              ) : detail ? (
                <div className="space-y-6">
                  {/* Header Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600 text-white rounded-lg p-2">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 uppercase">Ngày khám</p>
                        <p className="text-sm font-semibold text-gray-900">{detail.createAt || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-green-600 text-white rounded-lg p-2">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 uppercase">Bác sĩ</p>
                        <p className="text-sm font-semibold text-gray-900">{detail.examined_at || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Activity className="h-5 w-5 text-blue-600" />
                          Triệu chứng
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {detail.symptoms || 'Không có thông tin'}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <ClipboardList className="h-5 w-5 text-green-600" />
                          Chẩn đoán
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {detail.diagnosis || 'Không có thông tin'}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Stethoscope className="h-5 w-5 text-purple-600" />
                          Điều trị
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {detail.treatment || 'Không có thông tin'}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-orange-600" />
                          Ghi chú
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {detail.notes || 'Không có ghi chú'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Selected Services */}
                  {detail.listDentalServicesEntityOrder && detail.listDentalServicesEntityOrder.length > 0 && (
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <ClipboardList className="h-5 w-5 text-blue-600" />
                          Dịch vụ đã sử dụng
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {detail.listDentalServicesEntityOrder.map((service, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900">{service.name}</p>
                                <p className="text-xs text-gray-600">
                                  {service.quantity} {service.unit} ×{' '}
                                  {service.unitPrice.toLocaleString('vi-VN')} đ
                                </p>
                              </div>
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                                {(service.cost ?? service.unitPrice * service.quantity).toLocaleString('vi-VN')} đ
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Prescribed Medicines */}
                  {detail.listPrescriptionOrder && detail.listPrescriptionOrder.length > 0 && (
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Pill className="h-5 w-5 text-purple-600" />
                          Thuốc được kê đơn
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {detail.listPrescriptionOrder.map((pres, index) => (
                            <div
                              key={index}
                              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{pres.name}</p>
                                  <p className="text-xs text-gray-600">
                                    {pres.dosage} · {pres.frequency} · {pres.duration}
                                  </p>
                                </div>
                                <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                                  {pres.quantity} viên
                                </Badge>
                              </div>
                              {pres.notes && (
                                <p className="mt-1 text-xs text-gray-600 italic">
                                  Ghi chú: {pres.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Cost */}
                  {detail.totalCost && (
                    <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-600 text-white rounded-lg p-2">
                            <DollarSign className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase">Tổng chi phí</p>
                            <p className="text-xl font-bold text-gray-900">
                              {detail.totalCost.toLocaleString('vi-VN')} đ
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Images */}
                  {detail.listImage && detail.listImage.length > 0 && (
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <ImageIcon className="h-5 w-5 text-blue-600" />
                          Hình ảnh ({detail.listImage.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {detail.listImage.map((img, idx) => (
                            <div 
                              key={idx} 
                              className="group cursor-pointer relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all duration-300"
                              onClick={() => img.url && setSelectedImage(img.url)}
                            >
                              <div className="absolute top-2 left-2 z-10">
                                <Badge className="bg-blue-600 text-white shadow-md">
                                  {getImageTypeLabel(img.type || '')}
                                </Badge>
                              </div>
                              <img 
                                src={img.url} 
                                alt={`examination ${img.type || ''}`} 
                                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                                <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>

        {/* Add New Examination Modal */}
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thêm hồ sơ khám mới</DialogTitle>
              <DialogDescription>
                Thêm hồ sơ khám mới cho bệnh nhân
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
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
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Đang lưu...
                      </>
                    ) : (
                      'Lưu hồ sơ'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ImageViewer
        open={!!selectedImage}
        imageUrl={selectedImage}
        alt="Examination image"
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
};

export default PatientInitialExamination;
