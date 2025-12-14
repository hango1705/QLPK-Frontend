import React from 'react';
import type { Section } from './types';
import {
  LayoutDashboard,
  ClipboardList,
  CalendarClock,
  Users,
  Stethoscope,
  User,
  KeyRound,
} from 'lucide-react';

export const SECTION_CONFIG: Record<
  Section,
  { label: string; description: string; icon: React.ReactNode }
> = {
  overview: {
    label: 'Tổng quan',
    description: 'Tình hình chung & hoạt động',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  treatment: {
    label: 'Phác đồ',
    description: 'Theo dõi kế hoạch điều trị',
    icon: <ClipboardList className="h-4 w-4" />,
  },
  appointments: {
    label: 'Lịch hẹn',
    description: 'Xem lịch hẹn của bác sĩ',
    icon: <CalendarClock className="h-4 w-4" />,
  },
  patients: {
    label: 'Bệnh nhân',
    description: 'Thông tin bệnh nhân',
    icon: <Users className="h-4 w-4" />,
  },
  doctors: {
    label: 'Bác sĩ',
    description: 'Danh sách bác sĩ',
    icon: <Stethoscope className="h-4 w-4" />,
  },
  profile: {
    label: 'Thông tin cá nhân',
    description: 'Quản lý thông tin cá nhân',
    icon: <User className="h-4 w-4" />,
  },
  account: {
    label: 'Tài khoản',
    description: 'Quản lý tài khoản & mật khẩu',
    icon: <KeyRound className="h-4 w-4" />,
  },
};

// Định nghĩa thứ tự hiển thị trong sidebar
export const SECTION_ORDER: Section[] = [
  'overview',
  'treatment',
  'appointments',
  'patients',
  'doctors',
  'profile',
  'account',
];

export const STATUS_BADGE: Record<string, string> = {
  Scheduled: 'bg-blue-50 text-blue-600 border border-blue-100',
  Done: 'bg-green-50 text-green-600 border border-green-100',
  Cancel: 'bg-rose-50 text-rose-600 border border-rose-100',
  Inprogress: 'bg-amber-50 text-amber-600 border border-amber-100',
};

