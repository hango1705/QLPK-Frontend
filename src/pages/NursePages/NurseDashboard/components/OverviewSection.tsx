import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from '@/components/ui';
import { ClipboardList, CalendarClock, Stethoscope, Users } from 'lucide-react';
import type { OverviewSectionProps } from '../types';
import { STATUS_BADGE } from '../constants';
import { formatCurrency, formatDate } from '../utils';
import { nurseAPI } from '@/services';
import { usePermission } from '@/hooks';
import { queryKeys } from '@/services/queryClient';

const OverviewSection: React.FC<OverviewSectionProps> = ({
  treatmentPlans,
  appointments,
  doctors,
}) => {
  const { hasPermission } = usePermission();
  const canPickNurse = hasPermission('PICK_NURSE');
  
  // Get all nurses for pick (to show in overview) - only if user has PICK_NURSE permission
  const { data: nurses = [] } = useQuery({
    queryKey: queryKeys.nurse.nursesForPick,
    queryFn: nurseAPI.getAllNursesForPick,
    enabled: canPickNurse, // Only fetch if user has permission
    retry: false, // Don't retry on 401
  });

  const activePlans = treatmentPlans.filter((plan) => plan.status?.toLowerCase() === 'inprogress');
  const scheduledAppointments = appointments.filter(
    (app) => app.status?.toLowerCase() === 'scheduled',
  );

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Phác đồ đang điều trị"
          value={activePlans.length.toString()}
          description="Cần theo dõi sát sao"
          icon={<ClipboardList className="h-5 w-5" />}
          color="bg-blue-500/10 text-blue-600"
        />
        <StatCard
          title="Lịch hẹn đã lên lịch"
          value={scheduledAppointments.length.toString()}
          description="Lịch hẹn của bác sĩ"
          icon={<CalendarClock className="h-5 w-5" />}
          color="bg-green-500/10 text-green-600"
        />
        <StatCard
          title="Tổng phác đồ"
          value={treatmentPlans.length.toString()}
          description="Tất cả phác đồ được giao"
          icon={<ClipboardList className="h-5 w-5" />}
          color="bg-purple-500/10 text-purple-600"
        />
        <StatCard
          title="Bác sĩ"
          value={doctors.length.toString()}
          description="Tổng số bác sĩ"
          icon={<Stethoscope className="h-5 w-5" />}
          color="bg-amber-500/10 text-amber-600"
        />
        <StatCard
          title="Y tá"
          value={nurses.length.toString()}
          description="Tổng số y tá"
          icon={<Users className="h-5 w-5" />}
          color="bg-indigo-500/10 text-indigo-600"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-none bg-white/80 shadow-medium">
          <CardHeader>
            <CardTitle className="text-base">Phác đồ điều trị đang thực hiện</CardTitle>
            <CardDescription>Danh sách phác đồ cần theo dõi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activePlans.slice(0, 5).map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-white p-3"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{plan.title}</p>
                  <p className="text-xs text-muted-foreground">{plan.doctorFullname}</p>
                  <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={STATUS_BADGE[plan.status] || STATUS_BADGE.Inprogress}>
                    {plan.status}
                  </Badge>
                  <span className="text-xs font-medium text-primary">
                    {formatCurrency(plan.totalCost)}
                  </span>
                </div>
              </div>
            ))}
            {activePlans.length === 0 && (
              <p className="text-sm text-muted-foreground">Không có phác đồ nào đang điều trị.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-none bg-white/80 shadow-medium">
          <CardHeader>
            <CardTitle className="text-base">Lịch hẹn sắp tới</CardTitle>
            <CardDescription>Lịch hẹn của các bác sĩ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {scheduledAppointments.slice(0, 5).map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-white p-3"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{appointment.type}</p>
                  <p className="text-xs text-muted-foreground">{appointment.doctorFullName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(appointment.dateTime)}
                  </p>
                </div>
                <Badge className={STATUS_BADGE[appointment.status] || STATUS_BADGE.Scheduled}>
                  {appointment.status}
                </Badge>
              </div>
            ))}
            {scheduledAppointments.length === 0 && (
              <p className="text-sm text-muted-foreground">Không có lịch hẹn nào sắp tới.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, color }) => (
  <Card className="border-none bg-white/80 shadow-medium">
    <CardContent className="flex items-center gap-4 p-6">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </CardContent>
  </Card>
);

export default OverviewSection;

