import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Badge,
  Button,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui';
import { Calendar, DollarSign, User, Stethoscope, FileText, Clock, CheckCircle2, XCircle, Pause, AlertCircle, Heart, Edit, Mail, Phone, MapPin, Award, Droplet, AlertTriangle } from 'lucide-react';
import type { TreatmentPlan, TreatmentPhase } from '@/types/doctor';
import { formatDate, formatCurrency } from '../../utils';
import { STATUS_BADGE } from '../../constants';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { doctorAPI, nurseAPI } from '@/services';
import { queryKeys } from '@/services/queryClient';

interface TreatmentPlanDetailDialogProps {
  open: boolean;
  plan: TreatmentPlan | null;
  phases: TreatmentPhase[];
  onOpenChange: (open: boolean) => void;
  onEdit?: (plan: TreatmentPlan) => void;
  onCreatePhase?: (plan: TreatmentPlan) => void;
  onEditPhase?: (plan: TreatmentPlan, phase: TreatmentPhase) => void;
}

// Component để hiển thị tooltip cho bác sĩ
const DoctorTooltip: React.FC<{
  id: string;
  name: string;
  children: React.ReactNode;
}> = ({ id, name, children }) => {
  const { data: info, isLoading } = useQuery({
    queryKey: queryKeys.nurse.doctor(id),
    queryFn: () => nurseAPI.getDoctorById(id),
    enabled: !!id,
  });

  if (!id) return <>{children}</>;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-pointer hover:text-primary transition-colors">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          {isLoading ? (
            <div className="text-sm">Đang tải...</div>
          ) : info ? (
            <div className="space-y-2 text-sm">
              <div className="font-semibold">{name}</div>
              {info.specialization && (
                <div className="flex items-center gap-2">
                  <Award className="h-3 w-3" />
                  <span>{info.specialization}</span>
                </div>
              )}
              {info.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span>{info.phone}</span>
                </div>
              )}
              {info.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <span className="break-all">{info.email}</span>
                </div>
              )}
              {info.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  <span>{info.address}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm">Không có thông tin</div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Component để hiển thị tooltip cho bệnh nhân
const PatientTooltip: React.FC<{
  id: string;
  name: string;
  children: React.ReactNode;
}> = ({ id, name, children }) => {
  const { data: info, isLoading, error } = useQuery({
    queryKey: queryKeys.nurse.patient(id),
    queryFn: () => nurseAPI.getPatientById(id),
    enabled: !!id,
  });

  if (!id) return <>{children}</>;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-pointer hover:text-primary transition-colors">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          {isLoading ? (
            <div className="text-sm">Đang tải...</div>
          ) : error ? (
            <div className="text-sm text-red-500">Lỗi khi tải thông tin</div>
          ) : info && (info.fullName || info.phone || info.email || info.address) ? (
            <div className="space-y-2 text-sm">
              <div className="font-semibold">{info.fullName || name}</div>
              {info.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span>{info.phone}</span>
                </div>
              )}
              {info.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <span className="break-all">{info.email}</span>
                </div>
              )}
              {info.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  <span>{info.address}</span>
                </div>
              )}
              {info.gender && (
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  <span>Giới tính: {info.gender === 'MALE' ? 'Nam' : info.gender === 'FEMALE' ? 'Nữ' : info.gender}</span>
                </div>
              )}
              {info.dob && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Ngày sinh: {info.dob}</span>
                </div>
              )}
              {info.bloodGroup && (
                <div className="flex items-center gap-2">
                  <Droplet className="h-3 w-3" />
                  <span>Nhóm máu: {info.bloodGroup}</span>
                </div>
              )}
              {info.allergy && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                  <span>Dị ứng: {info.allergy}</span>
                </div>
              )}
              {info.emergencyContactName && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                  <User className="h-3 w-3" />
                  <span>Liên hệ khẩn cấp: {info.emergencyContactName}</span>
                  {info.emergencyPhoneNumber && (
                    <span className="text-muted-foreground">({info.emergencyPhoneNumber})</span>
                  )}
                </div>
              )}
              {!info.phone && !info.email && !info.address && (
                <div className="text-xs text-muted-foreground">Chưa có thông tin liên hệ</div>
              )}
            </div>
          ) : (
            <div className="text-sm">Không có thông tin</div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Component để hiển thị tooltip cho y tá
const NurseTooltip: React.FC<{
  id: string;
  name: string;
  children: React.ReactNode;
}> = ({ id, name, children }) => {
  const { data: info, isLoading, error } = useQuery({
    queryKey: queryKeys.nurse.profile(id),
    queryFn: () => nurseAPI.getNurseInfo(id),
    enabled: !!id,
  });

  if (!id) return <>{children}</>;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-pointer hover:text-primary transition-colors">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          {isLoading ? (
            <div className="text-sm">Đang tải...</div>
          ) : error ? (
            <div className="text-sm text-red-500">Lỗi khi tải thông tin</div>
          ) : info ? (
            <div className="space-y-2 text-sm">
              <div className="font-semibold">{info.fullName || name}</div>
              {info.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span>{info.phone}</span>
                </div>
              )}
              {info.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <span className="break-all">{info.email}</span>
                </div>
              )}
              {info.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  <span>{info.address}</span>
                </div>
              )}
              {info.gender && (
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  <span>Giới tính: {info.gender === 'MALE' ? 'Nam' : info.gender === 'FEMALE' ? 'Nữ' : info.gender}</span>
                </div>
              )}
              {info.dob && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Ngày sinh: {info.dob}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm">Không có thông tin</div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Helper function to calculate cost from services and prescriptions
const calculatePhaseCost = (phase: TreatmentPhase): number | null => {
  const services = phase.listDentalServicesEntityOrder || [];
  const prescriptions = phase.listPrescriptionOrder || [];
  
  // If no services and prescriptions, return null to use phase.cost
  if (services.length === 0 && prescriptions.length === 0) {
    return null;
  }

  const calculateServiceCost = (service: typeof services[0]) => {
    if (service.cost && service.cost > 0) {
      return service.cost;
    }
    return (service.quantity || 0) * (service.unitPrice || 0);
  };

  const calculatePrescriptionCost = (prescription: typeof prescriptions[0]) => {
    if (prescription.cost && prescription.cost > 0) {
      return prescription.cost;
    }
    return (prescription.quantity || 0) * (prescription.unitPrice || 0);
  };

  const servicesTotal = services.reduce((sum, item) => sum + calculateServiceCost(item), 0);
  const prescriptionsTotal = prescriptions.reduce((sum, item) => sum + calculatePrescriptionCost(item), 0);
  return servicesTotal + prescriptionsTotal;
};

// Component để hiển thị tooltip chi tiết giá tiền
const CostTooltip: React.FC<{
  phase: TreatmentPhase;
  children: React.ReactNode;
}> = ({ phase, children }) => {
  const services = phase.listDentalServicesEntityOrder || [];
  const prescriptions = phase.listPrescriptionOrder || [];
  const hasDetails = services.length > 0 || prescriptions.length > 0;

  if (!hasDetails || phase.cost <= 0) return <>{children}</>;

  // Calculate cost from quantity * unitPrice if cost is not provided or seems incorrect
  const calculateServiceCost = (service: typeof services[0]) => {
    if (service.cost && service.cost > 0) {
      return service.cost;
    }
    return (service.quantity || 0) * (service.unitPrice || 0);
  };

  const calculatePrescriptionCost = (prescription: typeof prescriptions[0]) => {
    if (prescription.cost && prescription.cost > 0) {
      return prescription.cost;
    }
    return (prescription.quantity || 0) * (prescription.unitPrice || 0);
  };

  const servicesTotal = services.reduce((sum, item) => sum + calculateServiceCost(item), 0);
  const prescriptionsTotal = prescriptions.reduce((sum, item) => sum + calculatePrescriptionCost(item), 0);
  const calculatedTotal = servicesTotal + prescriptionsTotal;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-pointer hover:text-primary transition-colors">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <div className="space-y-3 text-sm">
            <div className="font-semibold text-base border-b pb-2">Chi tiết giá tiền</div>
            
            {services.length > 0 && (
              <div>
                <div className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Dịch vụ:
                </div>
                <div className="space-y-1.5">
                  {services.map((service, idx) => (
                    <div key={idx} className="flex items-start justify-between text-xs bg-blue-50/50 p-2 rounded">
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{service.name}</div>
                        <div className="text-muted-foreground">
                          {service.quantity} {service.unit} × {formatCurrency(service.unitPrice)}
                        </div>
                      </div>
                      <div className="font-semibold text-primary ml-2">
                        {formatCurrency(calculateServiceCost(service))}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-1 border-t font-semibold">
                    <span>Tổng dịch vụ:</span>
                    <span className="text-primary">{formatCurrency(servicesTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            {prescriptions.length > 0 && (
              <div>
                <div className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Thuốc:
                </div>
                <div className="space-y-1.5">
                  {prescriptions.map((prescription, idx) => (
                    <div key={idx} className="flex items-start justify-between text-xs bg-green-50/50 p-2 rounded">
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{prescription.name}</div>
                        <div className="text-muted-foreground">
                          {prescription.quantity} × {formatCurrency(prescription.unitPrice)}
                        </div>
                        {prescription.dosage && (
                          <div className="text-muted-foreground text-xs">
                            Liều: {prescription.dosage} - {prescription.frequency} - {prescription.duration}
                          </div>
                        )}
                      </div>
                      <div className="font-semibold text-primary ml-2">
                        {formatCurrency(calculatePrescriptionCost(prescription))}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-1 border-t font-semibold">
                    <span>Tổng thuốc:</span>
                    <span className="text-primary">{formatCurrency(prescriptionsTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t-2 font-bold text-base">
              <span>Tổng cộng:</span>
              <span className="text-primary">{formatCurrency(calculatedTotal)}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const TreatmentPlanDetailDialog: React.FC<TreatmentPlanDetailDialogProps> = ({
  open,
  plan,
  phases,
  onOpenChange,
  onEdit,
  onCreatePhase,
  onEditPhase,
}) => {
  if (!plan) return null;

  const sortedPhases = [...phases].sort((a, b) => {
    const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
    const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
    return dateA - dateB;
  });

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'done':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      case 'inprogress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status || 'Inprogress';
    const badgeClassName = STATUS_BADGE[normalizedStatus] || STATUS_BADGE.Inprogress;
    return (
      <Badge className={badgeClassName}>
        {normalizedStatus}
      </Badge>
    );
  };

  const totalPhases = phases.length;
  const completedPhases = phases.filter(p => p.status?.toLowerCase() === 'done').length;
  const inProgressPhases = phases.filter(p => p.status?.toLowerCase() === 'inprogress').length;
  
  // Calculate total cost from all phases (same as nurse)
  const totalCostFromPhases = phases.reduce((sum, phase) => {
    const calculatedCost = calculatePhaseCost(phase);
    return sum + (calculatedCost || phase.cost || 0);
  }, 0);

  return (
    <TooltipProvider delayDuration={200}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto !max-w-[50vw] sm:!max-w-[50vw] md:!max-w-[50vw] lg:!max-w-[50vw] w-full overflow-x-visible rounded-3xl bg-white p-0 sm:max-w-4xl">
          <DialogHeader className="space-y-2 border-b border-border/70 px-6 pb-4 pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <DialogTitle className="text-xl font-semibold text-foreground">{plan.title}</DialogTitle>
                  {getStatusBadge(plan.status)}
                </div>
                <DialogDescription className="text-sm text-muted-foreground">
                  {plan.description || 'Không có mô tả'}
                </DialogDescription>
              </div>
              <PermissionGuard permission="UPDATE_TREATMENT_PLANS">
                {onEdit && (
                  <Button variant="outline" size="sm" onClick={() => onEdit(plan)} className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Chỉnh sửa
                  </Button>
                )}
              </PermissionGuard>
            </div>
          </DialogHeader>

          <div className="px-6 py-4 space-y-6">
            {/* Thông tin tổng quan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Thông tin cơ bản
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ngày tạo:</span>
                    <span className="font-medium">{plan.createAt ? formatDate(plan.createAt) : 'Chưa có'}</span>
                  </div>
                  {plan.duration && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Thời gian điều trị:</span>
                      <span className="font-medium">{plan.duration}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tổng chi phí:</span>
                    <span className="font-semibold text-primary">{formatCurrency(totalCostFromPhases || plan.totalCost)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 relative" style={{ overflow: 'visible' }}>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Thông tin liên quan
                </h3>
                <div className="space-y-2 text-sm" style={{ overflow: 'visible' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Stethoscope className="h-3 w-3" />
                      Bác sĩ:
                    </span>
                    {plan.doctorId ? (
                      <DoctorTooltip 
                        id={plan.doctorId} 
                        name={plan.doctorFullname || 'Chưa xác định'}
                      >
                        <span className="font-medium">{plan.doctorFullname || 'Chưa xác định'}</span>
                      </DoctorTooltip>
                    ) : (
                      <span className="font-medium">{plan.doctorFullname || 'Chưa xác định'}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Bệnh nhân:
                    </span>
                    {plan.patientId ? (
                      <PatientTooltip 
                        id={plan.patientId} 
                        name={plan.patientName || 'Chưa xác định'}
                      >
                        <span className="font-medium">{plan.patientName || 'Chưa xác định'}</span>
                      </PatientTooltip>
                    ) : (
                      <span className="font-medium">{plan.patientName || 'Chưa xác định'}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      Y tá:
                    </span>
                    {plan.nurseId ? (
                      <NurseTooltip 
                        id={plan.nurseId} 
                        name={plan.nurseFullname || 'Chưa xác định'}
                      >
                        <span className="font-medium">{plan.nurseFullname || 'Chưa xác định'}</span>
                      </NurseTooltip>
                    ) : (
                      <span className="font-medium">{plan.nurseFullname || 'Chưa xác định'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Thống kê tiến trình */}
            <div className="bg-muted/50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Tổng quan tiến trình
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{totalPhases}</div>
                  <div className="text-xs text-muted-foreground mt-1">Tổng giai đoạn</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{inProgressPhases}</div>
                  <div className="text-xs text-muted-foreground mt-1">Đang điều trị</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{completedPhases}</div>
                  <div className="text-xs text-muted-foreground mt-1">Hoàn thành</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{formatCurrency(totalCostFromPhases || plan.totalCost)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Tổng chi phí</div>
                </div>
              </div>
            </div>

            {/* Ghi chú */}
            {plan.notes && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Ghi chú
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{plan.notes}</p>
              </div>
            )}

            {/* Danh sách các giai đoạn */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Danh sách giai đoạn ({sortedPhases.length})
                </h3>
                {onCreatePhase && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreatePhase(plan);
                    }}
                  >
                    + Thêm giai đoạn
                  </Button>
                )}
              </div>

              {sortedPhases.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa có giai đoạn nào</p>
                  {onCreatePhase && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreatePhase(plan);
                      }}
                    >
                      + Thêm giai đoạn đầu tiên
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedPhases.map((phase, index) => (
                    <div
                      key={phase.id}
                      className="border border-border/70 rounded-xl p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => onEditPhase?.(plan, phase)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                              Giai đoạn {index + 1}
                            </span>
                            {getStatusBadge(phase.status || 'Inprogress')}
                          </div>
                          {phase.description && (
                            <p className="text-sm text-foreground mb-2">{phase.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            {phase.startDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Bắt đầu: {formatDate(phase.startDate)}</span>
                              </div>
                            )}
                            {phase.endDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Kết thúc: {formatDate(phase.endDate)}</span>
                              </div>
                            )}
                            {phase.cost > 0 && (
                              <CostTooltip phase={phase}>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  <span className="font-medium text-primary">
                                    {formatCurrency(calculatePhaseCost(phase) || phase.cost)}
                                  </span>
                                </div>
                              </CostTooltip>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {getStatusIcon(phase.status || 'Inprogress')}
                          {onEditPhase && (
                            <Button variant="ghost" size="sm" onClick={(e) => {
                              e.stopPropagation();
                              onEditPhase(plan, phase);
                            }}>
                              Xem chi tiết
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default TreatmentPlanDetailDialog;
