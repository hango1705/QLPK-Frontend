import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from '@/components/ui';
import {
  Users,
  UserCheck,
  UserX,
  Activity,
  Package,
  Pill,
  FolderTree,
  TrendingUp,
  Calendar,
  Loader2,
} from 'lucide-react';
import type { OverviewSectionProps } from '../types';
import type { CategoryDentalService, DentalService, Prescription, User } from '@/types/admin';
import { cn } from '@/utils/cn';
// Import chart config to register Chart.js components
import '../utils/chartConfig';
import { Bar, Doughnut } from 'react-chartjs-2';
import { barChartOptions, doughnutChartOptions, colorPalettes } from '../utils/chartConfig';

interface ExtendedOverviewSectionProps extends OverviewSectionProps {
  categories?: CategoryDentalService[];
  services?: DentalService[];
  prescriptions?: Prescription[];
  users?: User[];
}

const OverviewSection: React.FC<ExtendedOverviewSectionProps> = ({
  totalUsers,
  totalDoctors,
  totalPatients,
  totalAppointments,
  recentAuditLogs = [],
  categories = [],
  services = [],
  prescriptions = [],
  users = [],
}) => {
  // Tính toán statistics từ dữ liệu thực tế
  const stats = useMemo(() => {
    // Tính totalDoctors từ users array (bao gồm DOCTOR và DOCTORLV2)
    const actualDoctors = users.filter((u) => {
      const role = u.role?.toLowerCase();
      return role === 'doctor' || role === 'doctorlv2';
    }).length;

    // Tính totalPatients từ users array
    const actualPatients = users.filter((u) => {
      const role = u.role?.toLowerCase();
      return role === 'patient';
    }).length;

    // Tính totalUsers từ users array
    const actualUsers = users.length;

    // Tính user distribution theo role (hỗ trợ cả lowercase và uppercase)
    const roleDistribution = {
      admin: users.filter((u) => {
        const role = u.role?.toLowerCase();
        return role === 'admin';
      }).length,
      doctor: users.filter((u) => {
        const role = u.role?.toLowerCase();
        return role === 'doctor' || role === 'doctorlv2';
      }).length,
      nurse: users.filter((u) => {
        const role = u.role?.toLowerCase();
        return role === 'nurse';
      }).length,
      patient: users.filter((u) => {
        const role = u.role?.toLowerCase();
        return role === 'patient';
      }).length,
    };

    return {
      totalUsers: actualUsers || totalUsers,
      totalDoctors: actualDoctors || totalDoctors,
      totalPatients: actualPatients || totalPatients,
      totalAppointments: totalAppointments || 0,
      roleDistribution,
    };
  }, [users, totalUsers, totalDoctors, totalPatients, totalAppointments]);

  return (
    <section className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tổng người dùng"
          value={stats.totalUsers.toString()}
          description="Tổng số người dùng trong hệ thống"
          icon={<Users className="h-5 w-5" />}
          color="bg-blue-500/10 text-blue-600"
          trend="neutral"
        />
        <StatCard
          title="Bác sĩ"
          value={stats.totalDoctors.toString()}
          description="Tổng số bác sĩ (bao gồm DOCTOR và DOCTORLV2)"
          icon={<UserCheck className="h-5 w-5" />}
          color="bg-green-500/10 text-green-600"
          trend="neutral"
        />
        <StatCard
          title="Bệnh nhân"
          value={stats.totalPatients.toString()}
          description="Tổng số bệnh nhân đã đăng ký"
          icon={<UserX className="h-5 w-5" />}
          color="bg-purple-500/10 text-purple-600"
          trend="neutral"
        />
        <StatCard
          title="Lịch hẹn"
          value={stats.totalAppointments.toString()}
          description="Tổng số lịch hẹn trong hệ thống"
          icon={<Calendar className="h-5 w-5" />}
          color="bg-orange-500/10 text-orange-600"
          trend="neutral"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none bg-white/90 shadow-medium">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Danh mục</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
                <FolderTree className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{categories.length}</p>
                <p className="text-xs text-muted-foreground">Danh mục dịch vụ</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-white/90 shadow-medium">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dịch vụ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{services.length}</p>
                <p className="text-xs text-muted-foreground">Dịch vụ nha khoa</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-white/90 shadow-medium">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đơn thuốc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                <Pill className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{prescriptions.length}</p>
                <p className="text-xs text-muted-foreground">Đơn thuốc trong hệ thống</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-none bg-white/90 shadow-medium">
          <CardHeader>
            <CardTitle className="text-lg">Phân bố người dùng</CardTitle>
            <CardDescription>Theo vai trò trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <UserDistributionChart users={users} roleDistribution={stats.roleDistribution} />
          </CardContent>
        </Card>

        <Card className="border-none bg-white/90 shadow-medium">
          <CardHeader>
            <CardTitle className="text-lg">Tổng quan hệ thống</CardTitle>
            <CardDescription>Thống kê các thành phần chính</CardDescription>
          </CardHeader>
          <CardContent>
            <SystemOverviewChart
              categories={categories.length}
              services={services.length}
              prescriptions={prescriptions.length}
              appointments={stats.totalAppointments}
            />
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
  trend: 'up' | 'down' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, color, trend }) => (
  <div className="rounded-3xl border border-transparent bg-white/80 p-5 shadow-lg shadow-neutral-100 transition hover:-translate-y-1 hover:border-primary/30">
    <div className="flex items-center justify-between">
      <div className={cn('rounded-2xl p-2.5', color)}>{icon}</div>
      {trend === 'up' && (
        <Badge className="bg-green-50 text-green-600 border-green-100 text-xs">
          <TrendingUp className="mr-1 h-3 w-3" />
          Tăng
        </Badge>
      )}
    </div>
    <p className="mt-4 text-3xl font-semibold text-foreground">{value}</p>
    <p className="mt-1 text-sm font-medium text-foreground">{title}</p>
    <p className="mt-1 text-xs text-muted-foreground">{description}</p>
  </div>
);

