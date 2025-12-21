import React from 'react';
import type { Section } from './types';
import {
  Home,
  User,
  FileText,
  Clipboard,
  TrendingUp,
  DollarSign,
  Calendar,
  CalendarDays,
  Settings,
} from 'lucide-react';

export const SECTION_CONFIG: Record<
  Section,
  { label: string; description: string; icon: React.ReactNode }
> = {
  overview: {
    label: 'Tổng quan',
    description: 'Thông tin tổng hợp & hoạt động gần đây',
    icon: <Home className="h-4 w-4" />,
  },
  basic: {
    label: 'Thông tin cơ bản',
    description: 'Quản lý thông tin cá nhân',
    icon: <User className="h-4 w-4" />,
  },
  initial: {
    label: 'Hồ sơ khám',
    description: 'Xem hồ sơ khám',
    icon: <FileText className="h-4 w-4" />,
  },
  plan: {
    label: 'Phác đồ điều trị',
    description: 'Xem phác đồ điều trị',
    icon: <Clipboard className="h-4 w-4" />,
  },
  payment: {
    label: 'Thanh toán',
    description: 'Lịch sử thanh toán & hóa đơn',
    icon: <DollarSign className="h-4 w-4" />,
  },
  appointment: {
    label: 'Đặt lịch hẹn',
    description: 'Đặt lịch hẹn mới',
    icon: <Calendar className="h-4 w-4" />,
  },
  appointments: {
    label: 'Xem lịch hẹn',
    description: 'Xem và quản lý lịch hẹn',
    icon: <CalendarDays className="h-4 w-4" />,
  },
  account: {
    label: 'Tài khoản',
    description: 'Cài đặt tài khoản',
    icon: <Settings className="h-4 w-4" />,
  },
};

// Định nghĩa thứ tự hiển thị trong sidebar
export const SECTION_ORDER: Section[] = [
  'overview',
  'basic',
  'initial',
  'plan',
  'payment',
  'appointment',
  'appointments',
  'account',
];

export const STATUS_BADGE: Record<string, string> = {
  Scheduled: 'bg-blue-50 text-blue-600 border border-blue-100',
  Done: 'bg-green-50 text-green-600 border border-green-100',
  Cancel: 'bg-rose-50 text-rose-600 border border-rose-100',
  Inprogress: 'bg-amber-50 text-amber-600 border border-amber-100',
  completed: 'bg-green-50 text-green-600 border border-green-100',
  'in-progress': 'bg-yellow-50 text-yellow-600 border border-yellow-100',
  planned: 'bg-blue-50 text-blue-600 border border-blue-100',
  active: 'bg-green-50 text-green-600 border border-green-100',
  expired: 'bg-gray-50 text-gray-600 border border-gray-100',
};

