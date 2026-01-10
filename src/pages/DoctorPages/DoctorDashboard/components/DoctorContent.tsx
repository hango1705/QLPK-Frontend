import React, { useMemo, useState, useEffect } from 'react';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';
import {
  AppointmentSummary,
  DentalService,
  ExaminationSummary,
  PrescriptionItem,
  TreatmentPhase,
  TreatmentPlan,
} from '@/types/doctor';
import type { ContentSectionProps, Section } from '../types';
import { formatCurrency, formatDate, formatDateTime } from '../utils';
import { STATUS_BADGE } from '../constants';
import { Stethoscope, CheckCircle2, Hourglass, Activity, Clock, FileText, ChevronDown, ChevronUp, Image as ImageIcon, Eye } from 'lucide-react';
import ImageViewer from '@/components/ui/ImageViewer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';
import { showNotification } from '@/components/ui';
import { nurseAPI } from '@/services/api/nurse';
import { patientAPI } from '@/services/api/patient';
import type { DoctorSummary } from '@/types/doctor';
import type { NurseInfo } from '@/services/api/nurse';
import type { PatientResponse } from '@/services/api/patient';
import InsightsSection from './InsightsSection';
import PatientsSection from './PatientsSection';
import AppointmentsCalendar from './AppointmentsCalendar';
import DoctorsSection from './DoctorsSection';
import NursesSection from './NursesSection';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

// Helper function to translate gender to Vietnamese
const translateGender = (gender?: string): string => {
  if (!gender) return '';
  const genderLower = gender.toLowerCase();
  if (genderLower === 'male' || genderLower === 'nam') return 'Nam';
  if (genderLower === 'female' || genderLower === 'nữ') return 'Nữ';
  if (genderLower === 'other' || genderLower === 'khác') return 'Khác';
  return gender; // Fallback to original if unknown
};

const DoctorContent: React.FC<ContentSectionProps> = (props) => {
  const {
    activeSection,
    appointments,
    scheduledAppointments,
    examinations,
    treatmentPlans,
    phasesByPlan,
    serviceCategories,
    services,
    prescriptions,
    onCreateExam,
    onViewExamDetail,
    onCreatePhase,
    onEditPhase,
    onCreatePlan,
    onUpdatePlanStatus,
    onViewPlanDetail,
    onPhaseClick,
    onAddPhase,
  } = props;

  const renderContent = () => {
    switch (activeSection) {
      case 'appointments':
        return (
          <AppointmentsCalendar
            appointments={appointments}
            scheduledAppointments={scheduledAppointments}
            onCreateExam={onCreateExam}
            onViewDetail={props.onViewAppointmentDetail}
          />
        );
      case 'catalog':
        return (
          <CatalogPanel
            serviceCategories={serviceCategories}
            services={services}
            prescriptions={prescriptions}
            doctors={props.doctors}
          />
        );
      case 'insights':
        return (
          <InsightsSection
            appointments={appointments}
            scheduledAppointments={scheduledAppointments}
            examinations={examinations}
            treatmentPlans={treatmentPlans}
            phasesByPlan={phasesByPlan}
            services={services}
          />
        );
      case 'doctors':
        return <DoctorsSection doctors={props.doctors || []} />;
      case 'nurses':
        return <NursesSection nurses={props.nurses || []} isLoading={props.isLoadingNurses} />;
      case 'patients':
        return (
          <PatientsSection
            examinations={examinations}
            treatmentPlans={treatmentPlans}
            appointments={appointments}
            phasesByPlan={phasesByPlan}
            onPhaseClick={onPhaseClick}
            onAddPhase={onAddPhase}
            onViewExamDetail={onViewExamDetail}
            onCreatePlan={onCreatePlan}
            onViewPlanDetail={onViewPlanDetail}
          />
        );
      case 'overview':
      default:
        return null;
    }
  };

  return <div className="space-y-4">{renderContent()}</div>;
};


// Helper function to calculate cost from services and prescriptions (same as in NurseContent)
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

const CatalogPanel: React.FC<{
  serviceCategories: { id: string; name: string; listDentalServiceEntity: DentalService[] }[];
  services: DentalService[];
  prescriptions: PrescriptionItem[];
  doctors?: any[];
}> = ({ serviceCategories, prescriptions, doctors }) => (
  <Card className="border-none bg-white/90 shadow-medium">
    <CardHeader>
      <CardTitle className="text-lg">Danh mục dịch vụ & thuốc</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      {doctors && doctors.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Danh sách bác sĩ</h3>
          <div className="rounded-2xl border border-border/70 bg-white/60 p-3">
            <div className="grid gap-2 md:grid-cols-2">
              {doctors.map((doctor) => (
                <div key={doctor.id} className="rounded-xl border border-border/60 bg-white px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{doctor.fullName || doctor.username}</p>
                  {doctor.specialization && (
                    <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Dịch vụ nha khoa</h3>
        {serviceCategories.map((category) => (
          <div key={category.id} className="rounded-2xl border border-border/70 bg-white/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {category.name}
            </p>
            <ul className="mt-2 space-y-2 text-sm text-foreground">
              {category.listDentalServiceEntity.slice(0, 3).map((service) => (
                <li key={service.id} className="flex items-center justify-between">
                  <span>{service.name}</span>
                  <span className="text-xs text-muted-foreground">{formatCurrency(service.unitPrice)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Thuốc kê toa</h3>
        <div className="rounded-2xl border border-border/70 bg-white/60 p-3">
          <ul className="space-y-2 text-sm">
            {prescriptions.slice(0, 6).map((item) => (
              <li key={item.name} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.dosage} · {item.frequency}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      </div>
    </CardContent>
  </Card>
);

export default DoctorContent;

