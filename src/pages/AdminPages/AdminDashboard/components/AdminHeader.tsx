import React from 'react';
import { Button } from '@/components/ui';
import { LogOut, User } from 'lucide-react';
import type { AdminHeaderProps } from '../types';
import { cn } from '@/utils/cn';

const AdminHeader: React.FC<AdminHeaderProps> = ({ profile, activeSection, onLogout }) => (
  <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-white/90 px-4 py-4 backdrop-blur-sm lg:px-6 min-w-0">
    <div className="flex items-center gap-4 min-w-0 flex-1">
      <h1 className="text-xl font-semibold text-foreground truncate">{activeSection}</h1>
    </div>

    <div className="flex items-center gap-3 flex-shrink-0">
      <div className="hidden items-center gap-3 md:flex">
        <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
            <User className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-primary">
              {profile?.fullName || profile?.username || 'Admin'}
            </span>
            <span className="text-[10px] text-primary/70">Quản trị viên</span>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onLogout}
        className={cn(
          'border-border/70 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30',
        )}
      >
        <LogOut className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Đăng xuất</span>
      </Button>
    </div>
  </header>
);

export default AdminHeader;

