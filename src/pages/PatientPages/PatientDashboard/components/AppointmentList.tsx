import React, { useState, useEffect, useMemo } from 'react';
import { Alert, AlertTitle, AlertDescription, Button, Input, Modal } from '@/components/ui';
import { Tag } from 'antd';
import { Select as AntSelect } from 'antd';
import { X } from 'lucide-react';
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
import type { CategoryDentalService, DentalService } from '@/types/admin';

const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  filter,
  page,
  pageSize,
  onFilterChange,
  onPageChange,
  onBookNew,
  onRefreshData,
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
      listDentalServicesEntity?: Array<{ id: string; name?: string; unit?: string; unitPrice?: number }>;
    }>
  >([]);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleDoctorId, setRescheduleDoctorId] = useState<string | null>(null);
  const [rescheduleType, setRescheduleType] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [rescheduleCategoryId, setRescheduleCategoryId] = useState<string>('');
  const [rescheduleServiceOrders, setRescheduleServiceOrders] = useState<Array<{
    id: string;
    name: string;
    unit: string;
    unitPrice: number;
    categoryName?: string;
  }>>([]);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [services, setServices] = useState<Array<{ id: string; name: string; categoryName?: string }>>([]);
  const [allServices, setAllServices] = useState<DentalService[]>([]);
  const [categories, setCategories] = useState<CategoryDentalService[]>([]);
  const [doctors, setDoctors] = useState<Array<{ id: string; fullName: string; specialization: string }>>([]);
  const [detailOpenId, setDetailOpenId] = useState<string | null>(null);
  const [examDetail, setExamDetail] = useState<any | null>(null);
  const [doctorById, setDoctorById] = useState<
    Map<string, { fullName: string; specialization?: string }>
  >(new Map());
  const [bookedSet, setBookedSet] = useState<Set<string>>(new Set());
  const [appointmentDetail, setAppointmentDetail] = useState<{
    id: string;
    doctorFullName: string;
    doctorSpecialization?: string;
    dateTime: string;
    type: string;
    status: string;
    notes?: string;
    listDentalServicesEntity?: Array<{
      id: string;
      name?: string;
      unit?: string;
      unitPrice?: number;
      categoryName?: string;
    }>;
  } | null>(null);
  const [appointmentDetailOpen, setAppointmentDetailOpen] = useState(false);

  // Load doctors map and dịch vụ + danh mục for lookup
  useEffect(() => {
    (async () => {
      try {
        const list = await doctorAPI.getDoctorDirectory();
        setDoctors(list);
        const map = new Map<string, { fullName: string; specialization?: string }>();
        list.forEach((d) => {
          if (d.id) {
            map.set(d.id, { fullName: d.fullName, specialization: d.specialization });
          }
        });
        setDoctorById(map);
      } catch {}
      try {
        const categoriesList = await adminAPI.getAllCategories();
        setCategories(categoriesList);
        const flatServices: Array<{ id: string; name: string; categoryName?: string }> = [];
        categoriesList.forEach((cat) => {
          if (cat.listDentalServiceEntity && cat.listDentalServiceEntity.length > 0) {
            cat.listDentalServiceEntity.forEach((s) => {
              if (s.id && s.name) {
                flatServices.push({
                  id: s.id,
                  name: s.name,
                  categoryName: cat.name,
                });
              }
            });
          }
        });
        setServices(flatServices);
      } catch {}
      try {
        const allServicesList = await adminAPI.getAllServices();
        setAllServices(allServicesList);
      } catch {}
    })();
  }, []);

  // Sync items with appointments prop
  useEffect(() => {
    if (!appointments) {
      setItems([]);
      return;
    }
    
    const enriched = appointments.map((item: any) => {
      const doctorInfo = item.doctorId ? doctorById.get(item.doctorId) : undefined;
      return {
        ...item,
        doctorFullName: item.doctorFullName || doctorInfo?.fullName || '',
        doctorSpecialization: item.doctorSpecialization || doctorInfo?.specialization || '',
      };
    });
    setItems(enriched);
  }, [appointments, doctorById.size, JSON.stringify(Array.from(doctorById.keys()))]); // Depend on appointments and doctorById to update when doctors are loaded

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

  const statusLabel = (s?: string) => {
    const k = (s || '').toLowerCase();
    if (k.includes('done')) return 'Hoàn thành';
    if (k.includes('scheduled')) return 'Sắp tới';
    if (k.includes('cancel')) return 'Đã hủy';
    return s || 'Không xác định';
  };

  const toVietnamDate = (isoDate: string) => {
    if (!isoDate) return '';
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
      // Refresh data and switch to cancelled tab
      if (onRefreshData) {
        await onRefreshData();
      }
      // Switch to cancelled filter to show the cancelled appointment
      // Use setTimeout to ensure state updates are processed
      setTimeout(() => {
        onFilterChange('cancel');
        onPageChange(1);
      }, 100);
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

  const filteredRescheduleServices = useMemo(() => {
    if (!rescheduleCategoryId) return [];
    const category = categories.find((c) => c.id === rescheduleCategoryId);
    if (category && category.listDentalServiceEntity && category.listDentalServiceEntity.length > 0) {
      return category.listDentalServiceEntity;
    }
    return [];
  }, [categories, rescheduleCategoryId]);

  // Group selected services by category for display
  const rescheduleServicesByCategory = useMemo(() => {
    const grouped: Record<string, Array<{ service: typeof rescheduleServiceOrders[0]; index: number }>> = {};
    rescheduleServiceOrders.forEach((serviceOrder, index) => {
      const categoryName = serviceOrder.categoryName || 'Khác';
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push({ service: serviceOrder, index });
    });
    return grouped;
  }, [rescheduleServiceOrders]);

  const handleRescheduleServiceAdd = (service: DentalService) => {
    // Find category name
    const category = categories.find((c) => 
      c.listDentalServiceEntity?.some((s) => s.id === service.id)
    );
    const categoryName = category?.name || 'Khác';
    
    // Check if service already added
    if (rescheduleServiceOrders.some((s) => s.id === service.id)) {
      setError('Dịch vụ này đã được chọn');
      return;
    }
    
    setRescheduleServiceOrders((prev) => {
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
        setRescheduleType(newOrders[0].name);
      } else {
        setRescheduleType('Nhiều dịch vụ');
      }
      return newOrders;
    });
    
    // Reset selected service dropdown
    setRescheduleCategoryId('');
    setError(null);
  };

  const handleRescheduleServiceRemove = (index: number) => {
    setRescheduleServiceOrders((prev) => {
      const newOrders = prev.filter((_, i) => i !== index);
      // Update type field
      if (newOrders.length === 0) {
        setRescheduleType('');
      } else if (newOrders.length === 1) {
        setRescheduleType(newOrders[0].name);
      } else {
        setRescheduleType('Nhiều dịch vụ');
      }
      return newOrders;
    });
  };

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
    if (rescheduleServiceOrders.length === 0) {
      setError('Chưa chọn dịch vụ');
      return;
    }

    setRescheduleLoading(true);
    setError(null);
    try {
      // Get first service name for type field (for backward compatibility)
      const typeValue = rescheduleServiceOrders.length === 1
        ? rescheduleServiceOrders[0].name
        : 'Nhiều dịch vụ';
      
      // Build listDentalServicesEntity array
      const listDentalServicesEntity = rescheduleServiceOrders.map((s) => ({ id: s.id }));

      await patientAPI.updateAppointment(rescheduleId, {
        doctorId: rescheduleDoctorId,
        dateTime,
        type: typeValue,
        notes: rescheduleNotes || '',
        listDentalServicesEntity,
      });
      setRescheduleId(null);
      setRescheduleDoctorId(null);
      setRescheduleDate('');
      setRescheduleTime('');
      setRescheduleType('');
      setRescheduleNotes('');
      setRescheduleCategoryId('');
      setRescheduleServiceOrders([]);
      if (onRefreshData) {
        await onRefreshData();
      }
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

  const openAppointmentDetail = (a: {
    id: string;
    doctorFullName: string;
    doctorSpecialization?: string;
    dateTime: string;
    status: string;
    type: string;
    notes?: string;
    listDentalServicesEntity?: Array<{ id: string; name?: string; unit?: string; unitPrice?: number }>;
  }) => {
    // Map services with category names
    const servicesWithCategory = (a.listDentalServicesEntity || []).map((svc) => {
      // Find category for this service
      const matchedService = services.find((s) => s.id === svc.id);
      const categoryName = matchedService?.categoryName;
      
      // If not found, try to find from categories
      if (!categoryName) {
        const category = categories.find((c) =>
          c.listDentalServiceEntity?.some((s) => s.id === svc.id)
        );
        return {
          ...svc,
          categoryName: category?.name || 'Khác',
        };
      }
      
      return {
        ...svc,
        categoryName,
      };
    });
    
    setAppointmentDetail({
      id: a.id,
      doctorFullName: a.doctorFullName,
      doctorSpecialization: a.doctorSpecialization,
      dateTime: a.dateTime,
      status: a.status,
      type: a.type,
      notes: a.notes,
      listDentalServicesEntity: servicesWithCategory,
    });
    setAppointmentDetailOpen(true);
  };

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filter Tabs (chỉ hiển thị Sắp tới, Đã hoàn thành, Đã hủy) */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 pb-2">
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
                    <Button variant="outline" size="sm" onClick={() => openAppointmentDetail(a)}>
                      Chi tiết
                    </Button>
                    {a.status && a.status.toLowerCase().includes('scheduled') && (() => {
                      // Check if appointment belongs to TreatmentPhase
                      // TreatmentPhase appointments have type "TreatmentPhases" (exact match)
                      // From backend: TreatmentPhasesService.java line 201 sets type to "TreatmentPhases"
                      const isTreatmentPhase = a.type === 'TreatmentPhases';
                      
                      // Only show reschedule and cancel buttons if NOT a TreatmentPhase appointment
                      if (!isTreatmentPhase) {
                        return (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRescheduleId(a.id);
                                setRescheduleDoctorId(a.doctorId || null);
                                setRescheduleType(a.type || '');
                                setRescheduleNotes(a.notes || '');
                                
                                // Find services and category from current appointment
                                // Get all services from appointment's listDentalServicesEntity
                                const appointmentServiceOrders: Array<{
                                  id: string;
                                  name: string;
                                  unit: string;
                                  unitPrice: number;
                                  categoryName?: string;
                                }> = [];
                                
                                if (a.listDentalServicesEntity && a.listDentalServicesEntity.length > 0) {
                                  a.listDentalServicesEntity.forEach((svc: any) => {
                                    if (svc.id) {
                                      // Find full service details
                                      const fullService = allServices.find((s) => s.id === svc.id);
                                      if (fullService) {
                                        // Find category name
                                        const matchedCategory = categories.find((c) => 
                                          c.listDentalServiceEntity?.some((s) => s.id === fullService.id)
                                        );
                                        appointmentServiceOrders.push({
                                          id: fullService.id,
                                          name: fullService.name,
                                          unit: fullService.unit,
                                          unitPrice: fullService.unitPrice,
                                          categoryName: matchedCategory?.name || 'Khác',
                                        });
                                      } else {
                                        // Fallback: use data from svc if available
                                        appointmentServiceOrders.push({
                                          id: svc.id,
                                          name: svc.name || '',
                                          unit: svc.unit || '',
                                          unitPrice: svc.unitPrice || 0,
                                          categoryName: 'Khác',
                                        });
                                      }
                                    }
                                  });
                                } else if (a.type) {
                                  // Fallback: try to find by type name
                                  const matchedService = services.find((s) => s.name === a.type);
                                  if (matchedService) {
                                    const fullService = allServices.find((s) => s.id === matchedService.id);
                                    if (fullService) {
                                      const matchedCategory = categories.find((c) => 
                                        c.listDentalServiceEntity?.some((s) => s.id === fullService.id)
                                      );
                                      appointmentServiceOrders.push({
                                        id: fullService.id,
                                        name: fullService.name,
                                        unit: fullService.unit,
                                        unitPrice: fullService.unitPrice,
                                        categoryName: matchedCategory?.name || 'Khác',
                                      });
                                    }
                                  }
                                }
                                
                                if (appointmentServiceOrders.length > 0) {
                                  setRescheduleServiceOrders(appointmentServiceOrders);
                                  // Set type based on services
                                  if (appointmentServiceOrders.length === 1) {
                                    setRescheduleType(appointmentServiceOrders[0].name);
                                  } else {
                                    setRescheduleType('Nhiều dịch vụ');
                                  }
                                }
                                
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
                              Đổi lịch
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => cancelAppointment(a.id)}>
                              Hủy
                            </Button>
                          </>
                        );
                      }
                      return null;
                    })()}
                    <span
                      className={`text-xs font-medium rounded-full px-2.5 py-1 ${statusClass(
                        a.status,
                      )} min-w-[80px] text-center`}
                    >
                      {statusLabel(a.status)}
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

      {/* Appointment Detail Modal */}
      <Modal
        title="Chi tiết lịch hẹn"
        open={appointmentDetailOpen}
        onOk={() => setAppointmentDetailOpen(false)}
        onCancel={() => setAppointmentDetailOpen(false)}
        okText="Đóng"
        footer={[
          <Button key="close" onClick={() => setAppointmentDetailOpen(false)}>
            Đóng
          </Button>
        ]}
        width={600}
        style={{ top: 20 }}
        bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
      >
        {appointmentDetail && (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Bác sĩ</p>
              <p className="text-sm text-gray-900 font-medium">
                {appointmentDetail.doctorFullName}
                {appointmentDetail.doctorSpecialization ? ` — ${appointmentDetail.doctorSpecialization}` : ''}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Ngày giờ</p>
              <p className="text-sm text-blue-700 font-medium">{formatDateTimeVi(appointmentDetail.dateTime)}</p>
            </div>
            
            {/* Dịch vụ sử dụng - nhóm theo category */}
            {appointmentDetail.listDentalServicesEntity && appointmentDetail.listDentalServicesEntity.length > 0 ? (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Dịch vụ sử dụng</p>
                <div className="rounded-2xl border border-border/70 bg-muted/50 p-4">
                  {(() => {
                    // Group services by category
                    type ServiceItem = {
                      id: string;
                      name?: string;
                      unit?: string;
                      unitPrice?: number;
                      categoryName?: string;
                    };
                    const grouped: Record<string, ServiceItem[]> = {};
                    appointmentDetail.listDentalServicesEntity!.forEach((svc) => {
                      const categoryName = svc.categoryName || 'Khác';
                      if (!grouped[categoryName]) {
                        grouped[categoryName] = [];
                      }
                      grouped[categoryName].push(svc);
                    });
                    
                    return (
                      <div className="space-y-3">
                        {Object.entries(grouped).map(([categoryName, items]) => (
                          <div key={categoryName} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="h-px flex-1 bg-border/50"></div>
                              <span className="text-xs font-semibold text-muted-foreground uppercase">
                                {categoryName}
                              </span>
                              <div className="h-px flex-1 bg-border/50"></div>
                            </div>
                            <div className="space-y-2">
                              {items.map((service, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between rounded-xl border border-border/60 bg-white px-3 py-2"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">{service.name || 'N/A'}</p>
                                    {service.unitPrice && (
                                      <p className="text-xs text-muted-foreground">
                                        {service.unitPrice.toLocaleString('vi-VN')} đ / {service.unit || 'đơn vị'}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Dịch vụ</p>
                <p className="text-sm text-gray-900">{appointmentDetail.type || 'N/A'}</p>
              </div>
            )}
            
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Trạng thái</p>
              <p className="text-sm">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(
                    appointmentDetail.status,
                  )}`}
                >
                  {statusLabel(appointmentDetail.status)}
                </span>
              </p>
            </div>
            {appointmentDetail.notes && appointmentDetail.notes.trim() && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Ghi chú</p>
                <p className="text-sm text-gray-900 whitespace-pre-wrap break-words bg-gray-50 rounded-lg p-3 border border-gray-200">
                  {appointmentDetail.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reschedule Modal */}
      {rescheduleId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col my-4">
            <div className="p-5 pb-4 border-b border-gray-200 flex-shrink-0">
              <h4 className="text-base font-semibold">Đổi lịch hẹn</h4>
            </div>
            <div className="p-5 overflow-y-auto flex-1 min-h-0">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>Lỗi</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Chọn bác sĩ</label>
                <AntSelect
                  showSearch
                  placeholder="Chọn bác sĩ"
                  className="w-full"
                  value={rescheduleDoctorId || undefined}
                  onChange={(v) => {
                    setRescheduleDoctorId(v);
                    setRescheduleDate('');
                    setRescheduleTime('');
                  }}
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
                        value={rescheduleCategoryId || undefined}
                        onChange={(value) => {
                          setRescheduleCategoryId(value);
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
                        placeholder={rescheduleCategoryId ? "Chọn dịch vụ" : "Chọn danh mục trước"}
                        className="w-56"
                        value=""
                        onChange={(value) => {
                          const service = filteredRescheduleServices.find((s) => s.id === value);
                          if (service) {
                            handleRescheduleServiceAdd(service);
                          }
                        }}
                        disabled={!rescheduleCategoryId || filteredRescheduleServices.length === 0}
                        optionFilterProp="label"
                        options={filteredRescheduleServices.map((s) => ({
                          label: `${s.name} — ${s.unitPrice.toLocaleString('vi-VN')} đ`,
                          value: s.id,
                        }))}
                      />
                    </div>
                  </div>

                  {/* Hiển thị danh sách dịch vụ đã chọn, nhóm theo category */}
                  {rescheduleServiceOrders.length > 0 && (
                    <div className="space-y-3 mt-4">
                      {Object.entries(rescheduleServicesByCategory).map(([categoryName, items]) => (
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
                                  onClick={() => handleRescheduleServiceRemove(index)}
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
                  {rescheduleServiceOrders.length === 0 && (
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
                    value={rescheduleDate}
                    min={(() => {
                      const today = new Date();
                      const y = today.getFullYear();
                      const m = String(today.getMonth() + 1).padStart(2, '0');
                      const d = String(today.getDate()).padStart(2, '0');
                      return `${y}-${m}-${d}`;
                    })()}
                    onChange={(e) => {
                      setRescheduleDate(e.target.value);
                      setRescheduleTime('');
                    }}
                    className={rescheduleDate ? 'pr-10' : ''}
                  />
                  {rescheduleDate && (
                    <button
                      type="button"
                      onClick={() => {
                        setRescheduleDate('');
                        setRescheduleTime('');
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
                  {rescheduleTime && (
                    <button
                      type="button"
                      onClick={() => setRescheduleTime('')}
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Ghi chú</label>
                <textarea
                  className="w-full border rounded-md px-3 py-2"
                  rows={3}
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                  placeholder="Ghi chú cho bác sĩ..."
                />
              </div>
            </div>
            </div>
            <div className="p-5 pt-4 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => {
                  setRescheduleId(null);
                  setRescheduleDoctorId(null);
                  setRescheduleDate('');
                  setRescheduleTime('');
                  setRescheduleType('');
                  setRescheduleNotes('');
                  setRescheduleCategoryId('');
                  setRescheduleServiceOrders([]);
                  setError(null);
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

