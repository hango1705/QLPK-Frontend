import React from 'react';
import { Button, Avatar, AvatarFallback, AvatarImage } from '@/components/ui';
import { LogOut, Phone } from 'lucide-react';
import type { NurseHeaderProps } from '../types';

const NurseHeader: React.FC<NurseHeaderProps> = ({ profile, nurseInfo, activeSection, onLogout }) => {
  const displayName = nurseInfo?.fullName || profile?.fullName || profile?.username || 'Y tá';
  const displayPhone = nurseInfo?.phone;

  return (
    <header className="flex flex-col gap-4 border-b border-border/70 bg-white/80 px-4 py-4 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Xin chào,</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {displayName}
        </h1>
        {displayPhone && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            <span>{displayPhone}</span>
          </div>
        )}
        <p className="text-sm text-muted-foreground">{activeSection}</p>
      </div>
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="flex items-center rounded-2xl border border-border/70 bg-white px-3 py-2">
        <input
          placeholder="Tìm bệnh nhân, phác đồ, bác sĩ..."
          className="ml-2 w-full border-none bg-transparent text-sm focus:outline-none focus:ring-0"
        />
      </div>
      <div className="flex items-center gap-2">
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
          <AvatarImage src="" alt="nurse avatar" />
          <AvatarFallback>
            {displayName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || 'NS'}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  </header>
  );
};

export default NurseHeader;

