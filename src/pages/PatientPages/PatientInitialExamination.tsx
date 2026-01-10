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
import { pdf } from '@react-pdf/renderer';
import ExaminationPDF from './PatientInitialExamination/ExaminationPDF';

interface ExaminationListItem {
  id: string;
  symptoms: string;
  diagnosis: string;
  notes: string;
  treatment: string;
  examined_at?: string; // doctor name
  createAt?: string;    // dd/MM/yyyy
}

export interface ExaminationDetail extends ExaminationListItem {
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

  // Store detail data for each examination
  const [detailsMap, setDetailsMap] = useState<Map<string, ExaminationDetail>>(new Map());
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());
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

  const toggleExpand = async (id: string) => {
    setExpandedIds((prev) => {
      const n = new Set(prev);
      const isExpanding = !n.has(id);
      if (isExpanding) {
        n.add(id);
        // Fetch detail if not already loaded
        if (!detailsMap.has(id) && !loadingDetails.has(id)) {
          setLoadingDetails(prev => new Set(prev).add(id));
          patientAPI.getExaminationById(id)
            .then(data => {
              setDetailsMap(prev => new Map(prev).set(id, data));
            })
            .catch(() => {
              showNotification.error('Không thể tải chi tiết hồ sơ');
            })
            .finally(() => {
              setLoadingDetails(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
              });
            });
        }
      } else {
        n.delete(id);
      }
      return n;
    });
  };

  const handleDownloadPDF = async (examination: ExaminationListItem) => {
    try {
      showNotification.info('Đang tạo file PDF...');

      // Fetch detail if not already loaded
      let detail: ExaminationDetail;
      if (detailsMap.has(examination.id)) {
        detail = detailsMap.get(examination.id)!;
      } else {
        // Fetch detail
        detail = await patientAPI.getExaminationById(examination.id);
        setDetailsMap(prev => new Map(prev).set(examination.id, detail));
      }

      // Create PDF document
      const doc = <ExaminationPDF examination={detail} />;

      // Generate PDF blob
      const blob = await pdf(doc).toBlob();

      // Create URL and download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = examination.createAt?.replace(/\//g, '-') || new Date().toISOString().split('T')[0];
      link.download = `Ho-so-kham-${dateStr}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification.success('Tải xuống PDF thành công!');
    } catch (error: any) {
      showNotification.error('Không thể tạo file PDF: ' + (error.message || 'Lỗi không xác định'));
    }
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
                      {/* Basic Info */}
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

                      {/* Loading state */}
                      {loadingDetails.has(examination.id) ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                          <p className="text-gray-600">Đang tải chi tiết...</p>
                        </div>
                      ) : (
                        <>
                          {(() => {
                            const detail = detailsMap.get(examination.id);
                            if (!detail) return null;

                            // Group images by type
                            const teethImages = (detail.listImage || []).filter(img => img.type === 'examinationTeeth');
                            const faceImages = (detail.listImage || []).filter(img => img.type === 'examinationFace');
                            const xrayImages = (detail.listImage || []).filter(img => img.type === 'examinationXray');

                            return (
                              <>
                                {/* Dịch vụ đã sử dụng */}
                                {detail.listDentalServicesEntityOrder && detail.listDentalServicesEntityOrder.length > 0 && (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-3">
                                      <ClipboardList className="h-5 w-5 text-blue-600" />
                                      <h4 className="font-semibold text-gray-900 text-lg">Dịch vụ đã sử dụng</h4>
                                    </div>
                                    <div className="space-y-2">
                                      {detail.listDentalServicesEntityOrder.map((service, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                                        >
                                          <div>
                                            <p className="text-sm font-medium text-gray-900">{service.name}</p>
                                            <p className="text-xs text-gray-600">
                                              {service.quantity} {service.unit} × {service.unitPrice.toLocaleString('vi-VN')} đ
                                            </p>
                                          </div>
                                          <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                                            {(service.cost ?? service.unitPrice * service.quantity).toLocaleString('vi-VN')} đ
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Thuốc đã sử dụng */}
                                {detail.listPrescriptionOrder && detail.listPrescriptionOrder.length > 0 && (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-3">
                                      <Pill className="h-5 w-5 text-purple-600" />
                                      <h4 className="font-semibold text-gray-900 text-lg">Thuốc đã sử dụng</h4>
                                    </div>
                                    <div className="space-y-2">
                                      {detail.listPrescriptionOrder.map((pres, index) => (
                                        <div
                                          key={index}
                                          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
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
                                            <p className="mt-2 text-xs text-gray-600 italic">
                                              Ghi chú: {pres.notes}
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Hình ảnh - Chia 3 phần */}
                                {detail.listImage && detail.listImage.length > 0 && (
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-4">
                                      <ImageIcon className="h-5 w-5 text-blue-600" />
                                      <h4 className="font-semibold text-gray-900 text-lg">Hình ảnh</h4>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                      {/* Ảnh răng */}
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

                                      {/* Ảnh mặt */}
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

                                      {/* Ảnh X-quang */}
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
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </>
                      )}
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
                    <Button 
                      variant="primary" 
                      size="sm"
                      className="gap-2 bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleDownloadPDF(examination)}
                    >
                      <Download className="h-4 w-4" />
                      Tải xuống
                    </Button>
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

      {selectedImage && (
        <ImageViewer
          open={true}
          imageUrl={selectedImage}
          alt="Examination image"
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
};

export default PatientInitialExamination;