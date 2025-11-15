import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button } from '@/components/ui';
import { Stethoscope, ClipboardList, RefreshCcw } from 'lucide-react';
import type { RightRailProps } from '../types';
import { formatCurrency } from '../utils';

const RightRail: React.FC<RightRailProps> = ({
  nextAppointment,
  scheduledAppointments,
  treatmentPlans,
  serviceCategories,
  onQuickExam,
  onQuickPhase,
}) => {
  const topServices = useMemo(() => {
    const list = serviceCategories.flatMap((category) => category.listDentalServiceEntity || []);
    return list.slice(0, 5);
  }, [serviceCategories]);

  return (
    <div className="space-y-6">
      <Card className="border-none bg-white/80 shadow-medium">
        <CardHeader>
          <CardTitle className="text-base">Tác vụ nhanh</CardTitle>
          <CardDescription>Tự động chuẩn hóa quy trình làm việc</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <QuickAction
            icon={<Stethoscope className="h-4 w-4 text-primary" />}
            title="Ghi nhận kết quả khám"
            description="Chuẩn hoá quy trình, lưu hình ảnh & toa thuốc"
            primaryAction={() => {
              if (nextAppointment) {
                onQuickExam(nextAppointment);
              } else if (scheduledAppointments.length) {
                onQuickExam(scheduledAppointments[0]);
              }
            }}
          />
          <QuickAction
            icon={<ClipboardList className="h-4 w-4 text-secondary" />}
            title="Thêm tiến trình điều trị"
            description="Giao việc rõ ràng, đặt lịch tái khám"
            primaryAction={() => {
              if (treatmentPlans.length) {
                onQuickPhase(treatmentPlans[0]);
              }
            }}
          />
          <QuickAction
            icon={<RefreshCcw className="h-4 w-4 text-amber-500" />}
            title="Đồng bộ lịch & nhắc việc"
            description="Gửi thông báo tự động cho bệnh nhân"
          />
        </CardContent>
      </Card>

      <Card className="border-none bg-white/80 shadow-medium">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Dịch vụ sử dụng nhiều</CardTitle>
          <CardDescription>Dựa trên danh mục hiện hành</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {topServices.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between rounded-2xl border border-border/60 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-foreground">{service.name}</p>
                <p className="text-xs text-muted-foreground">
                  {service.unit} · {formatCurrency(service.unitPrice)}
                </p>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {service.unit}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

const QuickAction: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  primaryAction?: () => void;
}> = ({ icon, title, description, primaryAction }) => (
  <div className="rounded-2xl border border-border/70 bg-white/60 p-3">
    <div className="flex items-center gap-3">
      <div className="rounded-2xl bg-primary/10 p-2 text-primary">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    {primaryAction && (
      <Button variant="ghost" className="mt-3 text-primary" onClick={primaryAction}>
        Thực hiện ngay
      </Button>
    )}
  </div>
);

export default RightRail;

