import React from 'react';
import { Button } from '@/components/ui';
import { Shield, Menu } from 'lucide-react';
import { SECTION_CONFIG } from '../constants';
import type { AdminSidebarProps, Section } from '../types';
import { cn } from '@/utils/cn';

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeSection,
  onSectionChange,
  isCollapsed,
  onToggleCollapse,
}) => (
  <aside
    className={cn(
      'relative hidden flex-col border-r border-border/60 bg-white/80 backdrop-blur lg:flex transition-all duration-300',
      isCollapsed ? 'w-20' : 'w-72',
    )}
  >
    <div className="flex items-center justify-between px-6 py-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Shield className="h-5 w-5" />
        </div>
        {!isCollapsed && (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">DentalCARE</p>
            <p className="text-base font-semibold text-foreground">Admin Panel</p>
          </div>
        )}
      </div>
      <button
        type="button"
        className="rounded-full p-2 text-muted-foreground transition hover:bg-muted"
        onClick={onToggleCollapse}
      >
        <Menu className="h-4 w-4" />
      </button>
    </div>

    <div className="flex-1 space-y-1 px-3">
      {(Object.keys(SECTION_CONFIG) as Section[]).map((section) => {
        const { label, description } = SECTION_CONFIG[section];
        const isActive = activeSection === section;
        return (
          <button
            key={section}
            type="button"
            onClick={() => onSectionChange(section)}
            className={cn(
              'group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200',
              isActive ? 'bg-primary text-white shadow-glow' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            <span
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl border',
                isActive ? 'border-white/40 bg-white/10' : 'border-border/80 bg-white text-muted-foreground group-hover:text-foreground',
              )}
            >
              {SECTION_CONFIG[section].icon}
            </span>
            {!isCollapsed && (
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-[11px] text-muted-foreground">{description}</span>
              </span>
            )}
          </button>
        );
      })}
    </div>

    {!isCollapsed && (
      <div className="border-t border-border/60 p-4">
        <div className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-dashed border-primary/30 p-3 text-center">
          <p className="text-xs font-medium text-primary">Quản trị hệ thống</p>
          <p className="mt-1 text-[10px] text-primary/70">Toàn quyền truy cập</p>
        </div>
      </div>
    )}
  </aside>
);

export default AdminSidebar;

