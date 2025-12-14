import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Alert,
  AlertDescription,
  Progress,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Separator,
} from '@/components/ui';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Droplet,
  AlertCircle,
  Eye,
  CalendarDays,
  Syringe,
  Pill,
  Activity,
  FileText,
  Plus,
  Edit,
  X,
  EyeOff,
} from 'lucide-react';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, HourglassOutlined } from '@ant-design/icons';
import type { OverviewSectionProps } from '../types';
import { formatDateTime, formatDate, formatCurrency, getStatusColor, getStatusLabel } from '../utils';

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
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <section className="space-y-6">
      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lần khám gần nhất</p>
                <p className="text-lg font-semibold">{lastVisit || 'Chưa có'}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lịch hẹn sắp tới</p>
                <p className="text-lg font-semibold">{nextAppointment || 'Chưa đặt lịch'}</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng phác đồ</p>
                <p className="text-lg font-semibold">{planCount}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lần thanh toán</p>
                <p className="text-lg font-semibold">{paymentCount}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto gap-2 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="gap-2">
            <Eye className="h-4 w-4" />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Lịch hẹn
          </TabsTrigger>
          <TabsTrigger value="treatments" className="gap-2">
            <Syringe className="h-4 w-4" />
            Điều trị
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="gap-2">
            <Pill className="h-4 w-4" />
            Đơn thuốc
          </TabsTrigger>
          <TabsTrigger value="vitals" className="gap-2">
            <Activity className="h-4 w-4" />
            Sinh hiệu
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            Tài liệu
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Thông tin bệnh nhân</CardTitle>
                <CardDescription>Thông tin cá nhân và liên hệ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {patient && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{patient.email || 'Chưa cập nhật'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Số điện thoại</p>
                          <p className="font-medium">{patient.phone || 'Chưa cập nhật'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Địa chỉ</p>
                        <p className="font-medium">{patient.address || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Ngày sinh</p>
                          <p className="font-medium">{patient.dob || 'Chưa cập nhật'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Droplet className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Nhóm máu</p>
                          <p className="font-medium">{patient.bloodGroup || 'Chưa cập nhật'}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Dị ứng
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patient && patient.allergy ? (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800 font-medium">{patient.allergy}</AlertDescription>
                  </Alert>
                ) : (
                  <p className="text-sm text-muted-foreground">Không có dị ứng nào được ghi nhận</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Lịch hẹn gần đây</CardTitle>
                <CardDescription>3 lịch hẹn gần nhất</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentAppointments.length > 0 ? (
                    recentAppointments.slice(0, 3).map((appointment) => {
                      const status = (appointment.status || '').toLowerCase();
                      return (
                        <div
                          key={appointment.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{appointment.type || 'Khám tổng quát'}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDateTime(appointment.dateTime)}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(status)}>{getStatusLabel(appointment.status || '')}</Badge>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">Chưa có lịch hẹn nào</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tiến trình điều trị</CardTitle>
                <CardDescription>Điều trị đang diễn ra và đã lên kế hoạch</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {treatments.length > 0 ? (
                    treatments.slice(0, 3).map((treatment) => {
                      const status = (treatment.status || '').toLowerCase();
                      const progressValue =
                        status.includes('completed') || status.includes('done')
                          ? 100
                          : status.includes('in-progress') || status.includes('progress')
                            ? 50
                            : 0;
                      return (
                        <div key={treatment.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{treatment.name || 'Điều trị'}</p>
                            <Badge className={getStatusColor(status)}>{getStatusLabel(treatment.status || '')}</Badge>
                          </div>
                          <Progress value={progressValue} className="h-2" />
                          <p className="text-sm text-muted-foreground">
                            {formatDate(treatment.date)} •{' '}
                            {treatment.cost > 0 ? formatCurrency(treatment.cost) : 'Miễn phí'}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">Chưa có điều trị nào</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appointments Tab - Simplified, full version will be in AppointmentList component */}
        <TabsContent value="appointments" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Lịch sử lịch hẹn</h3>
              <p className="text-sm text-muted-foreground">Xem và quản lý tất cả lịch hẹn</p>
            </div>
            <Button className="gap-2" onClick={onBookAppointment}>
              <Plus className="h-4 w-4" />
              Đặt lịch mới
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground text-center">
                Xem chi tiết lịch hẹn trong mục "Xem lịch hẹn" ở sidebar
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Treatments Tab - Simplified */}
        <TabsContent value="treatments" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Lịch sử điều trị</h3>
              <p className="text-sm text-muted-foreground">Tất cả các điều trị và thủ thuật</p>
            </div>
            <Button className="gap-2" onClick={() => {}}>
              <Plus className="h-4 w-4" />
              Xem phác đồ
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground text-center">
                Xem chi tiết điều trị trong mục "Phác đồ điều trị" ở sidebar
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prescriptions Tab - Placeholder */}
        <TabsContent value="prescriptions" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground text-center">Chưa có đơn thuốc nào</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vitals Tab - Placeholder */}
        <TabsContent value="vitals" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground text-center">Chưa có dữ liệu sinh hiệu</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab - Placeholder */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground text-center">Chưa có tài liệu nào</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default OverviewSection;

