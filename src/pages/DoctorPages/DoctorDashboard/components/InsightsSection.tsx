import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import {
  Calendar,
  Stethoscope,
  ClipboardList,
  DollarSign,
  Users,
  Activity,
  Clock,
} from 'lucide-react';
import type {
  AppointmentSummary,
  ExaminationSummary,
  TreatmentPlan,
  TreatmentPhase,
  DentalService,
} from '@/types/doctor';
// Import chart config to register Chart.js components
import '../utils/chartConfig';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { barChartOptions, doughnutChartOptions, lineChartOptions, colorPalettes, chartColors } from '../utils/chartConfig';
import { formatCurrency, formatDate } from '../utils';

interface InsightsSectionProps {
  appointments: AppointmentSummary[];
  scheduledAppointments: AppointmentSummary[];
  examinations: ExaminationSummary[];
  treatmentPlans: TreatmentPlan[];
  phasesByPlan: Record<string, TreatmentPhase[]>;
  services?: DentalService[];
}

const InsightsSection: React.FC<InsightsSectionProps> = ({
  appointments,
  scheduledAppointments,
  examinations,
  treatmentPlans,
  phasesByPlan,
  services = [],
}) => {
  // Calculate statistics
  const stats = useMemo(() => {
    const doneAppointments = appointments.filter((a) => a.status?.toLowerCase() === 'done');
    const cancelledAppointments = appointments.filter((a) => a.status?.toLowerCase() === 'cancel');
    
    // Calculate revenue from examinations
    const totalRevenue = examinations.reduce((sum, exam) => sum + (exam.totalCost || 0), 0);
    
    // Count active phases
    const allPhases = Object.values(phasesByPlan).flat();
    const activePhases = allPhases.filter((p) => p.status?.toLowerCase() === 'inprogress');
    
    // Count unique patients
    const uniquePatients = new Set(examinations.map((e) => e.patientId).filter(Boolean));
    
    return {
      totalAppointments: appointments.length,
      doneAppointments: doneAppointments.length,
      cancelledAppointments: cancelledAppointments.length,
      totalExaminations: examinations.length,
      totalPlans: treatmentPlans.length,
      activePhases: activePhases.length,
      totalRevenue,
      uniquePatients: uniquePatients.size,
    };
  }, [appointments, examinations, treatmentPlans, phasesByPlan]);

  // Prepare data for charts
  const appointmentTrendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    });

    const appointmentsByDay = last7Days.map((day) => {
      const [dayNum, month] = day.split('/');
      const date = new Date();
      date.setDate(parseInt(dayNum));
      date.setMonth(parseInt(month) - 1);
      
      return appointments.filter((a) => {
        const appDate = new Date(a.dateTime || '');
        return (
          appDate.getDate() === date.getDate() &&
          appDate.getMonth() === date.getMonth() &&
          appDate.getFullYear() === date.getFullYear()
        );
      }).length;
    });

    return {
      labels: last7Days,
      datasets: [
        {
          label: 'Số lịch hẹn',
          data: appointmentsByDay,
          backgroundColor: colorPalettes.primary[0],
          borderColor: chartColors.primary,
          borderWidth: 2,
        },
      ],
    };
  }, [appointments]);

  const examinationTrendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    });

    const examinationsByDay = last7Days.map((day) => {
      const [dayNum, month] = day.split('/');
      const date = new Date();
      date.setDate(parseInt(dayNum));
      date.setMonth(parseInt(month) - 1);
      
      return examinations.filter((e) => {
        const examDate = new Date(e.createAt || '');
        return (
          examDate.getDate() === date.getDate() &&
          examDate.getMonth() === date.getMonth() &&
          examDate.getFullYear() === date.getFullYear()
        );
      }).length;
    });

    return {
      labels: last7Days,
      datasets: [
        {
          label: 'Số lần khám',
          data: examinationsByDay,
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: chartColors.secondary,
          borderWidth: 2,
          fill: true,
        },
      ],
    };
  }, [examinations]);

  const appointmentStatusData = useMemo(() => {
    const scheduled = scheduledAppointments.length;
    const done = appointments.filter((a) => a.status?.toLowerCase() === 'done').length;
    const cancelled = appointments.filter((a) => a.status?.toLowerCase() === 'cancel').length;

    return {
      labels: ['Đã hoàn thành', 'Đã đặt', 'Đã hủy'],
      datasets: [
        {
          data: [done, scheduled, cancelled],
          backgroundColor: [
            colorPalettes.gradient[1], // green
            colorPalettes.gradient[0], // blue
            colorPalettes.gradient[3], // amber
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [appointments, scheduledAppointments]);

  const serviceUsageData = useMemo(() => {
    // Count service usage from examinations
    const serviceCounts: Record<string, number> = {};
    
    examinations.forEach((exam) => {
      exam.listDentalServicesEntityOrder?.forEach((service) => {
        const serviceName = service.name || 'Khác';
        serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + (service.quantity || 1);
      });
    });

    const sortedServices = Object.entries(serviceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      labels: sortedServices.map(([name]) => name),
      datasets: [
        {
          label: 'Số lần sử dụng',
          data: sortedServices.map(([, count]) => count),
          backgroundColor: colorPalettes.primary,
          borderColor: chartColors.primary,
          borderWidth: 2,
        },
      ],
    };
  }, [examinations]);

  const revenueData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
    });

    const revenueByMonth = last6Months.map((monthLabel) => {
      const [month, year] = monthLabel.split(' ');
      const monthIndex = ['Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6', 'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'].indexOf(month);
      const yearNum = parseInt(year || new Date().getFullYear().toString());
      
      return examinations
        .filter((e) => {
          const examDate = new Date(e.createAt || '');
          return examDate.getMonth() === monthIndex && examDate.getFullYear() === yearNum;
        })
        .reduce((sum, e) => sum + (e.totalCost || 0), 0);
    });

    return {
      labels: last6Months,
      datasets: [
        {
          label: 'Doanh thu (VND)',
          data: revenueByMonth,
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
          borderColor: chartColors.accent,
          borderWidth: 2,
          fill: true,
        },
      ],
    };
  }, [examinations]);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng lịch hẹn</p>
                <p className="text-2xl font-bold">{stats.totalAppointments}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng khám bệnh</p>
                <p className="text-2xl font-bold">{stats.totalExaminations}</p>
              </div>
              <Stethoscope className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bệnh nhân</p>
                <p className="text-2xl font-bold">{stats.uniquePatients}</p>
              </div>
              <Users className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-none bg-white/90 shadow-medium">
          <CardHeader>
            <CardTitle className="text-lg">Xu hướng lịch hẹn (7 ngày qua)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Bar data={appointmentTrendData} options={barChartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-white/90 shadow-medium">
          <CardHeader>
            <CardTitle className="text-lg">Xu hướng khám bệnh (7 ngày qua)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Line data={examinationTrendData} options={lineChartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-none bg-white/90 shadow-medium">
          <CardHeader>
            <CardTitle className="text-lg">Trạng thái lịch hẹn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Doughnut data={appointmentStatusData} options={doughnutChartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-white/90 shadow-medium">
          <CardHeader>
            <CardTitle className="text-lg">Dịch vụ sử dụng nhiều nhất</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Bar data={serviceUsageData} options={barChartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="border-none bg-white/90 shadow-medium">
        <CardHeader>
          <CardTitle className="text-lg">Doanh thu theo tháng (6 tháng qua)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <Line data={revenueData} options={lineChartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InsightsSection;

