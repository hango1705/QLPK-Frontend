import React from 'react';
import { Button } from '@/components/ui';
import { LogOut, User, Bell } from 'lucide-react';
import type { DoctorHeaderProps } from '../types';
import { cn } from '@/utils/cn';

const DoctorHeader: React.FC<DoctorHeaderProps> = ({ profile, activeSection, onLogout }) => {
  const avatarInitial = (profile?.fullName || profile?.username || 'B')
    .charAt(0)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 shadow-sm lg:px-6 min-w-0">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <h1 className="text-xl font-semibold text-gray-900 truncate">{activeSection}</h1>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {/* User Profile Section */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white font-semibold text-sm">
              {avatarInitial}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">
                {profile?.fullName || profile?.username || 'Bác sĩ'}
              </span>
              <span className="text-xs text-gray-600">Bác sĩ</span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          className={cn(
            'border-gray-300 text-gray-700 transition hover:bg-gray-50 hover:border-gray-400',
          )}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </Button>
      </div>
    </header>
  );
};

export default DoctorHeader;
