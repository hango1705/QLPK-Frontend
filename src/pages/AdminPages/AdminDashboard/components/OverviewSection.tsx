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
  Shield,
} from 'lucide-react';
import type { OverviewSectionProps } from '../types';
import type { CategoryDentalService, DentalService, Prescription } from '@/types/admin';
import { ROLE_BADGE } from '../constants';
import { cn } from '@/utils/cn';
// Import chart config to register Chart.js components
import '../utils/chartConfig';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { barChartOptions, doughnutChartOptions, lineChartOptions, colorPalettes } from '../utils/chartConfig';

interface ExtendedOverviewSectionProps extends OverviewSectionProps {
  categories?: CategoryDentalService[];
  services?: DentalService[];
  prescriptions?: Prescription[];
  users?: any[]; // User[] from types/admin
}

const OverviewSection: React.FC<ExtendedOverviewSectionProps> = ({
  totalUsers,
  totalDoctors,
  totalPatients,
  totalAppointments,
  recentAuditLogs,
  categories = [],
  services = [],
  prescriptions = [],
  users = [],
}) => {
  const todayLogs = useMemo(() => {
    const today = new Date().toDateString();
    return recentAuditLogs.filter((log) => new Date(log.timestamp).toDateString() === today);
  }, [recentAuditLogs]);

  const loginCount = useMemo(() => {
    return recentAuditLogs.filter((log) =>
      log.action?.toLowerCase().includes('đăng nhập') || log.action?.toLowerCase().includes('login'),
    ).length;
  }, [recentAuditLogs]);

  return (
    <section className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tổng người dùng"
          value={totalUsers.toString()}
          description={`${totalDoctors} bác sĩ, ${totalPatients} bệnh nhân`}
          icon={<Users className="h-5 w-5" />}
          color="bg-blue-500/10 text-blue-600"
          trend="neutral"
        />
        <StatCard
          title="Bác sĩ"
          value={totalDoctors.toString()}
          description="Đang hoạt động trong hệ thống"
          icon={<UserCheck className="h-5 w-5" />}
          color="bg-green-500/10 text-green-600"
          trend="up"
        />
        <StatCard
          title="Bệnh nhân"
          value={totalPatients.toString()}
          description="Tổng số bệnh nhân đã đăng ký"
          icon={<UserX className="h-5 w-5" />}
          color="bg-purple-500/10 text-purple-600"
          trend="neutral"
        />
        <StatCard
          title="Hoạt động hôm nay"
          value={todayLogs.length.toString()}
          description={`${loginCount} lượt đăng nhập`}
          icon={<Activity className="h-5 w-5" />}
          color="bg-amber-500/10 text-amber-600"
          trend="up"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
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
                <p className="text-2xl font-semibold text-foreground">{totalAppointments}</p>
                <p className="text-xs text-muted-foreground">Lịch hẹn tổng cộng</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-none bg-white/90 shadow-medium lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Hoạt động 7 ngày qua</CardTitle>
            <CardDescription>Thống kê hoạt động hệ thống theo ngày</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityChart logs={recentAuditLogs} />
          </CardContent>
        </Card>

        <Card className="border-none bg-white/90 shadow-medium">
          <CardHeader>
            <CardTitle className="text-lg">Phân bố người dùng</CardTitle>
            <CardDescription>Theo vai trò trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <UserDistributionChart users={users} />
          </CardContent>
        </Card>
      </div>

      {/* Activity Trends Chart */}
      <Card className="border-none bg-white/90 shadow-medium">
        <CardHeader>
          <CardTitle className="text-lg">Xu hướng hoạt động</CardTitle>
          <CardDescription>Phân tích xu hướng hoạt động theo loại hành động trong 7 ngày qua</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityTrendsChart logs={recentAuditLogs} />
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-none bg-white/90 shadow-medium">
        <CardHeader>
          <CardTitle className="text-lg">Hoạt động gần đây</CardTitle>
          <CardDescription>Nhật ký hoạt động mới nhất</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentAuditLogs.slice(0, 5).map((log, index) => (
            <ActivityItem key={log.id || `${log.username}-${log.timestamp}-${index}`} log={log} />
          ))}
          {recentAuditLogs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Chưa có hoạt động nào</p>
          )}
        </CardContent>
      </Card>
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

