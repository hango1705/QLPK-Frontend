import React, { useState, useEffect, useMemo } from 'react';
import { Alert, AlertTitle, AlertDescription, Button, Input, Modal } from '@/components/ui';
import { Tag } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  HourglassOutlined,
} from '@ant-design/icons';
import { patientAPI } from '@/services/api/patient';
import { doctorAPI } from '@/services';
import { adminAPI } from '@/services/api/admin';
import type { AppointmentListProps } from '../types';
import { normalizeDateTime, formatDateTime } from '../utils';

const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  filter,
  page,
  pageSize,
  onFilterChange,
  onPageChange,
  onBookNew,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<
    Array<{
      id: string;
      dateTime: string;
      status: string;
      type: string;
      doctorFullName: string;
      doctorSpecialization?: string;
      doctorId?: string;
      notes?: string;
      listDentalServicesEntity?: Array<{ id: string }>;
    }>
  >([]);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleDoctorId, setRescheduleDoctorId] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [services, setServices] = useState<Array<{ id: string; name: string }>>([]);
  const [detailOpenId, setDetailOpenId] = useState<string | null>(null);
  const [examDetail, setExamDetail] = useState<any | null>(null);
  const [doctorsMap, setDoctorsMap] = useState<Map<string, string>>(new Map());
  const [bookedSet, setBookedSet] = useState<Set<string>>(new Set());

  // Load doctors map and services for lookup
  useEffect(() => {
    (async () => {
      try {
        const list = await doctorAPI.getDoctorDirectory();
        const map = new Map<string, string>();
        list.forEach((d) => {
          if (d.fullName) map.set(d.fullName, d.id);
        });
        setDoctorsMap(map);
      } catch {}
      try {
        const listS = await adminAPI.getAllServices();
        setServices(listS.map((s) => ({ id: s.id!, name: s.name })));
      } catch {}
    })();
  }, []);

  // Sync items with appointments prop
  useEffect(() => {
    if (appointments && appointments.length > 0) {
      const enriched = appointments.map((item: any) => ({
        ...item,
        doctorId: doctorsMap.get(item.doctorFullName) || item.doctorId || undefined,
      }));
      setItems(enriched);
    }
  }, [appointments, doctorsMap]);

  const formatDateTimeVi = (s?: string) => {
    if (!s) return '';
    return formatDateTime(s);
  };

  const statusClass = (s?: string) => {
    const k = (s || '').toLowerCase();
    if (k.includes('done')) return 'bg-green-100 text-green-700 border border-green-200';
    if (k.includes('scheduled')) return 'bg-blue-100 text-blue-700 border border-blue-200';
    if (k.includes('cancel')) return 'bg-red-100 text-red-700 border border-red-200';
    return 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  const toVietnamDate = (isoDate: string) => {
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  };

  const generateSlots = () => {
    const slots: string[] = [];
    for (let hour = 8; hour <= 19; hour += 1) {
      const hh = hour.toString().padStart(2, '0');
      slots.push(`${hh}:00`);
    }
    return slots;
  };

  // Refresh bookedSet when reschedule open and has doctorId
  useEffect(() => {
    (async () => {
      if (!rescheduleId || !rescheduleDoctorId) {
        setBookedSet(new Set());
        return;
      }
      try {
        const bookingSlots = await patientAPI.getBookingDateTime(rescheduleDoctorId);
        const currentAppointment = items.find((i) => i.id === rescheduleId);
        const currentDateTime = currentAppointment?.dateTime
          ? normalizeDateTime(currentAppointment.dateTime)
          : null;
        const bookedSlots = bookingSlots
          .map((slot) => normalizeDateTime(slot.dateTime || ''))
          .filter((dt) => Boolean(dt) && dt !== currentDateTime);
        setBookedSet(new Set<string>(bookedSlots));
      } catch (e) {
        console.error('Error fetching booked slots for reschedule:', e);
        try {
          const list = await doctorAPI.getAppointmentsByDoctor(rescheduleDoctorId, 'all');
          const scheduledList = list.filter((x) => {
            const status = (x.status || '').toLowerCase().trim();
            return status === 'scheduled';
          });
          const otherScheduled = scheduledList.filter((x) => x.id !== rescheduleId);
          setBookedSet(
            new Set<string>(
              otherScheduled.map((x) => normalizeDateTime(x.dateTime || '')).filter(Boolean),
            ),
          );
        } catch (fallbackError) {
          console.error('Fallback API also failed:', fallbackError);
          setBookedSet(new Set());
        }
      }
    })();
  }, [rescheduleId, rescheduleDoctorId, items]);

  const isSlotDisabled = (slot: string) => {
    if (!rescheduleDate) return true;
    const key = `${slot} ${toVietnamDate(rescheduleDate)}`;
    if (bookedSet.has(key)) return true;
    const today = new Date();
    const [y, m, d] = rescheduleDate.split('-').map(Number);
    const isSameDate = today.getFullYear() === y && today.getMonth() + 1 === m && today.getDate() === d;
    if (!isSameDate) return false;
    const [hh, mi] = slot.split(':').map(Number);
    const dt = new Date(y, m - 1, d, hh, mi, 0, 0);
    return dt.getTime() <= today.getTime();
  };

  const formatBackendDateTime = (date: string, time: string) => {
    if (!date || !time) return '';
    const [y, m, d] = date.split('-');
    return `${time} ${d}/${m}/${y}`;
  };

  const cancelAppointment = async (id: string) => {
    setCancelConfirmId(id);
  };

  const confirmCancel = async () => {
    if (!cancelConfirmId) return;
    try {
      await patientAPI.cancelAppointment(cancelConfirmId);
      setCancelConfirmId(null);
      onBookNew(); // Trigger refresh
    } catch {
      setError('Hủy lịch hẹn thất bại');
      setCancelConfirmId(null);
    }
  };

  const getStatusIcon = (status?: string) => {
    const k = (status || '').toLowerCase();
    if (k.includes('done')) return <CheckCircleOutlined className="text-green-600" />;
    if (k.includes('scheduled')) return <ClockCircleOutlined className="text-blue-600" />;
    if (k.includes('cancel')) return <CloseCircleOutlined className="text-red-600" />;
    return <HourglassOutlined className="text-gray-500" />;
  };

  const getTypeTagColor = (type?: string) => {
    if (!type) return 'default';
    const t = type.toLowerCase();
    if (t.includes('niềng') || t.includes('brace')) return 'cyan';
    if (t.includes('implant') || t.includes('trụ')) return 'purple';
    if (t.includes('răng hàm') || t.includes('molar')) return 'orange';
    if (t.includes('nhổ') || t.includes('extract')) return 'red';
    if (t.includes('trám') || t.includes('fill')) return 'blue';
    return 'geekblue';
  };

  const filteredItems = useMemo(() => {
    let result = items;
    if (filter === 'scheduled') {
      result = items.filter((i) => (i.status || '').toLowerCase().includes('scheduled'));
    } else if (filter === 'done') {
      result = items.filter((i) => (i.status || '').toLowerCase().includes('done'));
    } else if (filter === 'cancel') {
      result = items.filter((i) => (i.status || '').toLowerCase().includes('cancel'));
    }
    return result.sort((a, b) => {
      const dateA = new Date(a.dateTime || 0).getTime();
      const dateB = new Date(b.dateTime || 0).getTime();
      return dateB - dateA;
    });
  }, [items, filter]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);

  const updateAppointment = async () => {
    if (!rescheduleId || !rescheduleDoctorId) {
      setError('Thiếu thông tin lịch hẹn');
      return;
    }
    const dateTime = formatBackendDateTime(rescheduleDate, rescheduleTime);
    if (!dateTime) {
      setError('Chưa chọn ngày/giờ');
      return;
    }
    const currentAppointment = items.find((i) => i.id === rescheduleId);
    if (!currentAppointment) {
      setError('Không tìm thấy lịch hẹn');
      return;
    }

    setRescheduleLoading(true);
    setError(null);
    try {
      const listDentalServicesEntity = currentAppointment.type
        ? services.filter((s) => s.name === currentAppointment.type).slice(0, 1).map((s) => ({ id: s.id }))
        : currentAppointment.listDentalServicesEntity || [];

      await patientAPI.updateAppointment(rescheduleId, {
        doctorId: rescheduleDoctorId,
        dateTime,
        type: currentAppointment.type || '',
        notes: currentAppointment.notes || '',
        listDentalServicesEntity,
      });
      setRescheduleId(null);
      setRescheduleDoctorId(null);
      setRescheduleDate('');
      setRescheduleTime('');
      onBookNew(); // Trigger refresh
    } catch (e: any) {
      setError(e.response?.data?.message || 'Cập nhật lịch hẹn thất bại');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const openExamDetail = async (appointmentId: string) => {
    setDetailOpenId(appointmentId);
    setExamDetail(null);
    try {
      const detail = await doctorAPI.getExaminationByAppointment(appointmentId);
      setExamDetail(detail);
    } catch {
      setExamDetail({ error: 'Không tải được hồ sơ khám' });
    }
  };

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 pb-2">
        <button
          onClick={() => {
            onFilterChange('all');
            onPageChange(1);
          }}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Tất cả ({items.length})
        </button>
        <button
          onClick={() => {
            onFilterChange('scheduled');
            onPageChange(1);
          }}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${
            filter === 'scheduled'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Sắp tới ({items.filter((i) => (i.status || '').toLowerCase().includes('scheduled')).length})
        </button>
        <button
          onClick={() => {
            onFilterChange('done');
            onPageChange(1);
          }}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${
            filter === 'done' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Đã hoàn thành ({items.filter((i) => (i.status || '').toLowerCase().includes('done')).length})
        </button>
        <button
          onClick={() => {
            onFilterChange('cancel');
            onPageChange(1);
          }}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${
            filter === 'cancel' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Đã hủy ({items.filter((i) => (i.status || '').toLowerCase().includes('cancel')).length})
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-20 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      ) : (
        <>
          {paginatedItems.length === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-gray-500">
              {filter === 'all'
                ? 'Bạn chưa có lịch hẹn nào.'
                : `Không có lịch hẹn ${filter === 'scheduled' ? 'sắp tới' : filter === 'done' ? 'đã hoàn thành' : 'đã hủy'}.`}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {paginatedItems.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-border bg-white px-4 py-3 shadow-sm hover:shadow-md transition flex items-center gap-4"
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0 text-lg">{getStatusIcon(a.status)}</div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate mb-1">
                      {a.doctorFullName} {a.doctorSpecialization ? `— ${a.doctorSpecialization}` : ''}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag color={getTypeTagColor(a.type)} className="m-0">
                        {a.type}
                      </Tag>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <ClockCircleOutlined className="text-blue-600" />
                        <span className="font-semibold text-blue-700">{formatDateTimeVi(a.dateTime)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {a.status && a.status.toLowerCase().includes('scheduled') && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRescheduleId(a.id);
                            setRescheduleDoctorId(a.doctorId || null);
                            if (a.dateTime) {
                              const dt = normalizeDateTime(a.dateTime);
                              const match = dt.match(/^(\d{2}):(\d{2})\s(\d{2})\/(\d{2})\/(\d{4})$/);
                              if (match) {
                                const [, hh, mm, dd, MM, yyyy] = match;
                                setRescheduleTime(`${hh}:${mm}`);
                                setRescheduleDate(`${yyyy}-${MM}-${dd}`);
                              }
                            }
                          }}
                        >
                          Đổi giờ
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => cancelAppointment(a.id)}>
                          Hủy
                        </Button>
                      </>
                    )}
                    {a.status && a.status.toLowerCase().includes('done') && (
                      <Button variant="outline" size="sm" onClick={() => openExamDetail(a.id)}>
                        Xem hồ sơ khám
                      </Button>
                    )}
                    <span
                      className={`text-xs font-medium rounded-full px-2.5 py-1 ${statusClass(a.status)} min-w-[80px] text-center`}
                    >
                      {a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Trước
              </Button>
              <span className="text-sm text-gray-600">
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        title="Xác nhận hủy lịch hẹn"
        open={!!cancelConfirmId}
        onOk={confirmCancel}
        onCancel={() => setCancelConfirmId(null)}
        okText="Xác nhận hủy"
        cancelText="Hủy bỏ"
        okButtonProps={{ danger: true }}
      >
        <p>Bạn có chắc chắn muốn hủy lịch hẹn này? Hành động này không thể hoàn tác.</p>
      </Modal>

      {/* Reschedule Modal */}
      {rescheduleId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-5">
            <h4 className="text-base font-semibold mb-3">Đổi giờ lịch hẹn</h4>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Ngày</label>
                <Input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => {
                    setRescheduleDate(e.target.value);
                    setRescheduleTime('');
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Khung giờ</label>
                <div className="grid grid-cols-3 gap-2">
                  {generateSlots().map((s) => {
                    const disabled = isSlotDisabled(s);
                    const selected = rescheduleTime === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={disabled}
                        onClick={() => setRescheduleTime(s)}
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
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setRescheduleId(null);
                  setRescheduleDoctorId(null);
                  setRescheduleDate('');
                  setRescheduleTime('');
                }}
              >
                Đóng
              </Button>
              <Button onClick={updateAppointment} loading={rescheduleLoading}>
                Lưu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Exam Detail Modal */}
      {detailOpenId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-5">
            <h4 className="text-base font-semibold mb-3">Hồ sơ khám</h4>
            <div className="max-h-[60vh] overflow-auto text-sm space-y-4">
              {!examDetail && <div>Đang tải...</div>}
              {examDetail && examDetail.error && <div className="text-red-600">{examDetail.error}</div>}
              {examDetail && !examDetail.error && (
                <>
                  {Array.isArray(examDetail.listImage) && examDetail.listImage.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Hình ảnh</h5>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {examDetail.listImage.map((img: any, idx: number) => (
                          <a
                            key={idx}
                            href={img.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block group"
                          >
                            <div className="aspect-[4/3] overflow-hidden rounded-md border">
                              <img
                                src={img.url}
                                alt={`Ảnh khám ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:opacity-90"
                              />
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Chi tiết</h5>
                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(examDetail, null, 2)}</pre>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setDetailOpenId(null);
                  setExamDetail(null);
                }}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentList;

