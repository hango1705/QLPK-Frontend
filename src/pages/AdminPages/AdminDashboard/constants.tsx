import React from 'react';
import type { Section } from './types';
import {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  Settings,
  Activity,
  Package,
  Pill,
  FolderTree,
} from 'lucide-react';

export const SECTION_CONFIG: Record<
  Section,
  { label: string; description: string; icon: React.ReactNode }
> = {
  overview: {
    label: 'Tổng quan',
    description: 'Thống kê & hoạt động hệ thống',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  users: {
    label: 'Người dùng',
    description: 'Quản lý tài khoản & phân quyền',
    icon: <Users className="h-4 w-4" />,
  },
  roles: {
    label: 'Vai trò',
    description: 'Quản lý roles & permissions',
    icon: <Shield className="h-4 w-4" />,
  },
  audit: {
    label: 'Nhật ký',
    description: 'Xem lịch sử hoạt động hệ thống',
    icon: <Activity className="h-4 w-4" />,
  },
  clinic: {
    label: 'Phòng khám',
    description: 'Quản lý dịch vụ & danh mục',
    icon: <Package className="h-4 w-4" />,
  },
  settings: {
    label: 'Cài đặt',
    description: 'Cấu hình hệ thống',
    icon: <Settings className="h-4 w-4" />,
  },
};

export const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-primary/10 text-primary border border-primary/20',
  doctor: 'bg-blue-50 text-blue-600 border border-blue-100',
  nurse: 'bg-green-50 text-green-600 border border-green-100',
  patient: 'bg-gray-50 text-gray-600 border border-gray-100',
};

export const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-50 text-green-600 border border-green-100',
  disabled: 'bg-rose-50 text-rose-600 border border-rose-100',
};

