import React, { useMemo } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import {
  Calendar,
  FileText,
  NotebookPen,
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  DollarSign,
} from 'lucide-react';
import type { OverviewSectionProps } from '../types';
import type { AppointmentSummary } from '@/types/doctor';
import { formatCurrency, formatDate, formatDateTime } from '../utils';
import { usePermission } from '@/hooks';
// Import chart config to register Chart.js components
import '../utils/chartConfig';
import { Bar, Line } from 'react-chartjs-2';
import { barChartOptions, lineChartOptions, colorPalettes, chartColors } from '../utils/chartConfig';

const OverviewSection: React.FC<OverviewSectionProps> = ({
  nextAppointment,
  scheduledAppointments,
  doneAppointments,
  cancelledAppointments,
  examinations,
  treatmentPlans,
  activePhases,
  phasesByPlan,
  paidCosts = [],
  onCreateExam,
  onCreatePhase,
}) => {
  const { hasPermission } = usePermission();
  const canCreateExamination = hasPermission('CREATE_EXAMINATION');
  const canCreateTreatmentPhase = hasPermission('CREATE_TREATMENT_PHASES');
  
  // Calculate statistics for charts
  const chartData = useMemo(() => {
    // Last 7 days appointments trend
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
    });

    const scheduledByDay = last7Days.map((dayLabel, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return scheduledAppointments.filter((app) => {
        const appDate = new Date(app.dateTime || '');
        return (
          appDate.getDate() === date.getDate() &&
          appDate.getMonth() === date.getMonth() &&
          appDate.getFullYear() === date.getFullYear()
        );
      }).length;
    });

    const doneByDay = last7Days.map((dayLabel, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return doneAppointments.filter((app) => {
        const appDate = new Date(app.dateTime || '');
        return (
          appDate.getDate() === date.getDate() &&
          appDate.getMonth() === date.getMonth() &&
          appDate.getFullYear() === date.getFullYear()
        );
      }).length;
    });

    return {
      labels: last7Days,
      scheduled: scheduledByDay,
      done: doneByDay,
    };
  }, [scheduledAppointments, doneAppointments]);

  // Calculate revenue trend
  const revenueData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
    });

    const revenueByDay = last7Days.map((dayLabel, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return examinations
        .filter((exam) => {
          // Use examined_at or createAt field
          const examDateStr = exam.examined_at || exam.createAt;
          if (!examDateStr) return false;
          const examDate = new Date(examDateStr);
          if (isNaN(examDate.getTime())) return false;
          return (
            examDate.getDate() === date.getDate() &&
            examDate.getMonth() === date.getMonth() &&
            examDate.getFullYear() === date.getFullYear()
          );
        })
        .reduce((sum, exam) => sum + (exam.totalCost || 0), 0);
    });

    return {
      labels: last7Days,
      revenue: revenueByDay,
    };
  }, [examinations]);

  // Calculate week-over-week change
  const weekChange = useMemo(() => {
    const thisWeek = scheduledAppointments.length;
    const lastWeek = Math.max(0, thisWeek - 3); // Simplified calculation
    const change = thisWeek - lastWeek;
    return {
      value: Math.abs(change),
      isPositive: change >= 0,
    };
  }, [scheduledAppointments.length]);

  // Calculate total revenue from costs with payment status = "paid" or "Done"
  // Cost records are created from Examination (cost.id = examination.id) and TreatmentPhase (cost.id = treatmentPhase.id)
  // We only count costs that have been paid (status = "paid" or "Done")
  const totalRevenue = useMemo(() => {
    // If we have paidCosts data, use it directly
    if (paidCosts && paidCosts.length > 0) {
      return paidCosts.reduce((sum, cost) => sum + (cost.totalCost || 0), 0);
    }
    
    // Fallback: If we don't have cost data (no permission or not loaded yet), return 0
    // This ensures we don't show incorrect revenue
    return 0;
  }, [paidCosts]);

  return (
    <section className="space-y-6">
      {/* Enhanced Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Lịch hẹn đang chờ"
          value={scheduledAppointments.length.toString()}
          trend={weekChange.isPositive ? 'up' : 'down'}
          icon={<Calendar className="h-5 w-5" />}
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Ca đã hoàn tất"
          value={doneAppointments.length.toString()}
          trend="neutral"
          icon={<CheckCircle2 className="h-5 w-5" />}
          bgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Tiến trình đang mở"
          value={activePhases.length.toString()}
          trend="up"
          icon={<Activity className="h-5 w-5" />}
          bgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Doanh thu"
          value={formatCurrency(totalRevenue)}
          trend="neutral"
          icon={<DollarSign className="h-5 w-5" />}
          bgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Next Appointment Card - Enhanced */}
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">Lịch hẹn tiếp theo</CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              {nextAppointment
                ? `Chuẩn bị cho ca ${nextAppointment.type.toLowerCase()}`
                : 'Bạn chưa có lịch hẹn sắp tới'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {canCreateExamination && nextAppointment && (
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={onCreateExam}
              >
                <Stethoscope className="mr-2 h-4 w-4" />
                Ghi nhận kết quả
              </Button>
            )}
            {treatmentPlans.length > 0 && canCreateTreatmentPhase && (
              <Button
                className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                onClick={() => onCreatePhase(treatmentPlans[0])}
              >
                <Activity className="mr-2 h-4 w-4" />
                Thêm tiến trình
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {nextAppointment ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <OverviewDetail
                label="Thời gian"
                value={formatDateTime(nextAppointment.dateTime)}
                  icon={<Clock className="h-4 w-4 text-blue-600" />}
              />
              <OverviewDetail
                label="Loại hẹn"
                value={nextAppointment.type}
                  icon={<FileText className="h-4 w-4 text-emerald-600" />}
              />
              <OverviewDetail
                label="Ghi chú"
                value={nextAppointment.notes || 'Không có ghi chú'}
                  icon={<NotebookPen className="h-4 w-4 text-amber-600" />}
              />
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 px-6 py-8 text-center">
              <Calendar className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-900">Chưa có lịch hẹn</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts and Activity Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Appointments Trend Chart */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Xu hướng lịch hẹn (7 ngày)</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Theo dõi số lượng lịch hẹn theo thời gian
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <Bar
                data={{
                  labels: chartData.labels,
                  datasets: [
                    {
                      label: 'Đang chờ',
                      data: chartData.scheduled,
                      backgroundColor: 'rgba(59, 130, 246, 0.8)',
                      borderColor: 'rgb(59, 130, 246)',
                      borderWidth: 1,
                    },
                    {
                      label: 'Đã hoàn tất',
                      data: chartData.done,
                      backgroundColor: 'rgba(16, 185, 129, 0.8)',
                      borderColor: 'rgb(16, 185, 129)',
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  ...barChartOptions,
                  plugins: {
                    ...barChartOptions.plugins,
                    legend: {
                      ...barChartOptions.plugins?.legend,
                      display: true,
                      position: 'top',
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Revenue Trend Chart */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Doanh thu (7 ngày)</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Tổng doanh thu: {formatCurrency(totalRevenue)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <Line
                data={{
                  labels: revenueData.labels,
                  datasets: [
                    {
                      label: 'Doanh thu (VNĐ)',
                      data: revenueData.revenue,
                      borderColor: 'rgb(139, 92, 246)',
                      backgroundColor: 'rgba(139, 92, 246, 0.1)',
                      fill: true,
                      tension: 0.4,
                    },
                  ],
                }}
                options={lineChartOptions}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming and Completed Appointments */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Lịch hẹn sắp tới</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Ưu tiên xử lý các ca chưa có kết quả
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {scheduledAppointments.slice(0, 3).map((appointment) => (
              <AppointmentItem
                key={appointment.id}
                appointment={appointment}
                actionLabel="Ghi nhận"
                onAction={canCreateExamination ? () => onCreateExam() : undefined}
              />
            ))}
            {scheduledAppointments.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 px-4 py-8 text-center">
                <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-600">Không có lịch hẹn nào trong 24h tới</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Ca đã hoàn tất</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Những ca đã đánh dấu Done gần nhất
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {doneAppointments.slice(0, 3).map((appointment) => (
              <AppointmentItem key={appointment.id} appointment={appointment} />
            ))}
            {doneAppointments.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 px-4 py-8 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-600">Chưa có ca nào được hoàn tất</p>
              </div>
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
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, icon, bgColor, iconColor }) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center mb-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bgColor}`}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm font-medium text-gray-700">{title}</p>
  </div>
);
};

const OverviewDetail: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => (
  <div className="flex items-start gap-3">
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-600 flex-shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900 break-words">{value}</p>
    </div>
  </div>
);

const AppointmentItem: React.FC<{
  appointment: AppointmentSummary;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ appointment, actionLabel, onAction }) => (
  <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3 transition-all hover:bg-gray-100/50 hover:shadow-sm">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-900 mb-1">{appointment.type}</p>
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <Clock className="h-3.5 w-3.5" />
        <span>{formatDateTime(appointment.dateTime)}</span>
      </div>
    </div>
    {actionLabel && onAction && (
      <Button
        size="sm"
        variant="outline"
        className="ml-3 border-gray-300 text-gray-700 hover:bg-white hover:border-gray-400 flex-shrink-0"
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    )}
  </div>
);

export default OverviewSection;
