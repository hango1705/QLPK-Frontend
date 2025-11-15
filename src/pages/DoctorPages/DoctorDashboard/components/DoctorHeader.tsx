import React from 'react';
import { Button, Avatar, AvatarFallback, AvatarImage } from '@/components/ui';
import { Bell, LogOut } from 'lucide-react';
import type { DoctorHeaderProps } from '../types';

interface HeaderProps extends DoctorHeaderProps {
  onSearchToggle?: () => void;
}

const DoctorHeader: React.FC<HeaderProps> = ({
  profile,
  activeSection,
  scheduledCount,
  onLogout,
}) => (
  <header className="flex flex-col gap-4 border-b border-border/70 bg-white/80 px-4 py-4 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
    <div>
      <p className="text-sm text-muted-foreground">Xin chào,</p>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {profile?.fullName || profile?.username || 'Bác sĩ'}
      </h1>
      <p className="text-sm text-muted-foreground">{activeSection}</p>
    </div>
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="flex items-center rounded-2xl border border-border/70 bg-white px-3 py-2">
        <input
          placeholder="Tìm bệnh nhân, lịch hẹn, phác đồ..."
          className="ml-2 w-full border-none bg-transparent text-sm focus:outline-none focus:ring-0"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="relative rounded-2xl border border-border/70 bg-white p-3 text-muted-foreground transition hover:text-primary"
        >
          <Bell className="h-4 w-4" />
          {scheduledCount > 0 && (
            <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-primary text-[10px] font-semibold text-white">
              {scheduledCount}
            </span>
          )}
        </button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-border/70 text-muted-foreground hover:text-destructive"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </Button>
        <Avatar className="h-11 w-11 border-2 border-primary/20 shadow-md">
          <AvatarImage src="" alt="doctor avatar" />
          <AvatarFallback>DR</AvatarFallback>
        </Avatar>
      </div>
    </div>
  </header>
);

export default DoctorHeader;

