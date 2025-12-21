import React, { useState, useEffect, useMemo } from 'react';
import { Alert, AlertTitle, AlertDescription, Button, Input, showNotification } from '@/components/ui';
import { Select as AntSelect } from 'antd';
import { X } from 'lucide-react';
import apiClient from '@/services/api/client';
import { patientAPI } from '@/services/api/patient';
import { doctorAPI } from '@/services';
import { adminAPI } from '@/services/api/admin';
import type { AppointmentFormProps } from '../types';
import { formatBackendDateTime, normalizeDateTime } from '../utils';
import type { CategoryDentalService, DentalService } from '@/types/admin';

const AppointmentForm: React.FC<AppointmentFormProps> = ({ onBooked }) => {
  const [doctorId, setDoctorId] = useState('');
  const [doctors, setDoctors] = useState<Array<{ id: string; fullName: string; specialization: string }>>([]);
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<DentalService[]>([]);
  const [categories, setCategories] = useState<CategoryDentalService[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedServiceOrders, setSelectedServiceOrders] = useState<Array<{
    id: string;
    name: string;
    unit: string;
    unitPrice: number;
    categoryName?: string;
  }>>([]);
  const [bookedSet, setBookedSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await doctorAPI.getDoctorDirectory();
        if (mounted) setDoctors(list);
      } catch {
        // silent; dropdown will be empty
      }
      try {
        const listS = await adminAPI.getAllServices();
        if (mounted) setServices(listS);
      } catch {}
      try {
        const listC = await adminAPI.getAllCategories();
        if (mounted) setCategories(listC);
      } catch {
        // ignore category load errors
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter services by selected category
  const filteredServices = useMemo(() => {
    if (!selectedCategoryId) return [];
    const category = categories.find((c) => c.id === selectedCategoryId);
    if (category && category.listDentalServiceEntity && category.listDentalServiceEntity.length > 0) {
      return category.listDentalServiceEntity;
    }
    return services.filter((s: any) => (s as any).categoryDentalServiceId === selectedCategoryId);
  }, [services, selectedCategoryId, categories]);

  // Group selected services by category for display
  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, Array<{ service: any; index: number }>> = {};
    selectedServiceOrders.forEach((serviceOrder, index) => {
      const categoryName = serviceOrder.categoryName || 'Khác';
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push({ service: serviceOrder, index });
    });
    return grouped;
  }, [selectedServiceOrders]);

  // Fetch booked time slots of selected doctor using bookingDateTime API
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!doctorId) {
        setBookedSet(new Set());
        return;
      }
      try {
        // Use the new bookingDateTime API to get all booked slots
        const bookingSlots = await patientAPI.getBookingDateTime(doctorId);
        // Normalize dateTime to 'HH:mm dd/MM/yyyy' format
        const s = new Set<string>(
          bookingSlots
            .map((slot) => normalizeDateTime(slot.dateTime || ''))
            .filter(Boolean),
        );
        if (mounted) setBookedSet(s);
      } catch (e) {
        // Fallback to old API if new one fails
        try {
          const list = await doctorAPI.getAppointmentsByDoctor(doctorId, 'all');
          const scheduledList = list.filter((x) => {
            const status = (x.status || '').toLowerCase().trim();
            return status === 'scheduled';
          });
          const s = new Set<string>(
            scheduledList
              .map((x) => normalizeDateTime(x.dateTime || ''))
              .filter(Boolean),
          );
          if (mounted) setBookedSet(s);
        } catch (fallbackError) {
          if (mounted) setBookedSet(new Set());
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [doctorId]);

  const handleServiceAdd = (service: DentalService) => {
    // Find category name
    const category = categories.find((c) => 
      c.listDentalServiceEntity?.some((s) => s.id === service.id)
    );
    const categoryName = category?.name || 'Khác';
    
    // Check if service already added
    if (selectedServiceOrders.some((s) => s.id === service.id)) {
      setError('Dịch vụ này đã được chọn');
      return;
    }
    
    setSelectedServiceOrders((prev) => {
      const newOrders = [
        ...prev,
        {
          id: service.id,
          name: service.name,
          unit: service.unit,
          unitPrice: service.unitPrice,
          categoryName,
        },
      ];
      // Update type field
      if (newOrders.length === 1) {
        setType(newOrders[0].name);
      } else {
        setType('Nhiều dịch vụ');
      }
      return newOrders;
    });
    
    // Reset selected service dropdown
    setSelectedCategoryId('');
    setError(null);
  };

  const handleServiceRemove = (index: number) => {
    setSelectedServiceOrders((prev) => {
      const newOrders = prev.filter((_, i) => i !== index);
      // Update type field
      if (newOrders.length === 0) {
        setType('');
      } else if (newOrders.length === 1) {
        setType(newOrders[0].name);
      } else {
        setType('Nhiều dịch vụ');
      }
      return newOrders;
    });
  };

  const submit = async () => {
    const payloadDate = formatBackendDateTime(date, time);
    if (!doctorId || !payloadDate || selectedServiceOrders.length === 0)
      return setError('Thiếu bác sĩ, thời gian hoặc dịch vụ');

    // Không cho đặt lịch trong quá khứ
    if (date) {
      const [y, m, d] = date.split('-').map(Number);
      const selectedDay = new Date(y, m - 1, d, 0, 0, 0, 0);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      if (selectedDay.getTime() < today.getTime()) {
        setError('Bạn không thể đặt lịch trong ngày đã qua');
        return;
      }
    }

    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      // Get first service name for type field (for backward compatibility)
      const typeValue = selectedServiceOrders.length === 1 
        ? selectedServiceOrders[0].name
        : 'Nhiều dịch vụ';
      
      // Build listDentalServicesEntity array
      const listDentalServicesEntity = selectedServiceOrders.map((s) => ({ id: s.id }));

      await patientAPI.bookAppointment({
        doctorId,
        dateTime: payloadDate,
        type: typeValue,
        notes,
        listDentalServicesEntity,
      });
      showNotification.success('Đặt lịch hẹn thành công!');
      onBooked();
    } catch {
      setError('Đặt lịch thất bại');
    } finally {
      setLoading(false);
    }
  };

  const toVietnamDate = (isoDate: string) => {
    // iso yyyy-mm-dd -> dd/MM/yyyy
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  };

  const getTodayIso = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const generateSlots = () => {
    // 08:00 -> 19:00, cách nhau 60 phút
    const slots: string[] = [];
    for (let hour = 8; hour <= 19; hour += 1) {
      const hh = hour.toString().padStart(2, '0');
      slots.push(`${hh}:00`);
    }
    return slots;
  };

  const isSlotDisabled = (slot: string) => {
    if (!date || !doctorId) return true;

    // Format key to match normalized format: 'HH:mm dd/MM/yyyy'
    const key = `${slot} ${toVietnamDate(date)}`;

    // Check if this slot is booked with Scheduled status
    if (bookedSet.has(key)) {
      return true;
    }

    // Disable past time slots for today
    const today = new Date();
    const [y, m, d] = date.split('-').map(Number);
    const isSameDate = today.getFullYear() === y && today.getMonth() + 1 === m && today.getDate() === d;
    if (isSameDate) {
      const [hh, mi] = slot.split(':').map(Number);
      const slotDateTime = new Date(y, m - 1, d, hh, mi, 0, 0);
      const now = new Date();
      if (slotDateTime.getTime() <= now.getTime()) {
        return true;
      }
    }

    return false;
  };

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-3">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {msg && <div className="mb-3 text-green-700 font-medium">{msg}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Chọn bác sĩ</label>
          <AntSelect
            showSearch
            placeholder="Chọn bác sĩ"
            className="w-full"
            value={doctorId || undefined}
            onChange={(v) => setDoctorId(v)}
            optionFilterProp="label"
            options={doctors.map((d) => ({
              label: `${d.fullName} — ${d.specialization || 'Chưa cập nhật'}`,
              value: d.id,
            }))}
          />
        </div>
        <div className="md:col-span-2">
          <div className="rounded-2xl border border-border/70 bg-muted/50 p-4">
            <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
              <label className="block text-sm font-semibold text-foreground">Dịch vụ sử dụng</label>
              <div className="flex gap-2 flex-wrap">
                <AntSelect
                  showSearch
                  placeholder="Chọn danh mục"
                  className="w-48"
                  value={selectedCategoryId || undefined}
                  onChange={(value) => {
                    setSelectedCategoryId(value);
                    setError(null);
                  }}
                  optionFilterProp="label"
                  options={categories.map((c) => ({
                    label: c.name,
                    value: c.id,
                  }))}
                />
                <AntSelect
                  showSearch
                  placeholder={selectedCategoryId ? "Chọn dịch vụ" : "Chọn danh mục trước"}
                  className="w-56"
                  value=""
                  onChange={(value) => {
                    const service = filteredServices.find((s) => s.id === value);
                    if (service) {
                      handleServiceAdd(service);
                    }
                  }}
                  disabled={!selectedCategoryId || filteredServices.length === 0}
                  optionFilterProp="label"
                  options={filteredServices.map((s) => ({
                    label: `${s.name} — ${s.unitPrice.toLocaleString('vi-VN')} đ`,
                    value: s.id,
                  }))}
                />
              </div>
            </div>

            {/* Hiển thị danh sách dịch vụ đã chọn, nhóm theo category */}
            {selectedServiceOrders.length > 0 && (
              <div className="space-y-3 mt-4">
                {Object.entries(servicesByCategory).map(([categoryName, items]) => (
                  <div key={categoryName} className="space-y-2">
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleServiceRemove(index)}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {selectedServiceOrders.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Chọn danh mục và dịch vụ để thêm vào danh sách
              </p>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ngày</label>
          <div className="relative">
            <Input
              type="date"
              value={date}
              min={getTodayIso()}
              onChange={(e) => {
                setDate(e.target.value);
                setTime('');
              }}
              className={date ? 'pr-10' : ''}
            />
            {date && (
              <button
                type="button"
                onClick={() => {
                  setDate('');
                  setTime('');
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                title="Đặt lại ngày"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium">Khung giờ</label>
            {time && (
              <button
                type="button"
                onClick={() => setTime('')}
                className="inline-flex items-center gap-1 rounded-full border border-blue-500 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 shadow-sm hover:bg-blue-600 hover:text-white transition-colors"
                title="Reset khung giờ"
              >
                <X className="h-3 w-3" />
                Đặt lại
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {generateSlots().map((s) => {
              const disabled = isSlotDisabled(s);
              const selected = time === s;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={disabled}
                  onClick={() => setTime(s)}
                  className={`border rounded-md py-2 text-sm transition ${
                    disabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : selected
                        ? 'bg-blue-600 text-white border-blue-600 cursor-pointer'
                        : 'hover:border-gray-400 hover:bg-blue-50 cursor-pointer'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Ghi chú</label>
          <textarea
            className="w-full border rounded-md px-3 py-2"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ghi chú cho bác sĩ..."
          />
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <Button onClick={submit} loading={loading}>
          Đặt lịch
        </Button>
      </div>
    </div>
  );
};

export default AppointmentForm;

