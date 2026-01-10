import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
  Input,
  Button,
  Loading,
} from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import type { DentalService, PrescriptionItem } from '@/types/doctor';
import type { ExamDialogState, ExaminationFormState } from '../../types';
import { formatDateTime } from '../../utils';
import { doctorAPI } from '@/services';
import { queryKeys } from '@/services/queryClient';

interface CategoryDentalService {
  id: string;
  name: string;
}

interface ExamDialogProps {
  open: boolean;
  context: ExamDialogState | null;
  services: DentalService[];
  prescriptions: PrescriptionItem[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (form: ExaminationFormState, context: ExamDialogState) => void;
  isLoading: boolean;
}

const defaultForm: ExaminationFormState = {
  symptoms: '',
  diagnosis: '',
  notes: '',
  treatment: '',
  totalCost: 0,
  serviceOrders: [],
  prescriptionOrders: [],
  xrayFiles: [],
  faceFiles: [],
  teethFiles: [],
  removeImageIds: [],
};

const ExamDialog: React.FC<ExamDialogProps> = ({
  open,
  context,
  services,
  prescriptions,
  onOpenChange,
  onSubmit,
  isLoading,
}) => {
  // Early return must be after all hooks, so we'll handle it differently
  const [form, setForm] = useState<ExaminationFormState>(defaultForm);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [imagePreviews, setImagePreviews] = useState<{
    xrayFiles: string[];
    faceFiles: string[];
    teethFiles: string[];
  }>({
    xrayFiles: [],
    faceFiles: [],
    teethFiles: [],
  });

  // Fetch categories
  const { data: categoriesData = [] } = useQuery({
    queryKey: ['categoryDentalService'],
    queryFn: doctorAPI.getDentalCategories,
    enabled: open && !!context,
  });

  // Extract categories from the response
  const categories: CategoryDentalService[] = useMemo(() => {
    return categoriesData.map((cat: any) => ({ id: cat.id, name: cat.name }));
  }, [categoriesData]);

  // Filter services by selected category
  const filteredServices = useMemo(() => {
    if (!selectedCategoryId) return [];
    // Find services from the category data or filter by categoryDentalServiceId
    const categoryData = categoriesData.find((cat: any) => cat.id === selectedCategoryId);
    if (categoryData?.listDentalServiceEntity) {
      return categoryData.listDentalServiceEntity;
    }
    // Fallback: filter services by categoryDentalServiceId
    return services.filter((service: any) => service.categoryDentalServiceId === selectedCategoryId);
  }, [services, selectedCategoryId, categoriesData]);

  // Tự động load examination nếu đã có khi mở từ appointment
  // Fetch examination cho tất cả appointments (kể cả status "Done") để có thể chỉnh sửa
  const { data: existingExamination, isLoading: loadingExamination } = useQuery({
    queryKey: queryKeys.doctor.examinationByAppointment(context?.appointment?.id ?? ''),
    queryFn: () => {
      return doctorAPI.getExaminationByAppointment(context!.appointment!.id);
    },
    enabled: !!context?.appointment?.id && context?.mode === 'create' && open,
    retry: false, // Không retry nếu appointment chưa có examination
  });

  // Use ref to track if we've already processed the examination to avoid infinite loops
  // Fixed: Removed processedExaminationRef, using only processedContextRef
  const processedContextRef = useRef<string | null>(null);
  
  // Store services and categories in refs to avoid dependency issues
  const servicesRef = useRef(services);
  const categoriesRef = useRef(categories);
  
  // Update refs when values change
  useEffect(() => {
    servicesRef.current = services;
    categoriesRef.current = categories;
  }, [services, categories]);

  // Memoize mapServicesWithCategories to avoid recreating on every render
  // Use refs to avoid dependency on services/categories arrays
  const mapServicesWithCategories = useCallback((serviceOrders: any[]) => {
    return serviceOrders.map((service) => {
      // Nếu đã có categoryId thì giữ nguyên
      if ((service as any).categoryId) {
        return service;
      }
      // Tìm category từ services list (using refs)
      const serviceData = servicesRef.current.find(s => s.name === service.name);
      if (serviceData && (serviceData as any).categoryDentalServiceId) {
        const categoryId = (serviceData as any).categoryDentalServiceId;
        const categoryName = categoriesRef.current.find(c => c.id === categoryId)?.name || '';
        return {
          ...service,
          categoryId,
          categoryName,
        };
      }
      return service;
    });
  }, []); // Empty dependency array - use refs instead

  useEffect(() => {
    // Chỉ xử lý khi dialog mở và có context
    if (!open || !context) {
      // Reset form khi dialog đóng
      if (!open) {
        processedContextRef.current = null;
        setForm(defaultForm);
        setImagePreviews({ xrayFiles: [], faceFiles: [], teethFiles: [] });
      }
      return;
    }

    // Tạo unique key để track xem đã xử lý chưa
    const contextKey = context?.mode === 'update' 
      ? `update-${context.examination?.id}` 
      : `create-${context.appointment?.id}-${existingExamination?.id || 'none'}`;

    // Nếu đã xử lý rồi, không xử lý lại
    if (processedContextRef.current === contextKey) {
      return;
    }

    if (context?.mode === 'update' && context.examination) {
      // Mode update: load từ context.examination
      const mappedServiceOrders = mapServicesWithCategories(context.examination.listDentalServicesEntityOrder ?? []);
      setForm({
        symptoms: context.examination.symptoms || '',
        diagnosis: context.examination.diagnosis || '',
        notes: context.examination.notes || '',
        treatment: context.examination.treatment || '',
        totalCost: context.examination.totalCost || 0,
        serviceOrders: mappedServiceOrders,
        prescriptionOrders: context.examination.listPrescriptionOrder ?? [],
        xrayFiles: [],
        faceFiles: [],
        teethFiles: [],
        removeImageIds: [],
      });
      // Load existing images as previews
      if (context.examination.listImage) {
        const xrayImages = context.examination.listImage.filter((img: any) => img.type === 'examinationXray').map((img: any) => img.url);
        const faceImages = context.examination.listImage.filter((img: any) => img.type === 'examinationFace').map((img: any) => img.url);
        const teethImages = context.examination.listImage.filter((img: any) => img.type === 'examinationTeeth').map((img: any) => img.url);
        setImagePreviews({
          xrayFiles: xrayImages,
          faceFiles: faceImages,
          teethFiles: teethImages,
        });
      } else {
        setImagePreviews({ xrayFiles: [], faceFiles: [], teethFiles: [] });
      }
      processedContextRef.current = contextKey;
    } else if (context?.mode === 'create') {
      // Mode create: kiểm tra xem appointment đã có examination chưa
      // Nếu có existingExamination (appointment có status "Done" và đã có examination), fill form
      if (existingExamination) {
        const mappedServiceOrders = mapServicesWithCategories(existingExamination.listDentalServicesEntityOrder ?? []);
        setForm({
          symptoms: existingExamination.symptoms || '',
          diagnosis: existingExamination.diagnosis || '',
          notes: existingExamination.notes || '',
          treatment: existingExamination.treatment || '',
          totalCost: existingExamination.totalCost || 0,
          serviceOrders: mappedServiceOrders,
          prescriptionOrders: existingExamination.listPrescriptionOrder ?? [],
          xrayFiles: [],
          faceFiles: [],
          teethFiles: [],
          removeImageIds: [],
        });
        // Load existing images as previews
        if (existingExamination.listImage) {
          const xrayImages = existingExamination.listImage.filter((img: any) => img.type === 'examinationXray').map((img: any) => img.url);
          const faceImages = existingExamination.listImage.filter((img: any) => img.type === 'examinationFace').map((img: any) => img.url);
          const teethImages = existingExamination.listImage.filter((img: any) => img.type === 'examinationTeeth').map((img: any) => img.url);
          setImagePreviews({
            xrayFiles: xrayImages,
            faceFiles: faceImages,
            teethFiles: teethImages,
          });
        } else {
          setImagePreviews({ xrayFiles: [], faceFiles: [], teethFiles: [] });
        }
        processedContextRef.current = contextKey;
      } else if (!loadingExamination) {
        // Chỉ reset form khi không đang loading và không có examination
        // Điều này đảm bảo form không bị reset khi đang fetch examination
        setForm(defaultForm);
        setImagePreviews({ xrayFiles: [], faceFiles: [], teethFiles: [] });
        processedContextRef.current = contextKey;
      }
      // Nếu đang loading, không làm gì cả - đợi fetch xong
    }
  }, [open, context, existingExamination, loadingExamination, mapServicesWithCategories]);

  // Cleanup preview URLs when component unmounts
  // Note: We use a ref to track URLs that need cleanup
  const previewUrlsRef = React.useRef<string[]>([]);
  
  useEffect(() => {
    // Update ref with current preview URLs
    previewUrlsRef.current = Object.values(imagePreviews).flat();
  }, [imagePreviews]);

  useEffect(() => {
    return () => {
      // Cleanup all blob URLs on unmount
      previewUrlsRef.current.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  // Nhóm services theo category - MUST be before early return
  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, Array<{ service: any; index: number }>> = {};
    form.serviceOrders.forEach((service, index) => {
      const categoryId = (service as any).categoryId || 'other';
      const categoryName = (service as any).categoryName || 'Khác';
      if (!grouped[categoryId]) {
        grouped[categoryId] = [];
      }
      grouped[categoryId].push({ service, index });
    });
    return grouped;
  }, [form.serviceOrders]);

  // Don't render if no context
  if (!context) return null;

  const handleServiceAdd = (service: DentalService) => {
    const categoryName = categories.find(cat => cat.id === selectedCategoryId)?.name || '';
    setForm((prev) => ({
      ...prev,
      serviceOrders: [
        ...prev.serviceOrders,
        {
          name: service.name,
          unit: service.unit,
          unitPrice: service.unitPrice,
          quantity: 1,
          cost: service.unitPrice,
          categoryName, // Lưu tên category để hiển thị
          categoryId: selectedCategoryId, // Lưu categoryId để nhóm
        } as any,
      ],
      totalCost: prev.totalCost + service.unitPrice,
    }));
  };

  const handleServiceRemove = (index: number) => {
    setForm((prev) => {
      const removedService = prev.serviceOrders[index];
      return {
        ...prev,
        serviceOrders: prev.serviceOrders.filter((_, i) => i !== index),
        totalCost: prev.totalCost - (removedService.cost || 0),
      };
    });
  };

  const handleServiceQuantityChange = (index: number, quantity: number) => {
    if (quantity < 1) return;
    setForm((prev) => {
      const updated = [...prev.serviceOrders];
      const service = updated[index];
      const oldCost = service.cost || 0;
      service.quantity = quantity;
      service.cost = (service.unitPrice || 0) * quantity;
      const newCost = service.cost;
      return {
        ...prev,
        serviceOrders: updated,
        totalCost: prev.totalCost - oldCost + newCost,
      };
    });
  };

  const handlePrescriptionAdd = (item: PrescriptionItem) => {
    setForm((prev) => ({
      ...prev,
      prescriptionOrders: [
        ...prev.prescriptionOrders,
        {
          name: item.name,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          notes: item.notes,
          unitPrice: item.unitPrice,
          quantity: 1,
          cost: item.unitPrice,
        },
      ],
      totalCost: prev.totalCost + item.unitPrice,
    }));
  };

  const handlePrescriptionRemove = (index: number) => {
    setForm((prev) => {
      const removedPrescription = prev.prescriptionOrders[index];
      return {
        ...prev,
        prescriptionOrders: prev.prescriptionOrders.filter((_, i) => i !== index),
        totalCost: prev.totalCost - (removedPrescription.cost || 0),
      };
    });
  };

  const handlePrescriptionQuantityChange = (index: number, quantity: number) => {
    if (quantity < 1) return;
    setForm((prev) => {
      const updated = [...prev.prescriptionOrders];
      const prescription = updated[index];
      const oldCost = prescription.cost || 0;
      prescription.quantity = quantity;
      prescription.cost = (prescription.unitPrice || 0) * quantity;
      const newCost = prescription.cost;
      return {
        ...prev,
        prescriptionOrders: updated,
        totalCost: prev.totalCost - oldCost + newCost,
      };
    });
  };

  const handleSubmit = () => {
    // Nếu có existingExamination, cập nhật context để có examination
    if (existingExamination && context.mode === 'create') {
      onSubmit(form, { mode: 'update', examination: existingExamination });
    } else {
      onSubmit(form, context);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-0 sm:max-w-3xl">
        <DialogHeader className="space-y-2 border-b border-border/70 px-6 pb-4 pt-6">
          <DialogTitle className="text-xl font-semibold text-foreground">
            {loadingExamination ? (
              'Đang tải...'
            ) : existingExamination ? (
              'Cập nhật kết quả khám'
            ) : context.mode === 'create' ? (
              'Ghi nhận kết quả khám'
            ) : (
              'Cập nhật kết quả khám'
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 px-6 py-6">
          {/* Thời gian khám */}
          <div className="space-y-2">
            <Label>Thời gian khám</Label>
            <Input
              type="date"
              value={context?.appointment?.dateTime ? new Date(context.appointment.dateTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                // Store in form state if needed, but this is mainly for display
              }}
              disabled
              className="bg-muted/50"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Triệu chứng</Label>
              <Textarea
                value={form.symptoms}
                onChange={(e) => setForm((prev) => ({ ...prev, symptoms: e.target.value }))}
                placeholder="Ví dụ: Đau nhói vùng răng hàm dưới..."
              />
            </div>
            <div className="space-y-2">
              <Label>Chẩn đoán</Label>
              <Textarea
                value={form.diagnosis}
                onChange={(e) => setForm((prev) => ({ ...prev, diagnosis: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Phác đồ điều trị</Label>
              <Textarea
                value={form.treatment}
                onChange={(e) => setForm((prev) => ({ ...prev, treatment: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-muted/50 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">Dịch vụ sử dụng</p>
              <div className="flex gap-2">
                <Select 
                  value={selectedCategoryId} 
                  onValueChange={(value) => {
                    setSelectedCategoryId(value);
                  }}
                >
                  <SelectTrigger className="w-48 text-xs">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value=""
                  onValueChange={(value) => {
                    const service = filteredServices.find((item) => item.id === value);
                    if (service) {
                      handleServiceAdd(service);
                    }
                  }}
                  disabled={!selectedCategoryId || filteredServices.length === 0}
                >
                  <SelectTrigger className="w-56 text-xs">
                    <SelectValue placeholder={selectedCategoryId ? "Chọn dịch vụ" : "Chọn danh mục trước"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredServices.map((service) => (
                      <SelectItem key={service.id} value={service.id ?? service.name}>
                        {service.name} · {service.unitPrice.toLocaleString('vi-VN')} đ
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Hiển thị danh sách dịch vụ đã chọn, nhóm theo category */}
            {form.serviceOrders.length > 0 && (
              <div className="space-y-3 mt-4">
                {Object.entries(servicesByCategory).map(([categoryId, items]) => {
                  const categoryName = items[0]?.service?.categoryName || categories.find(c => c.id === categoryId)?.name || 'Khác';
                  return (
                    <div key={categoryId} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-border/50"></div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase">
                          {categoryName}
                        </span>
                        <div className="h-px flex-1 bg-border/50"></div>
                      </div>
                      <div className="space-y-2">
                        {items.map(({ service, index }) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-lg border border-border/60 bg-white px-3 py-2"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">{service.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {service.unitPrice.toLocaleString('vi-VN')} đ / {service.unit}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={1}
                                value={service.quantity}
                                onChange={(e) => handleServiceQuantityChange(index, Number(e.target.value))}
                                className="w-16 text-center text-xs"
                              />
                              <span className="text-xs text-muted-foreground">x</span>
                              <span className="w-24 text-right text-sm font-semibold text-primary">
                                {(service.cost || 0).toLocaleString('vi-VN')} đ
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleServiceRemove(index)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Thuốc đã sử dụng */}
          <div className="rounded-2xl border border-border/70 bg-muted/50 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">Thuốc đã sử dụng</p>
              <Select 
                value=""
                onValueChange={(value) => {
                  const prescription = prescriptions.find((item) => item.name === value);
                  if (prescription) {
                    handlePrescriptionAdd(prescription);
                  }
                }}
                disabled={prescriptions.length === 0}
              >
                <SelectTrigger className="w-64 text-xs">
                  <SelectValue placeholder={prescriptions.length > 0 ? "Chọn thuốc" : "Không có thuốc"} />
                </SelectTrigger>
                <SelectContent>
                  {prescriptions.map((prescription, idx) => (
                    <SelectItem key={idx} value={prescription.name}>
                      {prescription.name} · {prescription.unitPrice?.toLocaleString('vi-VN') || 0} đ
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hiển thị danh sách thuốc đã chọn */}
            {form.prescriptionOrders.length > 0 && (
              <div className="space-y-2 mt-4">
                {form.prescriptionOrders.map((prescription, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-white px-3 py-2"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{prescription.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {prescription.dosage && `Liều: ${prescription.dosage}`}
                        {prescription.frequency && ` · ${prescription.frequency}`}
                        {prescription.duration && ` · ${prescription.duration}`}
                      </p>
                      {prescription.notes && (
                        <p className="text-xs text-muted-foreground italic mt-1">{prescription.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        value={prescription.quantity}
                        onChange={(e) => handlePrescriptionQuantityChange(index, Number(e.target.value))}
                        className="w-16 text-center text-xs"
                      />
                      <span className="text-xs text-muted-foreground">x</span>
                      <span className="w-24 text-right text-sm font-semibold text-primary">
                        {(prescription.cost || 0).toLocaleString('vi-VN')} đ
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePrescriptionRemove(index)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="gap-4 md:grid md:grid-cols-3">
            {(['xrayFiles', 'faceFiles', 'teethFiles'] as const).map((field) => (
              <div key={field} className="space-y-2">
                <Label>Ảnh {field === 'xrayFiles' ? 'X-quang' : field === 'faceFiles' ? 'Chính diện' : 'Chi tiết'}</Label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="w-full rounded-2xl border border-dashed border-border px-3 py-2 text-xs"
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []);
                    // Append new files to existing ones instead of replacing
                    setForm((prev) => {
                      const existingFiles = prev[field] || [];
                      return { ...prev, [field]: [...existingFiles, ...files] };
                    });
                    // Create new preview URLs and append to existing
                    const newPreviews = files.map((file) => URL.createObjectURL(file));
                    setImagePreviews((prev) => ({
                      ...prev,
                      [field]: [...(prev[field] || []), ...newPreviews],
                    }));
                    // Reset input to allow selecting same files again
                    event.target.value = '';
                  }}
                />
                {/* Preview images */}
                {imagePreviews[field] && imagePreviews[field].length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {imagePreviews[field].map((previewUrl, index) => (
                      <div key={index} className="relative">
                        <img
                          src={previewUrl}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-border"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Remove preview
                            setImagePreviews((prev) => ({
                              ...prev,
                              [field]: prev[field].filter((_, i) => i !== index),
                            }));
                            // Remove from form files
                            setForm((prev) => {
                              const newFiles = [...(prev[field] || [])];
                              newFiles.splice(index, 1);
                              return { ...prev, [field]: newFiles };
                            });
                            // Revoke URL if it's a blob
                            if (previewUrl.startsWith('blob:')) {
                              URL.revokeObjectURL(previewUrl);
                            }
                          }}
                          className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 flex flex-wrap gap-3 border-t border-border/70 bg-white px-6 py-4">
          <Button variant="outline" className="flex-1 border-border/70" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            className="flex-1 bg-primary text-white hover:bg-primary/90"
            onClick={handleSubmit}
            disabled={isLoading || loadingExamination}
          >
            {isLoading || loadingExamination ? (
              <Loading size="sm" />
            ) : existingExamination ? (
              'Cập nhật kết quả'
            ) : (
              'Lưu kết quả'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExamDialog;


