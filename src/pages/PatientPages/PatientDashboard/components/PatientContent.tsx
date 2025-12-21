import React, { Suspense } from 'react';
import { Alert, AlertTitle, AlertDescription, Loading, Card, CardContent } from '@/components/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui';
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
      {/* Patient Header Card - shown on overview and some sections */}
      {patient && (activeSection === 'overview' || activeSection === 'basic') && (
        <Card className="mb-6 border-none shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-4 border-white/30">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-white/20 text-white text-2xl">
                    {patient.fullName && patient.fullName.length > 0
                      ? patient.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)
                      : 'P'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{patient.fullName || 'Bệnh nhân'}</h2>
                  <p className="text-white/80 text-sm">{patient.email || 'Chưa cập nhật email'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

