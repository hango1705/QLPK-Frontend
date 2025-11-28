import type {
  AppointmentSummary,
  DentalService,
  ExaminationSummary,
  TreatmentPhase,
  TreatmentPlan,
} from '@/types/doctor';
import type { ExaminationFormState, TreatmentPhaseFormState } from './types';

export const parseDate = (value?: string) => {
  if (!value) return undefined;
  if (value.includes('T')) return new Date(value);
  if (value.includes('/')) {
    const [day, month, year] = value.split('/');
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  return new Date(value.replace(' ', 'T'));
};

export const formatDateTime = (value?: string) => {
  const date = parseDate(value);
  if (!date || Number.isNaN(date.getTime())) return 'Chưa xác định';
  return date.toLocaleString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDate = (value?: string) => {
  const date = parseDate(value);
  if (!date || Number.isNaN(date.getTime())) return '---';
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0);

export const formatToInputDate = (value?: string) => {
  const date = parseDate(value);
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

export const formatToInputTime = (value?: string) => {
  const date = parseDate(value);
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toTimeString().substring(0, 5);
};

const formatDatePayload = (input?: string) => {
  if (!input) return '';
  const [year, month, day] = input.split('-');
  return `${day}/${month}/${year}`;
};

export const buildExaminationPayload = (form: ExaminationFormState) => ({
  symptoms: form.symptoms,
  diagnosis: form.diagnosis,
  notes: form.notes,
  treatment: form.treatment,
  totalCost: form.totalCost,
  listDentalServicesEntityOrder: form.serviceOrders,
  listPrescriptionOrder: form.prescriptionOrders,
  listImageXray: form.xrayFiles,
  listImageFace: form.faceFiles,
  listImageTeeth: form.teethFiles,
  listDeleteImageByPublicId: form.removeImageIds,
});

export const buildPhasePayload = (form: TreatmentPhaseFormState) => {
  const nextAppointment =
    form.nextAppointmentDate && form.nextAppointmentTime
      ? `${form.nextAppointmentTime} ${formatDatePayload(form.nextAppointmentDate)}`
      : undefined;

  // Kết hợp procedure và description
  const fullDescription = form.procedure
    ? `${form.procedure}${form.description ? '\n\nGhi chú: ' + form.description : ''}`
    : form.description;

  return {
    phaseNumber: form.phaseNumber,
    description: fullDescription, // Bao gồm cả procedure và description
    procedure: form.procedure, // Gửi riêng nếu backend hỗ trợ
    startDate: formatDatePayload(form.startDate),
    endDate: formatDatePayload(form.endDate),
    cost: form.cost,
    status: form.status,
    nextAppointment,
    listDentalServicesEntityOrder: form.serviceOrders,
    listPrescriptionOrder: form.prescriptionOrders,
    listImageXray: form.xrayFiles,
    listImageFace: form.faceFiles,
    listImageTeeth: form.teethFiles,
    listDeleteImageByPublicId: form.removeImageIds,
  };
};

export const aggregatePhases = (plans: TreatmentPlan[], phases: Record<string, TreatmentPhase[]>) =>
  Object.values(phases ?? {}).flat().filter((phase) => phase.status === 'Inprogress');

export const getNextAppointment = (scheduled: AppointmentSummary[]) => {
  const sorted = [...scheduled].sort(
    (a, b) => (parseDate(a.dateTime)?.getTime() ?? 0) - (parseDate(b.dateTime)?.getTime() ?? 0),
  );
  return sorted[0];
};

export const sortAppointments = (appointments: AppointmentSummary[], status?: string) =>
  appointments
    .filter((appointment) => (status ? appointment.status?.toLowerCase() === status : true))
    .sort((a, b) => (parseDate(b.dateTime)?.getTime() ?? 0) - (parseDate(a.dateTime)?.getTime() ?? 0));

