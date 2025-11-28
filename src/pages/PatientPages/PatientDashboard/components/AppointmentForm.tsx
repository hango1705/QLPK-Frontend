import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription, Button, Input } from '@/components/ui';
import { Select as AntSelect } from 'antd';
import apiClient from '@/services/api/client';
import { patientAPI } from '@/services/api/patient';
import type { AppointmentFormProps } from '../types';
import { formatBackendDateTime, normalizeDateTime } from '../utils';

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
  const [services, setServices] = useState<Array<{ id: string; name: string; unit: string; unitPrice: number }>>([]);
  const [bookedSet, setBookedSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get('/api/v1/doctor/doctors');
        const list = res.data.result || res.data || [];
        if (mounted) setDoctors(list);
      } catch {
        // silent; dropdown will be empty
      }
      try {
        const resS = await apiClient.get('/api/v1/dentalService');
        const listS = resS.data.result || resS.data || [];
        if (mounted) setServices(listS);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
        console.error('Error fetching booked slots:', e);
        // Fallback to old API if new one fails
        try {
          const res = await apiClient.get(`/api/v1/doctor/appointment/${doctorId}`);
          const list = res.data.result || res.data || [];
          const scheduledList = list.filter((x: any) => {
            const status = (x.status || '').toLowerCase().trim();
            return status === 'scheduled';
          });
          const s = new Set<string>(
            scheduledList
              .map((x: any) => normalizeDateTime(x.dateTime || ''))
              .filter(Boolean),
          );
          if (mounted) setBookedSet(s);
        } catch (fallbackError) {
          console.error('Fallback API also failed:', fallbackError);
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
    if (!doctorId || !payloadDate || !type) return setError('Thiếu bác sĩ, thời gian hoặc loại dịch vụ');
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      await apiClient.post('/api/v1/patient/appointment/booking', {
        doctorId,
        dateTime: payloadDate,
        type,
        notes,
        listDentalServicesEntity: services.filter((s) => s.name === type).slice(0, 1).map((s) => ({ id: s.id })),
      });
      setMsg('Đặt lịch thành công!');
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
          <label className="block text-sm font-medium mb-1">Loại dịch vụ</label>
          <AntSelect
            showSearch
            placeholder="Chọn dịch vụ"
            className="w-full"
            value={type || undefined}
            onChange={(v) => setType(v)}
            optionFilterProp="label"
            options={services.map((s) => ({
              label: `${s.name} — ${s.unit} (${s.unitPrice.toLocaleString('vi-VN')} đ)`,
              value: s.name,
            }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ngày</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setTime('');
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Khung giờ</label>
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

