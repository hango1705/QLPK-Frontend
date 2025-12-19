import React from 'react';
import { Card, CardContent } from '@/components/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui';
import {
  AlertCircle,
  Droplet,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
} from 'lucide-react';

interface PatientInfoCardProps {
  patientName: string;
  avatar?: string;
  email?: string;
  phone?: string;
  address?: string;
  dob?: string;
  gender?: string;
  emergencyContactName?: string;
  emergencyPhoneNumber?: string;
  allergy?: string;
  bloodGroup?: string;
  medicalHistory?: string;
}

const PatientInfoCard: React.FC<PatientInfoCardProps> = ({
  patientName,
  avatar,
  email,
  phone,
  address,
  dob,
  gender,
  emergencyContactName,
  emergencyPhoneNumber,
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
    <Card className="border-none bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)] rounded-3xl overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[auto,1.4fr,1.2fr] items-start">
          {/* Avatar + tên */}
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-24 w-24 md:h-28 md:w-28 border-4 border-white shadow-xl shadow-sky-100">
              <AvatarImage src={avatar} alt={patientName} />
              <AvatarFallback className="bg-gradient-to-br from-sky-500 to-blue-600 text-white text-2xl font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center space-y-1">
              <p className="text-lg font-semibold text-slate-900">{patientName}</p>
              <p className="text-xs font-medium tracking-wide text-sky-600 uppercase">
                Thông tin bệnh nhân
              </p>
            </div>
          </div>

          {/* Thông tin cơ bản */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gender && (
                <div className="flex items-center gap-2 text-sm bg-white/70 rounded-xl px-3 py-2 border border-slate-100">
                  <User className="h-4 w-4 text-slate-500" />
                  <div className="space-y-0.5">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Giới tính</p>
                    <p className="font-medium text-slate-900">
                      {gender === 'MALE' ? 'Nam' : gender === 'FEMALE' ? 'Nữ' : gender}
                    </p>
                  </div>
                </div>
              )}
              {dob && (
                <div className="flex items-center gap-2 text-sm bg-white/70 rounded-xl px-3 py-2 border border-slate-100">
                  <CalendarIcon className="h-4 w-4 text-slate-500" />
                  <div className="space-y-0.5">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Ngày sinh</p>
                    <p className="font-medium text-slate-900">{dob}</p>
                  </div>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-2 text-sm bg-white/70 rounded-xl px-3 py-2 border border-slate-100">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <div className="space-y-0.5">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Số điện thoại</p>
                    <p className="font-medium text-slate-900">{phone}</p>
                  </div>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-2 text-sm bg-white/70 rounded-xl px-3 py-2 border border-slate-100">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <div className="space-y-0.5">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Email</p>
                    <p className="font-medium text-slate-900 break-all">{email}</p>
                  </div>
                </div>
              )}
            </div>

            {address && (
              <div className="flex items-start gap-2 text-sm bg-white/70 rounded-xl px-3 py-2 border border-slate-100">
                <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Địa chỉ</p>
                  <p className="font-medium text-slate-900">{address}</p>
                </div>
              </div>
            )}

            {(emergencyContactName || emergencyPhoneNumber) && (
              <div className="rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-600 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Liên hệ khẩn cấp
                </p>
                <p className="text-sm font-medium text-orange-900">
                  {emergencyContactName || 'Chưa có'}{' '}
                  {emergencyPhoneNumber && (
                    <span className="font-normal text-orange-700">({emergencyPhoneNumber})</span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Tóm tắt y tế bên phải */}
          <div className="space-y-4">
            {allergy && (
              <div className="rounded-2xl border border-red-100 bg-red-50/70 px-4 py-3 flex gap-3 items-start">
                <div className="mt-0.5">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600">
                    Dị ứng
                  </p>
                  <p className="text-sm font-medium text-red-900">{allergy}</p>
                </div>
              </div>
            )}

            {bloodGroup && (
              <div className="rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 flex gap-3 items-start">
                <div className="mt-0.5">
                  <Droplet className="h-5 w-5 text-sky-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700">
                    Nhóm máu
                  </p>
                  <p className="text-sm font-medium text-sky-900">{bloodGroup}</p>
                </div>
              </div>
            )}

            {medicalHistory && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 flex gap-3 items-start">
                <div className="mt-0.5">
                  <FileText className="h-5 w-5 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                    Tiểu sử bệnh lý
                  </p>
                  <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">
                    {medicalHistory}
                  </p>
                </div>
              </div>
            )}

            {!allergy && !bloodGroup && !medicalHistory && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-center space-y-2">
                <User className="h-7 w-7 mx-auto text-slate-300" />
                <p className="text-sm text-slate-500">Chưa có thông tin y tế bổ sung</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientInfoCard;

