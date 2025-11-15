import React from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from '@/components/ui';
import { Calendar, FileText, NotebookPen, Stethoscope } from 'lucide-react';
import type { OverviewSectionProps } from '../types';
import type { AppointmentSummary } from '@/types/doctor';
import { formatCurrency, formatDate, formatDateTime } from '../utils';

const OverviewSection: React.FC<OverviewSectionProps> = ({
  nextAppointment,
  scheduledAppointments,
  doneAppointments,
  cancelledAppointments,
  examinations,
  treatmentPlans,
  activePhases,
  onCreateExam,
  onCreatePhase,
}) => {
  const delta = scheduledAppointments.length - doneAppointments.length;

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Lịch hẹn đang chờ"
          value={scheduledAppointments.length.toString()}
          description={
            delta >= 0 ? `+${delta} so với tuần trước` : `${Math.abs(delta)} ít hơn tuần trước`
          }
          trend={delta >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Ca đã hoàn tất"
          value={doneAppointments.length.toString()}
          description="Tự động cập nhật khi lưu kết quả khám"
          trend="neutral"
        />
        <StatCard
          title="Tiến trình đang mở"
          value={activePhases.length.toString()}
          description="Theo dõi sát sao để tránh quá hạn"
          trend="up"
        />
        <StatCard
          title="Hủy/Hoãn"
          value={cancelledAppointments.length.toString()}
          description="Tự động giải phóng slot trống"
          trend="down"
        />
      </div>

      <Card className="border-none bg-white/80 shadow-medium">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Lịch hẹn tiếp theo</CardTitle>
            <CardDescription>
              {nextAppointment
                ? `Chuẩn bị cho ca ${nextAppointment.type.toLowerCase()}`
                : 'Bạn chưa có lịch hẹn sắp tới'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-border/70" onClick={onCreateExam}>
              <Stethoscope className="mr-2 h-4 w-4" />
              Ghi nhận kết quả
            </Button>
            {treatmentPlans.length > 0 && (
              <Button
                className="bg-primary text-white shadow-glow hover:bg-primary/90"
                onClick={() => onCreatePhase(treatmentPlans[0])}
              >
                Thêm tiến trình
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {nextAppointment ? (
            <div className="grid gap-4 md:grid-cols-3">
              <OverviewDetail
                label="Thời gian"
                value={formatDateTime(nextAppointment.dateTime)}
                icon={<Calendar className="h-4 w-4 text-primary" />}
              />
              <OverviewDetail
                label="Loại hẹn"
                value={nextAppointment.type}
                icon={<FileText className="h-4 w-4 text-secondary" />}
              />
              <OverviewDetail
                label="Ghi chú"
                value={nextAppointment.notes || 'Không có ghi chú'}
                icon={<NotebookPen className="h-4 w-4 text-amber-500" />}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-2xl border border-dashed border-border px-4 py-6">
              <div>
                <p className="text-sm font-semibold text-foreground">Chưa có lịch hẹn</p>
                <p className="text-sm text-muted-foreground">
                  Hãy mở lịch khám mới hoặc chờ bệnh nhân đặt lịch
                </p>
              </div>
              <Button variant="outline" className="group border-border/70 text-primary">
                Thêm lịch
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-none bg-white/80 shadow-medium">
          <CardHeader>
            <CardTitle className="text-base">Lịch hẹn sắp tới</CardTitle>
            <CardDescription>Ưu tiên xử lý các ca chưa có kết quả</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {scheduledAppointments.slice(0, 3).map((appointment) => (
              <AppointmentItem
                key={appointment.id}
                appointment={appointment}
                actionLabel="Ghi nhận"
                onAction={() => onCreateExam()}
              />
            ))}
            {scheduledAppointments.length === 0 && (
              <p className="text-sm text-muted-foreground">Không có lịch hẹn nào trong 24h tới.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-none bg-white/80 shadow-medium">
          <CardHeader>
            <CardTitle className="text-base">Ca đã hoàn tất</CardTitle>
            <CardDescription>Những ca đã đánh dấu Done gần nhất</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {doneAppointments.slice(0, 3).map((appointment) => (
              <AppointmentItem key={appointment.id} appointment={appointment} />
            ))}
            {doneAppointments.length === 0 && (
              <p className="text-sm text-muted-foreground">Chưa có ca nào được hoàn tất.</p>
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
  trend: 'up' | 'down' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, trend }) => (
  <div className="rounded-3xl border border-transparent bg-white/80 p-4 shadow-medium transition hover:-translate-y-1 hover:border-primary/30">
    <div className="flex items-center justify-between">
      <div className="rounded-2xl bg-primary/10 p-2 text-primary">
        <Stethoscope className="h-4 w-4" />
      </div>
      <span
        className={
          trend === 'up'
            ? 'text-xs font-semibold uppercase text-green-500'
            : trend === 'down'
              ? 'text-xs font-semibold uppercase text-rose-500'
              : 'text-xs font-semibold uppercase text-muted-foreground'
        }
      >
        {trend === 'up' ? 'Tốt' : trend === 'down' ? 'Cần chú ý' : 'Ổn định'}
      </span>
    </div>
    <p className="mt-5 text-3xl font-semibold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{description}</p>
  </div>
);

const OverviewDetail: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => (
  <div className="rounded-2xl border border-border/70 bg-white/70 p-3 text-sm">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {icon}
      {label}
    </div>
    <p className="mt-1 font-medium text-foreground">{value}</p>
  </div>
);

const AppointmentItem: React.FC<{
  appointment: AppointmentSummary;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ appointment, actionLabel, onAction }) => (
  <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-white/60 px-4 py-3 text-sm transition hover:shadow-medium">
    <div>
      <p className="font-semibold text-foreground">{appointment.type}</p>
      <p className="text-xs text-muted-foreground">{formatDateTime(appointment.dateTime)}</p>
    </div>
    {actionLabel && onAction && (
      <Button size="sm" variant="outline" className="text-primary" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
);

export default OverviewSection;

