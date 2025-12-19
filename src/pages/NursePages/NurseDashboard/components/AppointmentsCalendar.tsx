import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput } from '@fullcalendar/core';
import type { AppointmentSummary } from '@/types/doctor';
import { Badge } from '@/components/ui';

interface AppointmentsCalendarProps {
  appointments: AppointmentSummary[];
  doctors?: Array<{ id: string; fullName: string }>;
  selectedDoctorId?: string;
  onDoctorSelect?: (doctorId: string) => void;
  onViewDetail?: (appointment: AppointmentSummary) => void;
}

// Chuyển đổi AppointmentSummary sang FullCalendar Event format
const convertAppointmentsToEvents = (
  appointments: AppointmentSummary[],
): EventInput[] => {
  return appointments.map((appointment) => {
    // Xác định màu sắc dựa trên status
    let backgroundColor = '#3b82f6'; // blue (default - scheduled)
    let borderColor = '#2563eb';
    let textColor = '#ffffff';

    switch (appointment.status?.toLowerCase()) {
      case 'done':
        backgroundColor = '#10b981'; // green
        borderColor = '#059669';
        break;
      case 'cancel':
      case 'cancelled':
        backgroundColor = '#ef4444'; // red
        borderColor = '#dc2626';
        break;
      case 'scheduled':
      default:
        backgroundColor = '#3b82f6'; // blue
        borderColor = '#2563eb';
        break;
    }

    return {
      id: appointment.id,
      title: `${appointment.type || 'Lịch hẹn'} - ${appointment.doctorFullName || ''}`,
      start: appointment.dateTime,
      backgroundColor,
      borderColor,
      textColor,
      extendedProps: {
        appointment,
        notes: appointment.notes,
        status: appointment.status,
        doctorFullName: appointment.doctorFullName,
      },
    };
  });
};

const AppointmentsCalendar: React.FC<AppointmentsCalendarProps> = ({
  appointments,
  doctors,
  selectedDoctorId,
  onDoctorSelect,
  onViewDetail,
}) => {
  // Filter appointments within last 30 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const appointmentsInLast30Days = appointments.filter((app) => {
    if (!app.dateTime) return false;
    const appointmentDate = new Date(app.dateTime);
    appointmentDate.setHours(0, 0, 0, 0);
    return appointmentDate >= thirtyDaysAgo && appointmentDate <= today;
  });

  // Appointments are already filtered in NurseDashboard, so we use them directly
  const events = convertAppointmentsToEvents(appointments);
  const scheduledAppointments = appointmentsInLast30Days.filter(
    (app) => app.status?.toLowerCase() === 'scheduled'
  );

  const handleDateClick = (dateClickInfo: any) => {
    // Có thể mở dialog tạo appointment mới ở đây nếu cần
    // Date clicked: dateClickInfo.dateStr
  };

  const handleEventClick = (clickInfo: any) => {
    const appointment = clickInfo.event.extendedProps.appointment as AppointmentSummary;
    if (onViewDetail && appointment) {
      onViewDetail(appointment);
    }
  };

  // Custom event content để hiển thị thông tin chi tiết hơn
  const renderEventContent = (eventInfo: any) => {
    const appointment = eventInfo.event.extendedProps.appointment as AppointmentSummary;

    return (
      <div className="fc-event-main-frame">
        <div className="fc-event-time-container">
          <span className="fc-event-time">{eventInfo.timeText}</span>
        </div>
        <div className="fc-event-title-container">
          <div className="fc-event-title fc-sticky">
            {appointment?.type || 'Lịch hẹn'}
          </div>
          {appointment?.doctorFullName && (
            <div className="fc-event-title fc-sticky text-xs opacity-90 mt-0.5">
              {appointment.doctorFullName}
            </div>
          )}
          {appointment?.notes && (
            <div className="fc-event-title fc-sticky text-xs opacity-90 mt-0.5">
              {appointment.notes.length > 30
                ? `${appointment.notes.substring(0, 30)}...`
                : appointment.notes}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header với thống kê và filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/70 bg-white/60 px-4 py-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Lịch hẹn của bác sĩ</h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {doctors && doctors.length > 0 && (
            <select
              value={selectedDoctorId || ''}
              onChange={(e) => onDoctorSelect?.(e.target.value)}
              className="rounded-lg border border-border/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Tất cả bác sĩ</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.fullName}
                </option>
              ))}
            </select>
          )}
          <Badge className="bg-primary/10 text-primary">
            {scheduledAppointments.length} lịch chờ
          </Badge>
          <Badge variant="outline">Tổng {appointmentsInLast30Days.length} lịch</Badge>
        </div>
      </div>

      {/* FullCalendar */}
      <div className="rounded-2xl border border-border/70 bg-white/90 p-4 shadow-sm">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          buttonText={{
            today: 'Hôm nay',
            month: 'Tháng',
            week: 'Tuần',
            day: 'Ngày',
          }}
          events={events}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          eventContent={renderEventContent}
          height="auto"
          locale="vi"
          firstDay={1} // Bắt đầu từ thứ 2
          slotMinTime="07:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          weekends={true}
          editable={false}
          selectable={false}
          dayMaxEvents={3}
          eventDisplay="block"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          // Custom styling
          eventClassNames="cursor-pointer hover:opacity-90 transition-opacity"
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/70 bg-white/60 px-4 py-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-blue-500"></div>
          <span className="text-muted-foreground">Đã lên lịch</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-green-500"></div>
          <span className="text-muted-foreground">Hoàn thành</span>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsCalendar;

