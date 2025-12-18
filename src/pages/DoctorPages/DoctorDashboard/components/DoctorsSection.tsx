import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button } from '@/components/ui';
import { Stethoscope } from 'lucide-react';
import type { DoctorSummary } from '@/types/doctor';
import DoctorDetailPage from './DoctorDetailPage';

interface DoctorsSectionProps {
  doctors: DoctorSummary[];
}

const DoctorsSection: React.FC<DoctorsSectionProps> = ({ doctors }) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1 border-none bg-white/90 shadow-medium">
        <CardHeader>
          <CardTitle className="text-lg">Danh sách bác sĩ</CardTitle>
          <CardDescription>{doctors.length} bác sĩ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {doctors.map((doctor) => (
            <button
              key={doctor.id}
              onClick={() => setSelectedDoctorId(doctor.id === selectedDoctorId ? null : doctor.id)}
              className={`w-full rounded-xl border p-3 text-left transition ${
                selectedDoctorId === doctor.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border/70 bg-white/60 hover:border-primary/50'
              }`}
            >
              <p className="text-sm font-semibold text-foreground">{doctor.fullName}</p>
              {doctor.specialization && (
                <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
              )}
            </button>
          ))}
          {doctors.length === 0 && (
            <p className="text-sm text-muted-foreground">Chưa có bác sĩ nào.</p>
          )}
        </CardContent>
      </Card>

      {selectedDoctor ? (
        <DoctorDetailPage doctorId={selectedDoctor.id} doctor={selectedDoctor} />
      ) : (
        <Card className="lg:col-span-2 border-none bg-white/90 shadow-medium">
          <CardHeader>
            <CardTitle className="text-lg">Thông tin bác sĩ</CardTitle>
            <CardDescription>Chi tiết thông tin bác sĩ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
              <Stethoscope className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">Chọn một bác sĩ để xem thông tin chi tiết</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DoctorsSection;

