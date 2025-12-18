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
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
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

  const filteredServices = useMemo(() => {
    if (!selectedCategoryId) {
      return services;
    }
    const category = categories.find((c) => c.id === selectedCategoryId);
    if (category && category.listDentalServiceEntity && category.listDentalServiceEntity.length > 0) {
      // Ưu tiên danh sách dịch vụ lấy trực tiếp từ category
      return category.listDentalServiceEntity;
    }
    // Fallback: nếu category không có list, dùng toàn bộ services (không lọc)
    return services;
  }, [services, categories, selectedCategoryId]);

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

  const submit = async () => {
    const payloadDate = formatBackendDateTime(date, time);
    if (!doctorId || !payloadDate || !selectedServiceId)
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
      const selectedService = services.find((s) => s.id === selectedServiceId);
      await patientAPI.bookAppointment({
        doctorId,
        dateTime: payloadDate,
        type: selectedService?.name || type,
        notes,
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
        <div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Danh mục dịch vụ</label>
              <AntSelect
                showSearch
                placeholder="Chọn danh mục"
                className="w-full"
                value={selectedCategoryId || undefined}
                onChange={(v) => {
                  setSelectedCategoryId(v);
                  setSelectedServiceId('');
                  setType('');
                }}
                optionFilterProp="label"
                options={categories.map((c) => ({
                  label: c.name,
                  value: c.id,
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Loại dịch vụ</label>
              <AntSelect
                showSearch
                placeholder={selectedCategoryId ? 'Chọn dịch vụ' : 'Chọn danh mục trước'}
                className="w-full"
                value={selectedServiceId || undefined}
                onChange={(v) => {
                  setSelectedServiceId(v);
                  const svc = services.find((s) => s.id === v);
                  setType(svc?.name || '');
                }}
                optionFilterProp="label"
                disabled={!selectedCategoryId || filteredServices.length === 0}
                options={filteredServices.map((s) => ({
                  label: `${s.name} — ${s.unit} (${s.unitPrice.toLocaleString('vi-VN')} đ)`,
                  value: s.id,
                }))}
              />
            </div>
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

