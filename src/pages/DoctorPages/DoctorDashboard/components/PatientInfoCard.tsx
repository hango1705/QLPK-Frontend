import React from 'react';
import { Card, CardContent } from '@/components/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui';
import { AlertCircle, Droplet, FileText, User } from 'lucide-react';

interface PatientInfoCardProps {
  patientName: string;
  avatar?: string;
  allergy?: string;
  bloodGroup?: string;
  medicalHistory?: string;
}

const PatientInfoCard: React.FC<PatientInfoCardProps> = ({
  patientName,
  avatar,
  allergy,
  bloodGroup,
  medicalHistory,
}) => {
  const getInitials = () => {
    if (!patientName) return 'P';
    const names = patientName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return patientName.charAt(0).toUpperCase();
  };

  return (
    <Card className="border-none bg-gradient-to-br from-blue-50 via-white to-cyan-50 shadow-lg rounded-2xl overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <Avatar className="h-24 w-24 border-4 border-white shadow-md">
              <AvatarImage src={avatar} alt={patientName} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-2xl font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Patient Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">{patientName}</h2>
              <p className="text-sm text-muted-foreground">Thông tin bệnh nhân</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Allergy */}
              {allergy && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Dị ứng</p>
                    <p className="text-sm font-medium text-red-900">{allergy}</p>
                  </div>
                </div>
              )}

              {/* Blood Group */}
              {bloodGroup && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <Droplet className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Nhóm máu</p>
                    <p className="text-sm font-medium text-blue-900">{bloodGroup}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Medical History */}
            {medicalHistory && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                <FileText className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Tiểu sử bệnh lý</p>
                  <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{medicalHistory}</p>
                </div>
              </div>
            )}

            {/* Empty state if no data */}
            {!allergy && !bloodGroup && !medicalHistory && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Chưa có thông tin y tế bổ sung</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientInfoCard;