const UserDistributionChart: React.FC<{ users: User[]; roleDistribution: Record<string, number> }> = ({
  users,
  roleDistribution,
}) => {
  const chartData = useMemo(() => {
    const labels = ['Admin', 'Bác sĩ', 'Y tá', 'Bệnh nhân'];
    const data = [
      roleDistribution.admin,
      roleDistribution.doctor,
      roleDistribution.nurse,
      roleDistribution.patient,
    ];

    return {
      labels,
      datasets: [
        {
          label: 'Số lượng',
          data,
          backgroundColor: [
            colorPalettes.gradient[0], // admin - blue
            colorPalettes.gradient[1], // doctor - green
            colorPalettes.gradient[2], // nurse - purple
            colorPalettes.gradient[3], // patient - amber
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(245, 158, 11, 1)',
          ],
          borderWidth: 2,
        },
      ],
    };
  }, [roleDistribution]);

  if (users.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <Doughnut data={chartData} options={doughnutChartOptions as any} />
    </div>
  );
};

const SystemOverviewChart: React.FC<{
  categories: number;
  services: number;
  prescriptions: number;
  appointments: number;
}> = ({ categories, services, prescriptions, appointments }) => {
  const chartData = useMemo(() => {
    return {
      labels: ['Danh mục', 'Dịch vụ', 'Đơn thuốc', 'Lịch hẹn'],
      datasets: [
        {
          label: 'Số lượng',
          data: [categories, services, prescriptions, appointments],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)', // green - categories
            'rgba(59, 130, 246, 0.8)', // blue - services
            'rgba(139, 92, 246, 0.8)', // purple - prescriptions
            'rgba(245, 158, 11, 0.8)', // amber - appointments
          ],
          borderColor: [
            'rgba(16, 185, 129, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(245, 158, 11, 1)',
          ],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  }, [categories, services, prescriptions, appointments]);

  return (
    <div className="h-64 w-full">
      <Bar
        data={chartData}
        options={{
          ...barChartOptions,
          plugins: {
            ...barChartOptions.plugins,
            tooltip: {
              ...barChartOptions.plugins.tooltip,
              callbacks: {
                title: function (context: any) {
                  return context[0].label;
                },
                label: function (context: any) {
                  return `Số lượng: ${context.parsed.y}`;
                },
              },
            },
          },
        } as any}
      />
    </div>
  );
};

export default OverviewSection;
