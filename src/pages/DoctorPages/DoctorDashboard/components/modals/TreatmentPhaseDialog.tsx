import React, { useEffect, useState, useMemo } from 'react';
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
  Badge,
} from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Upload } from 'lucide-react';
import type { DentalService, PrescriptionItem, TreatmentPlan } from '@/types/doctor';
import type { PhaseDialogState, TreatmentPhaseFormState } from '../../types';
import { formatToInputDate, formatToInputTime, formatCurrency } from '../../utils';
import { doctorAPI } from '@/services';

interface CategoryDentalService {
  id: string;
  name: string;
}

interface TreatmentPhaseDialogProps {
  open: boolean;
  context: PhaseDialogState | null;
  services: DentalService[];
  prescriptions: PrescriptionItem[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (form: TreatmentPhaseFormState, context: PhaseDialogState) => void;
  isLoading: boolean;
}

const defaultForm: TreatmentPhaseFormState = {
  phaseNumber: '',
  description: '',
  procedure: '', // Thủ thuật bác sĩ làm
  startDate: '',
  endDate: '',
  cost: 0,
  status: 'Inprogress',
  nextAppointmentDate: '',
  nextAppointmentTime: '',
  serviceOrders: [],
  prescriptionOrders: [],
  xrayFiles: [],
  faceFiles: [],
  teethFiles: [],
  removeImageIds: [],
};

const TreatmentPhaseDialog: React.FC<TreatmentPhaseDialogProps> = ({
  open,
  context,
  services,
  prescriptions,
  onOpenChange,
  onSubmit,
  isLoading,
}) => {
  const [form, setForm] = useState<TreatmentPhaseFormState>(defaultForm);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
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
    enabled: open,
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

  useEffect(() => {
    // Map services to find their categories when loading existing data
    const mapServicesWithCategories = (serviceOrders: any[]) => {
      return serviceOrders.map((service) => {
        // Nếu đã có categoryId thì giữ nguyên
        if ((service as any).categoryId) {
          return service;
        }
        // Tìm category từ services list
        const serviceData = services.find(s => s.name === service.name);
        if (serviceData && (serviceData as any).categoryDentalServiceId) {
          const categoryId = (serviceData as any).categoryDentalServiceId;
          const categoryName = categories.find(c => c.id === categoryId)?.name || '';
          return {
            ...service,
            categoryId,
            categoryName,
          };
        }
        return service;
      });
    };

    if (context?.mode === 'update' && context.phase) {
      setForm({
        phaseNumber: context.phase.phaseNumber,
        description: context.phase.description,
        procedure: context.phase.description || '', // Sử dụng description làm procedure nếu chưa có field riêng
        startDate: formatToInputDate(context.phase.startDate),
        endDate: formatToInputDate(context.phase.endDate),
        cost: context.phase.cost,
        status: context.phase.status,
        nextAppointmentDate: formatToInputDate(context.phase.nextAppointment),
        nextAppointmentTime: formatToInputTime(context.phase.nextAppointment),
        serviceOrders: mapServicesWithCategories(context.phase.listDentalServicesEntityOrder ?? []),
        prescriptionOrders: context.phase.listPrescriptionOrder ?? [],
        xrayFiles: [],
        faceFiles: [],
        teethFiles: [],
        removeImageIds: [],
      });
      // Load existing images as previews
      if (context.phase.listImage) {
        const xrayImages = context.phase.listImage.filter((img: any) => img.type === 'treatmentPhasesXray').map((img: any) => img.url);
        const faceImages = context.phase.listImage.filter((img: any) => img.type === 'treatmentPhasesFace').map((img: any) => img.url);
        const teethImages = context.phase.listImage.filter((img: any) => img.type === 'treatmentPhasesTeeth').map((img: any) => img.url);
        setImagePreviews({
          xrayFiles: xrayImages,
          faceFiles: faceImages,
          teethFiles: teethImages,
        });
      }
    } else if (context?.mode === 'create') {
      setForm(defaultForm);
      setImagePreviews({ xrayFiles: [], faceFiles: [], teethFiles: [] });
    }
  }, [context, services, categories]);

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      Object.values(imagePreviews).flat().forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  // Tính tổng chi phí tự động từ dịch vụ và thuốc
  const calculatedCost = form.serviceOrders.reduce((sum, s) => sum + (s.cost || 0), 0) +
    form.prescriptionOrders.reduce((sum, p) => sum + (p.cost || 0), 0);

  // Cập nhật cost khi serviceOrders hoặc prescriptionOrders thay đổi
  useEffect(() => {
    if (calculatedCost > 0) {
      setForm((prev) => ({ ...prev, cost: calculatedCost }));
    }
  }, [calculatedCost]);

  // Nhóm services theo category để hiển thị
  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, Array<{ service: any; index: number }>> = {};
    form.serviceOrders.forEach((serviceOrder, index) => {
      // Lấy categoryId từ serviceOrder hoặc tìm từ service data
      let categoryId = (serviceOrder as any).categoryId;
      if (!categoryId) {
        // Tìm service trong services list để lấy categoryId
        const serviceData = services.find(s => s.name === serviceOrder.name);
        if (serviceData && (serviceData as any).categoryDentalServiceId) {
          categoryId = (serviceData as any).categoryDentalServiceId;
        } else {
          // Tìm từ categoriesData
          const categoryData = categoriesData.find((cat: any) => 
            cat.listDentalServiceEntity?.some((s: any) => s.name === serviceOrder.name)
          );
          if (categoryData) {
            categoryId = categoryData.id;
          }
        }
      }
      // Nếu vẫn không có categoryId, dùng 'other'
      const key = categoryId || 'other';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push({ 
        service: {
          ...serviceOrder,
          categoryId: categoryId || 'other',
          categoryName: categories.find(c => c.id === categoryId)?.name || 'Khác'
        }, 
        index 
      });
    });
    return grouped;
  }, [form.serviceOrders, services, categories, categoriesData]);

  if (!context) return null;

  const handleServiceAdd = (service: DentalService) => {
    setForm((prev) => {
      // Tìm categoryId từ service hoặc selectedCategoryId
      let categoryId = (service as any).categoryDentalServiceId || selectedCategoryId;
      if (!categoryId) {
        // Tìm từ categoriesData
        const categoryData = categoriesData.find((cat: any) => 
          cat.listDentalServiceEntity?.some((s: any) => s.id === service.id || s.name === service.name)
        );
        if (categoryData) {
          categoryId = categoryData.id;
        }
      }
      const categoryName = categories.find(c => c.id === categoryId)?.name || '';
      
      const newService = {
        name: service.name,
        unit: service.unit,
        unitPrice: service.unitPrice,
        quantity: 1,
        cost: service.unitPrice,
        categoryId: categoryId || 'other',
        categoryName: categoryName,
      };
      return {
        ...prev,
        serviceOrders: [...prev.serviceOrders, newService],
        cost: prev.cost + newService.cost,
      };
    });
    // Reset selected service after adding
    setSelectedServiceId('');
  };

  const handlePrescriptionAdd = (item: PrescriptionItem) => {
    setForm((prev) => {
      const newPrescription = {
        name: item.name,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        notes: item.notes,
        unitPrice: item.unitPrice,
        quantity: 1,
        cost: item.unitPrice,
      };
      return {
        ...prev,
        prescriptionOrders: [...prev.prescriptionOrders, newPrescription],
        cost: prev.cost + newPrescription.cost,
      };
    });
  };

  const handleServiceRemove = (index: number) => {
    setForm((prev) => {
      const removed = prev.serviceOrders[index];
      return {
        ...prev,
        serviceOrders: prev.serviceOrders.filter((_, i) => i !== index),
        cost: prev.cost - (removed?.cost || 0),
      };
    });
  };

  const handlePrescriptionRemove = (index: number) => {
    setForm((prev) => {
      const removed = prev.prescriptionOrders[index];
      return {
        ...prev,
        prescriptionOrders: prev.prescriptionOrders.filter((_, i) => i !== index),
        cost: prev.cost - (removed?.cost || 0),
      };
    });
  };

  const handleServiceQuantityChange = (index: number, quantity: number) => {
    setForm((prev) => {
      const updated = [...prev.serviceOrders];
      const oldCost = updated[index].cost || 0;
      updated[index] = {
        ...updated[index],
        quantity,
        cost: updated[index].unitPrice * quantity,
      };
      const newCost = updated[index].cost;
      return {
        ...prev,
        serviceOrders: updated,
        cost: prev.cost - oldCost + newCost,
      };
    });
  };

  const handlePrescriptionQuantityChange = (index: number, quantity: number) => {
    setForm((prev) => {
      const updated = [...prev.prescriptionOrders];
      const oldCost = updated[index].cost || 0;
      updated[index] = {
        ...updated[index],
        quantity,
        cost: updated[index].unitPrice * quantity,
      };
      const newCost = updated[index].cost;
      return {
        ...prev,
        prescriptionOrders: updated,
        cost: prev.cost - oldCost + newCost,
      };
    });
  };

  const handleSubmit = () => onSubmit(form, context);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-0 sm:max-w-4xl">
        <DialogHeader className="space-y-2 border-b border-border/70 px-6 pb-4 pt-6">
          <DialogTitle className="text-xl font-semibold text-foreground">
            {context.mode === 'create' ? 'Thêm tiến trình điều trị' : 'Cập nhật tiến trình'}
          </DialogTitle>
          <DialogDescription>Thuộc phác đồ: {context.plan.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 py-6">
          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Giai đoạn *</Label>
              <Input
                value={form.phaseNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, phaseNumber: e.target.value }))}
                placeholder="Ví dụ: Phase 1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Ngày bắt đầu *</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Ngày kết thúc</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Thủ thuật bác sĩ làm */}
          <div className="space-y-2">
            <Label>Thủ thuật bác sĩ làm ngày hôm đó *</Label>
            <Textarea
              value={form.procedure}
              onChange={(e) => setForm((prev) => ({ ...prev, procedure: e.target.value }))}
              placeholder="Mô tả chi tiết các thủ thuật, quy trình điều trị đã thực hiện trong lần này..."
              rows={4}
              required
            />
          </div>

          {/* Mô tả */}
          <div className="space-y-2">
            <Label>Mô tả / Ghi chú</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Ghi chú thêm về tiến trình điều trị..."
              rows={3}
            />
          </div>

          {/* Dịch vụ sử dụng */}
          <div className="rounded-2xl border border-border/70 bg-muted/50 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <Label className="text-sm font-semibold text-foreground">Dịch vụ sử dụng trong lần điều trị</Label>
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
                        {service.name} · {formatCurrency(service.unitPrice)}
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
                            className="flex items-center justify-between rounded-xl border border-border/60 bg-white px-3 py-2"
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
                                {formatCurrency(service.cost)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleServiceRemove(index)}
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
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

          {/* Thuốc sử dụng */}
          <div className="rounded-2xl border border-border/70 bg-muted/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <Label className="text-sm font-semibold text-foreground">Thuốc sử dụng / mua trong lần điều trị</Label>
              <Select
                onValueChange={(value) => {
                  const prescription = prescriptions.find((item) => item.name === value);
                  if (prescription) handlePrescriptionAdd(prescription);
                }}
              >
                <SelectTrigger className="w-56 text-xs">
                  <SelectValue placeholder="Chọn thuốc" />
                </SelectTrigger>
                <SelectContent>
                  {prescriptions.map((item) => (
                    <SelectItem key={item.name} value={item.name}>
                      {item.name} · {formatCurrency(item.unitPrice)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.prescriptionOrders.length > 0 && (
              <div className="space-y-2">
                {form.prescriptionOrders.map((prescription, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-white px-3 py-2"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{prescription.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {prescription.dosage} · {prescription.frequency} · {prescription.duration}
                      </p>
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
                        {formatCurrency(prescription.cost)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePrescriptionRemove(index)}
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload ảnh sau khi thực hiện */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">Ảnh chụp sau khi thực hiện (có thể upload nhiều ảnh)</Label>
            <div className="grid gap-4 md:grid-cols-3">
              {(['xrayFiles', 'faceFiles', 'teethFiles'] as const).map((field) => (
                <div key={field} className="space-y-2">
                  <Label className="text-xs">
                    {field === 'xrayFiles' ? 'X-quang' : field === 'faceFiles' ? 'Chính diện' : 'Chi tiết răng'}
                  </Label>
                  <div className="relative">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="w-full rounded-xl border border-dashed border-border px-3 py-2 text-xs file:mr-4 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/20"
                      onChange={(event) => {
                        const files = Array.from(event.target.files || []);
                        // Revoke old preview URLs for this field (only blob URLs)
                        const oldPreviews = imagePreviews[field] || [];
                        oldPreviews.forEach((url) => {
                          if (url.startsWith('blob:')) {
                            URL.revokeObjectURL(url);
                          }
                        });
                        // Create new preview URLs
                        const newPreviews = files.map((file) => URL.createObjectURL(file));
                        setForm((prev) => ({ ...prev, [field]: files }));
                        setImagePreviews((prev) => ({
                          ...prev,
                          [field]: newPreviews,
                        }));
                      }}
                    />
                    {/* Preview images */}
                    {imagePreviews[field] && imagePreviews[field].length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {imagePreviews[field].map((previewUrl, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={previewUrl}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-border"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Revoke URL if it's a blob
                                if (previewUrl.startsWith('blob:')) {
                                  URL.revokeObjectURL(previewUrl);
                                }
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
                              }}
                              className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chi phí và tái khám */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Chi phí phát sinh *</Label>
              <Input
                type="number"
                value={form.cost}
                onChange={(e) => setForm((prev) => ({ ...prev, cost: Number(e.target.value) }))}
                min={0}
                required
              />
              {calculatedCost > 0 && (
                <p className="text-xs text-muted-foreground">
                  Tự động tính: {formatCurrency(calculatedCost)} (từ dịch vụ + thuốc)
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Ngày tái khám</Label>
              <Input
                type="date"
                value={form.nextAppointmentDate}
                onChange={(e) => setForm((prev) => ({ ...prev, nextAppointmentDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Giờ tái khám</Label>
              <Input
                type="time"
                value={form.nextAppointmentTime}
                onChange={(e) => setForm((prev) => ({ ...prev, nextAppointmentTime: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 flex flex-wrap gap-3 border-t border-border/70 bg-white px-6 py-4">
          <Button variant="outline" className="flex-1 border-border/70" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button className="flex-1 bg-primary text-white hover:bg-primary/90" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Đang lưu...' : 'Lưu tiến trình'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TreatmentPhaseDialog;
