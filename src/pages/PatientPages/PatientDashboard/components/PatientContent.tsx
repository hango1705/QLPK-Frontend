import React, { Suspense } from 'react';
import { Alert, AlertTitle, AlertDescription, Loading, Card, CardContent } from '@/components/ui';
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui';
import { Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { Edit } from 'lucide-react';
import type { PatientContentProps } from '../types';
import OverviewSection from './OverviewSection';
import AppointmentForm from './AppointmentForm';
import AppointmentList from './AppointmentList';
import AccountPanel from './AccountPanel';

// Lazy load other patient pages
const LazyBasicInfo = React.lazy(() => import('../../PatientBasicInfo'));
const LazyInitialExam = React.lazy(() => import('../../PatientInitialExamination'));
const LazyTreatmentPlan = React.lazy(() => import('../../PatientTreatmentPlan'));
const LazyPayment = React.lazy(() => import('../../PatientPayment'));

const PatientContent: React.FC<PatientContentProps> = (props) => {
  const {
    activeSection,
    patient,
    user,
    loading,
    error,
    onBookAppointment,
    onRefreshData,
  } = props;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Route to different sections */}
      {activeSection === 'overview' && (
        <OverviewSection
          patient={patient}
          appointmentCount={props.appointmentCount}
          planCount={props.planCount}
          phaseCount={props.phaseCount}
          paymentCount={props.paymentCount}
          activities={props.activities}
          lastVisit={props.lastVisit}
          nextAppointment={props.nextAppointment}
          recentAppointments={props.recentAppointments}
          treatments={props.treatments}
          onBookAppointment={onBookAppointment}
          patientId={patient?.id}
          emergencyContactName={patient?.emergencyContactName}
          emergencyPhoneNumber={patient?.emergencyPhoneNumber}
          medicalConditions={[
            ...(patient?.allergy ? [{ type: 'allergy' as const, label: `DỊ ỨNG: ${patient.allergy}` }] : []),
            // Có thể thêm các điều kiện y tế khác từ patient data
          ]}
          onEditInfo={() => {
            // Navigate to basic info section
            if (props.onSectionChange) {
              props.onSectionChange('basic');
            }
          }}
          onAddNote={() => {
            // TODO: Implement add note functionality
            console.log('Add note clicked');
          }}
          onCreateExamination={() => {
            // Navigate to initial examination
            if (props.onSectionChange) {
              props.onSectionChange('initial');
            }
          }}
          onSendReminder={() => {
            // TODO: Implement send reminder functionality
            console.log('Send reminder clicked');
          }}
          onViewOdontogramDetail={() => {
            // TODO: Navigate to detailed odontogram view
            console.log('View odontogram detail clicked');
          }}
        />
      )}

      {activeSection === 'basic' && (
        <Suspense fallback={<Loading />}>
          <LazyBasicInfo />
        </Suspense>
      )}

      {activeSection === 'initial' && (
        <Suspense fallback={<Loading />}>
          <LazyInitialExam />
        </Suspense>
      )}

      {activeSection === 'plan' && (
        <Suspense fallback={<Loading />}>
          <LazyTreatmentPlan />
        </Suspense>
      )}

      {activeSection === 'payment' && (
        <Suspense fallback={<Loading />}>
          <LazyPayment />
        </Suspense>
      )}

      {activeSection === 'appointment' && (
        <AppointmentForm onBooked={onRefreshData} />
      )}

      {activeSection === 'appointments' && (
        <AppointmentList
          appointments={props.allAppointments}
          filter={props.appointmentFilter}
          page={props.appointmentPage}
          pageSize={props.appointmentPageSize}
          onFilterChange={props.onAppointmentFilterChange}
          onPageChange={props.onAppointmentPageChange}
          onBookNew={() => {
            // This will be handled by parent to change section
            onBookAppointment();
          }}
          onRefreshData={onRefreshData}
        />
      )}

      {activeSection === 'account' && (
        <AccountPanel
          patient={patient}
          user={user}
          editForm={{}}
          onEditFormChange={() => {}}
          onSave={() => {}}
          saving={false}
        />
      )}
    </div>
  );
};

export default PatientContent;