const ActivityChart: React.FC<{ logs: any[] }> = ({ logs }) => {
  const chartData = useMemo(() => {
    const days: Record<string, number> = {};
    const today = new Date();
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      days[dateStr] = 0;
    }

    // Count logs per day
    logs.forEach((log) => {
      const logDate = new Date(log.timestamp);
      const dateStr = logDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      if (days[dateStr] !== undefined) {
        days[dateStr]++;
      }
    });

    const labels = Object.keys(days);
    const data = Object.values(days);

    return {
      labels,
      datasets: [
        {
          label: 'Hoạt động',
          data,
          backgroundColor: colorPalettes.primary[0],
          borderColor: colorPalettes.primary[1],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  }, [logs]);

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
                  return `Ngày ${context[0].label}`;
                },
                label: function (context: any) {
                  return `${context.parsed.y} hoạt động`;
                },
              },
            },
          },
        }} 
      />
    </div>
  );
};

const UserDistributionChart: React.FC<{ users: any[] }> = ({ users }) => {
  const chartData = useMemo(() => {
    const roleCounts: Record<string, number> = {
      admin: 0,
      doctor: 0,
      nurse: 0,
      patient: 0,
    };

    users.forEach((user) => {
      const role = user.role?.toLowerCase() || 'patient';
      if (roleCounts[role] !== undefined) {
        roleCounts[role]++;
      }
    });

    const labels = ['Admin', 'Bác sĩ', 'Y tá', 'Bệnh nhân'];
    const data = [roleCounts.admin, roleCounts.doctor, roleCounts.nurse, roleCounts.patient];

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
  }, [users]);

  return (
    <div className="h-64 w-full">
      <Doughnut data={chartData} options={doughnutChartOptions} />
    </div>
  );
};

const ActivityTrendsChart: React.FC<{ logs: any[] }> = ({ logs }) => {
  const chartData = useMemo(() => {
    const days: Record<string, Record<string, number>> = {};
    const today = new Date();
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      days[dateStr] = {
        login: 0,
        create: 0,
        update: 0,
        delete: 0,
        other: 0,
      };
    }

    // Categorize logs by action type
    logs.forEach((log) => {
      const logDate = new Date(log.timestamp);
      const dateStr = logDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      if (days[dateStr]) {
        const action = log.action?.toLowerCase() || '';
        if (action.includes('đăng nhập') || action.includes('login')) {
          days[dateStr].login++;
        } else if (action.includes('tạo') || action.includes('create')) {
          days[dateStr].create++;
        } else if (action.includes('cập nhật') || action.includes('update')) {
          days[dateStr].update++;
        } else if (action.includes('xóa') || action.includes('delete') || action.includes('vô hiệu')) {
          days[dateStr].delete++;
        } else {
          days[dateStr].other++;
        }
      }
    });

    const labels = Object.keys(days);
    const loginData = labels.map((date) => days[date].login);
    const createData = labels.map((date) => days[date].create);
    const updateData = labels.map((date) => days[date].update);
    const deleteData = labels.map((date) => days[date].delete);

    return {
      labels,
      datasets: [
        {
          label: 'Đăng nhập',
          data: loginData,
          borderColor: colorPalettes.gradient[1], // green
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Tạo mới',
          data: createData,
          borderColor: colorPalettes.gradient[0], // blue
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Cập nhật',
          data: updateData,
          borderColor: colorPalettes.gradient[3], // amber
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Xóa/Vô hiệu',
          data: deleteData,
          borderColor: 'rgba(239, 68, 68, 1)', // red
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [logs]);

  return (
    <div className="h-80 w-full">
      <Line data={chartData} options={lineChartOptions} />
    </div>
  );
};

const ActivityItem: React.FC<{ log: any }> = ({ log }) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    if (action?.toLowerCase().includes('đăng nhập') || action?.toLowerCase().includes('login')) {
      return 'bg-green-50 text-green-600 border-green-100';
    }
    if (action?.toLowerCase().includes('đăng xuất') || action?.toLowerCase().includes('logout')) {
      return 'bg-gray-50 text-gray-600 border-gray-100';
    }
    if (action?.toLowerCase().includes('tạo') || action?.toLowerCase().includes('create')) {
      return 'bg-blue-50 text-blue-600 border-blue-100';
    }
    if (action?.toLowerCase().includes('cập nhật') || action?.toLowerCase().includes('update')) {
      return 'bg-amber-50 text-amber-600 border-amber-100';
    }
    return 'bg-purple-50 text-purple-600 border-purple-100';
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-white/60 px-3 py-2.5 text-sm transition hover:shadow-sm">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Activity className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn('text-xs', getActionColor(log.action))}>{log.action}</Badge>
            <span className="text-xs text-muted-foreground">@{log.username}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{formatTime(log.timestamp)}</p>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;

