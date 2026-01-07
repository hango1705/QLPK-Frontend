import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from '@/components/ui';
import {
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  Edit,
  Plus,
  AlertTriangle,
  Activity,
  Star,
  User,
  Smile,
  Eye,
  Send,
} from 'lucide-react';
import type { OverviewSectionProps } from '../types';
import { formatDateTime, formatDate } from '../utils';
import { Odontogram } from 'react-odontogram';
import { patientAPI, type ToothResponse } from '@/services/api/patient';
import { usePermission } from '@/hooks';

const OverviewSection: React.FC<OverviewSectionProps> = ({
  patient,
  appointmentCount,
  planCount,
  phaseCount,
  paymentCount,
  activities,
  lastVisit,
  nextAppointment,
  recentAppointments,
  treatments,
  onBookAppointment,
  patientId,
  emergencyContactName,
  emergencyPhoneNumber,
  medicalConditions = [],
  onEditInfo,
  onAddNote,
  onCreateExamination,
  onSendReminder,
  onViewOdontogramDetail,
}) => {
  // Tính toán tuổi từ ngày sinh
  const age = useMemo(() => {
    if (!patient?.dob) return null;
    const birthDate = new Date(patient.dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, [patient?.dob]);

  // Format gender
  const genderLabel = patient?.gender === 'MALE' || patient?.gender === 'male' || patient?.gender === 'Nam' 
    ? 'Nam' 
    : patient?.gender === 'FEMALE' || patient?.gender === 'female' || patient?.gender === 'Nữ'
    ? 'Nữ'
    : patient?.gender || '';

  const { hasPermission } = usePermission();
  const canGetToothStatus = hasPermission('GET_TOOTH_STATUS');

  // Định nghĩa các tình trạng răng và màu sắc tương ứng (giống OdontogramView)
  const TOOTH_STATUSES = [
    { value: 'normal', label: 'Bình thường', color: '#ffffff', borderColor: '#d1d5db', bgColor: 'bg-white' },
    { value: 'cavity', label: 'Sâu răng', color: '#fef3c7', borderColor: '#f59e0b', bgColor: 'bg-amber-100' },
    { value: 'filled', label: 'Đã trám', color: '#dbeafe', borderColor: '#3b82f6', bgColor: 'bg-blue-100' },
    { value: 'crown', label: 'Bọc răng', color: '#f3e8ff', borderColor: '#a855f7', bgColor: 'bg-purple-100' },
    { value: 'extracted', label: 'Đã nhổ', color: '#e5e7eb', borderColor: '#6b7280', bgColor: 'bg-gray-200' },
    { value: 'root_canal', label: 'Điều trị tủy', color: '#fee2e2', borderColor: '#ef4444', bgColor: 'bg-red-100' },
  ] as const;

  // State quản lý tình trạng của từng răng (toothNumber -> { status, id })
  const [toothStatusMap, setToothStatusMap] = useState<Record<number, { status: string; id?: string }>>({});
  const [loadingTeeth, setLoadingTeeth] = useState(false);

  // Ref cho Odontogram container
  const odontogramRef = useRef<HTMLDivElement>(null);

  // Fetch dữ liệu răng từ API
  useEffect(() => {
    if (!patientId || !canGetToothStatus) return;

    const loadTeeth = async () => {
      setLoadingTeeth(true);
      try {
        const teethData = await patientAPI.getPatientTeeth(patientId.toString());
        const newMap: Record<number, { status: string; id?: string }> = {};
        teethData.forEach((tooth) => {
          const toothNumber = parseInt(tooth.toothNumber, 10);
          if (!isNaN(toothNumber)) {
            newMap[toothNumber] = { status: tooth.status, id: tooth.id };
          }
        });
        setToothStatusMap(newMap);
      } catch (error) {
        // Silent fail for overview - không hiển thị lỗi
        console.error('Failed to load teeth data:', error);
      } finally {
        setLoadingTeeth(false);
      }
    };

    loadTeeth();
  }, [patientId, canGetToothStatus]);

  // Convert teeth data to initialSelected format
  const initialSelected = useMemo(() => {
    return Object.keys(toothStatusMap)
      .filter((toothNumber) => {
        const toothData = toothStatusMap[parseInt(toothNumber, 10)];
        return toothData && toothData.status && toothData.status !== 'normal';
      })
      .map((toothNumber) => `teeth-${toothNumber}`);
  }, [toothStatusMap]);

  // Find tooth group helper function
  const findToothGroup = (svg: SVGElement, toothNumber: number): Element | null => {
    const allGroups = svg.querySelectorAll('g');
    for (const group of allGroups) {
      const ariaLabel = group.getAttribute('aria-label') || '';
      if (ariaLabel.includes(`teeth-${toothNumber}`) || ariaLabel.includes(`Tooth teeth-${toothNumber}`)) {
        return group;
      }
    }
    return null;
  };

  // Generate CSS để highlight từng răng với màu tương ứng
  const toothColorStyles = useMemo(() => {
    return Object.entries(toothStatusMap)
      .map(([toothNumber, toothData]) => {
        const status = toothData.status;
        const statusConfig = TOOTH_STATUSES.find((s) => s.value === status);
        if (!statusConfig || status === 'normal') return '';
        return `
          /* Target tooth by ID - multiple selectors to catch all cases */
          .react-odontogram svg #teeth-${toothNumber} path,
          .react-odontogram svg #teeth-${toothNumber} > path,
          .react-odontogram svg g[id="teeth-${toothNumber}"] path,
          .react-odontogram svg g[id="teeth-${toothNumber}"] > path,
          .react-odontogram svg [id="teeth-${toothNumber}"] path,
          .react-odontogram svg [id="teeth-${toothNumber}"] > path {
            fill: ${statusConfig.color} !important;
            stroke: ${statusConfig.borderColor} !important;
            stroke-width: 2px !important;
          }
          /* Also target any nested paths */
          .react-odontogram svg #teeth-${toothNumber} path[fill],
          .react-odontogram svg g[id="teeth-${toothNumber}"] path[fill],
          .react-odontogram svg [id="teeth-${toothNumber}"] path[fill] {
            fill: ${statusConfig.color} !important;
          }
        `;
      })
      .join('\n');
  }, [toothStatusMap]);

  // Apply colors directly to SVG elements based on toothStatusMap
  useEffect(() => {
    if (!odontogramRef.current) return;

    const applyColors = () => {
      const svg = odontogramRef.current?.querySelector('svg.Odontogram') || 
                  odontogramRef.current?.querySelector('svg');
      if (!svg) return false;

      // Apply colors to each tooth based on status
      Object.entries(toothStatusMap).forEach(([toothNumberStr, toothData]) => {
        const toothNumber = parseInt(toothNumberStr, 10);
        const status = toothData.status;
        const statusConfig = TOOTH_STATUSES.find((s) => s.value === status);
        
        // Find the correct group by aria-label
        const toothGroup = findToothGroup(svg, toothNumber);
        
        if (!toothGroup) {
          return;
        }

        const paths = toothGroup.querySelectorAll('path');
        
        if (paths.length === 0) return;

        if (!statusConfig || status === 'normal') {
          // Reset to default for normal teeth
          paths.forEach((path) => {
            path.style.setProperty('fill', 'white', 'important');
            path.style.setProperty('stroke', '#1f2937', 'important');
            path.style.setProperty('stroke-width', '1px', 'important');
          });
        } else {
          // Apply color based on status
          paths.forEach((path) => {
            path.style.setProperty('fill', statusConfig.color, 'important');
            path.style.setProperty('stroke', statusConfig.borderColor, 'important');
            path.style.setProperty('stroke-width', '2px', 'important');
          });
        }
      });

      // Set all other teeth to white
      const allGroups = svg.querySelectorAll('g');
      allGroups.forEach((group) => {
        const ariaLabel = group.getAttribute('aria-label') || '';
        const toothMatch = ariaLabel.match(/teeth-(\d+)/);
        if (toothMatch) {
          const toothNum = parseInt(toothMatch[1], 10);
          if (!toothStatusMap[toothNum] || toothStatusMap[toothNum].status === 'normal') {
            const paths = group.querySelectorAll('path');
            paths.forEach((path) => {
              path.style.setProperty('fill', 'white', 'important');
              path.style.setProperty('stroke', '#1f2937', 'important');
              path.style.setProperty('stroke-width', '1px', 'important');
            });
          }
        }
      });
      
      return true;
    };

    // Try immediately
    if (!applyColors()) {
      // If SVG not ready, wait and retry
      const timeoutId = setTimeout(() => {
        applyColors();
      }, 200);

      // Also try after a longer delay
      const timeoutId2 = setTimeout(() => {
        applyColors();
      }, 500);

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(timeoutId2);
      };
    }
  }, [toothStatusMap, initialSelected]);

  // Format next appointment
  const nextAppointmentData = useMemo(() => {
    if (!nextAppointment) return null;
    const date = new Date(nextAppointment);
    const days = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    return {
      dayOfWeek: days[date.getDay()],
      day: date.getDate(),
      month: months[date.getMonth()],
      year: date.getFullYear(),
      time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      content: recentAppointments[0]?.type || 'Khám tổng quát',
      doctor: recentAppointments[0]?.doctorName || 'BS. Chưa xác định',
    };
  }, [nextAppointment, recentAppointments]);

  return (
    <div className="space-y-6">
      {/* Patient Header Section */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-6">
            {/* Left: Patient Info */}
            <div className="flex items-start gap-4 flex-1">
              {/* Profile Picture */}
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {patient?.fullName?.charAt(0)?.toUpperCase() || 'P'}
              </div>

              {/* Patient Details */}
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {patient?.fullName || 'Chưa có tên'}
                </h2>
                <div className="flex flex-wrap items-center gap-4 mb-3">
                  <span className="text-sm text-gray-600">
                    {genderLabel}{age ? `, ${age} tuổi` : ''}
                  </span>
                  {patientId && (
                    <span className="text-sm text-gray-600">ID: {patientId}</span>
                  )}
                  {lastVisit && (
                    <span className="text-sm text-gray-600">
                      Lần khám cuối: {formatDate(lastVisit)}
                    </span>
                  )}
                </div>

                {/* Medical Condition Tags */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {patient?.allergy && (
                    <Badge className="bg-red-100 text-red-800 border-red-300 hover:bg-red-100">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      DỊ ỨNG: {patient.allergy.toUpperCase()}
                    </Badge>
                  )}
                  {medicalConditions
                    .filter((c) => c.type === 'disease')
                    .map((condition, idx) => (
                      <Badge key={idx} className="bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100">
                        <Activity className="h-3 w-3 mr-1" />
                        {condition.label.toUpperCase()}
                      </Badge>
                    ))}
                  {medicalConditions
                    .filter((c) => c.type === 'vip')
                    .map((condition, idx) => (
                      <Badge key={idx} className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100">
                        <Star className="h-3 w-3 mr-1" />
                        {condition.label.toUpperCase()}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={onEditInfo}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Sửa thông tin
              </Button>
              <Button
                size="sm"
                onClick={onAddNote}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Thêm ghi chú
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contact Info & Next Appointment */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Thông tin liên hệ</CardTitle>
              <Button variant="ghost" size="sm" onClick={onEditInfo} className="h-8 w-8 p-0">
                <Edit className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Điện thoại</p>
                  <p className="text-sm font-medium">{patient?.phone || 'Chưa cập nhật'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Email</p>
                  <p className="text-sm font-medium">{patient?.email || 'Chưa cập nhật'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Địa chỉ</p>
                  <p className="text-sm font-medium">{patient?.address || 'Chưa cập nhật'}</p>
                </div>
              </div>
              {emergencyContactName && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-500 uppercase mb-2">Liên hệ khẩn cấp</p>
                  <p className="text-sm font-medium">
                    {emergencyContactName}
                    {emergencyPhoneNumber && ` (${emergencyPhoneNumber})`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Appointment */}
          {nextAppointmentData && (
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Lịch hẹn tiếp theo</span>
                  <span className="text-xs font-normal text-gray-600">
                    Đừng quên nhắc nhở bệnh nhân.
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 text-white rounded-lg p-4 text-center min-w-[80px]">
                    <div className="text-xs font-medium mb-1">
                      {nextAppointmentData.dayOfWeek.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="text-2xl font-bold">{nextAppointmentData.day}</div>
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-900">
                      {nextAppointmentData.time}
                    </p>
                    <p className="text-sm text-gray-600">
                      {nextAppointmentData.dayOfWeek}, {nextAppointmentData.month}/{nextAppointmentData.year}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-blue-200">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Nội dung:</p>
                    <p className="text-sm font-medium">{nextAppointmentData.content}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Bác sĩ:</p>
                    <p className="text-sm font-medium">{nextAppointmentData.doctor}</p>
                  </div>
                </div>
                <Button
                  onClick={onSendReminder}
                  className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                  Gửi nhắc hẹn
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Tooth Chart & Treatment History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Tooth Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Smile className="h-5 w-5" />
                Sơ đồ răng nhanh
              </CardTitle>
              {onViewOdontogramDetail && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onViewOdontogramDetail}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Xem chi tiết
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-lg p-4">
                <div className="max-w-md mx-auto">
                  <div 
                    ref={odontogramRef}
                    className="w-full overflow-x-auto bg-white rounded-xl p-4 [&_svg]:bg-white [&_svg_path]:stroke-gray-800 [&_svg_path]:fill-white"
                  >
                    <style>{`
                      /* Override odontogram styles for light theme */
                      .react-odontogram svg {
                        background-color: white !important;
                      }
                      .react-odontogram svg path {
                        stroke: #1f2937 !important;
                        fill: white !important;
                      }
                      
                      /* Show tooth numbers/labels - target all text and tspan elements */
                      .react-odontogram svg text,
                      .react-odontogram svg tspan {
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        fill: #1f2937 !important;
                        font-size: 14px !important;
                        font-weight: 600 !important;
                        font-family: system-ui, -apple-system, sans-serif !important;
                        pointer-events: none !important;
                      }
                      
                      /* Ensure all text elements are visible - override any hidden styles */
                      .react-odontogram svg text[style*="display: none"],
                      .react-odontogram svg text[style*="visibility: hidden"],
                      .react-odontogram svg text[style*="opacity: 0"],
                      .react-odontogram svg tspan[style*="display: none"],
                      .react-odontogram svg tspan[style*="visibility: hidden"],
                      .react-odontogram svg tspan[style*="opacity: 0"] {
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                      }
                      
                      /* Show any hidden text elements */
                      .react-odontogram svg * {
                        visibility: visible !important;
                      }
                      
                      /* Custom colors for each tooth based on status */
                      ${toothColorStyles}
                      
                      /* Style for selected/hovered teeth */
                      .react-odontogram svg path[fill*="#3b82f6"]:not([data-tooth-status]) {
                        fill: #3b82f6 !important;
                        stroke: #2563eb !important;
                      }
                    `}</style>
                    {/* Simple read-only Odontogram for overview */}
                    <Odontogram
                      onChange={() => {}}
                      initialSelected={initialSelected}
                      theme="light"
                      colors={{
                        selected: '#3b82f6',
                        hover: '#60a5fa',
                      }}
                      notation="FDI"
                      showTooltip={true}
                      className="w-full react-odontogram"
                      key={JSON.stringify(initialSelected)} // Force re-render when selection changes
                    />
                  </div>
                </div>
                {/* Legend - giống OdontogramView */}
                <div className="pt-4 border-t border-gray-200 mt-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Chú thích:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {TOOTH_STATUSES.map((status) => (
                      <div key={status.value} className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border-2"
                          style={{
                            backgroundColor: status.color,
                            borderColor: status.borderColor,
                          }}
                        />
                        <span className="text-gray-700">{status.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Teeth Info - giống OdontogramView */}
                {!loadingTeeth && Object.keys(toothStatusMap).length > 0 && (
                  <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <p className="text-sm font-semibold text-blue-900 mb-2">
                      Răng đã được đánh dấu: {Object.keys(toothStatusMap).length} răng
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(toothStatusMap).map(([toothNumber, toothData]) => {
                        const statusConfig = TOOTH_STATUSES.find((s) => s.value === toothData.status);
                        return (
                          <span
                            key={toothNumber}
                            className="text-xs px-2 py-1 rounded bg-white border text-gray-700"
                            style={{
                              borderColor: statusConfig?.borderColor || '#d1d5db',
                              backgroundColor: statusConfig?.color || '#ffffff',
                            }}
                          >
                            Răng {toothNumber} - {statusConfig?.label || toothData.status}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Loading indicator */}
                {loadingTeeth && (
                  <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200 text-center">
                    <p className="text-sm text-gray-600">Đang tải dữ liệu răng...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Treatment History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Lịch sử điều trị gần đây</CardTitle>
                <CardDescription>3 điều trị gần nhất</CardDescription>
              </div>
              {onCreateExamination && (
                <Button size="sm" onClick={onCreateExamination} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Tạo phiếu khám
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {treatments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 text-xs font-semibold text-gray-600 uppercase">Ngày</th>
                        <th className="pb-2 text-xs font-semibold text-gray-600 uppercase">Răng</th>
                        <th className="pb-2 text-xs font-semibold text-gray-600 uppercase">Thủ thuật</th>
                        <th className="pb-2 text-xs font-semibold text-gray-600 uppercase">Bác sĩ</th>
                        <th className="pb-2 text-xs font-semibold text-gray-600 uppercase">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {treatments.slice(0, 3).map((treatment: any, idx: number) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="py-3 text-sm">
                            {treatment.date ? formatDate(treatment.date) : '-'}
                          </td>
                          <td className="py-3 text-sm">
                            {treatment.toothNumber ? `R${treatment.toothNumber}` : 'Toàn hàm'}
                          </td>
                          <td className="py-3 text-sm font-medium">
                            {treatment.name || treatment.procedure || 'Không xác định'}
                          </td>
                          <td className="py-3 text-sm">
                            {treatment.doctorName || treatment.doctor || 'Chưa xác định'}
                          </td>
                          <td className="py-3">
                            <Badge
                              className={
                                treatment.status === 'completed' || treatment.status === 'done'
                                  ? 'bg-green-100 text-green-800 border-green-300'
                                  : treatment.status === 'in-progress'
                                  ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                  : 'bg-gray-100 text-gray-800 border-gray-300'
                              }
                            >
                              {treatment.status === 'completed' || treatment.status === 'done'
                                ? 'Hoàn thành'
                                : treatment.status === 'in-progress'
                                ? 'Đang thực hiện'
                                : 'Đã lên kế hoạch'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">Chưa có lịch sử điều trị</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;
