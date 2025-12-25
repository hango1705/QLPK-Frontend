import React from 'react';
import { Menu } from 'lucide-react';
import { SECTION_CONFIG, SECTION_ORDER } from '../constants';
import type { DoctorSidebarProps, Section } from '../types';
import { cn } from '@/utils/cn';
import { isDoctorLV2 } from '@/utils/auth';
import { useAuth } from '@/hooks';
import logo from '@/assets/logo.png';

interface SidebarProps extends DoctorSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  scheduledCount: number;
}

const DoctorSidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSectionChange,
  onCreateExam,
  isCollapsed,
  onToggleCollapse,
  scheduledCount,
}) => {
  const { token } = useAuth();
  const isLV2 = isDoctorLV2(token);

  // Filter sections based on role
  const visibleSections = SECTION_ORDER.filter((section) => {
    // Only show 'doctors' section for DOCTORLV2
    if (section === 'doctors' && !isLV2) {
      return false;
    }
    // Show 'nurses' section for both DOCTOR and DOCTORLV2
    // (no filter needed, already visible for both)
    return true;
  });

  return (
  <aside
    className={cn(
      'relative hidden flex-col border-r border-border/60 bg-white/80 backdrop-blur lg:flex transition-all duration-300 overflow-hidden flex-shrink-0',
      isCollapsed ? 'w-20' : 'w-72',
    )}
  >
    <div className={cn(
      "flex items-center py-5",
      isCollapsed ? "px-3 justify-center" : "px-6 justify-between"
    )}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <img 
          src={logo} 
          alt="eDental Logo" 
          className="h-10 w-auto object-contain flex-shrink-0"
        />
        {!isCollapsed && (
          <span className="text-base font-semibold text-foreground whitespace-nowrap">Trang bác sĩ</span>
        )}
      </div>
      <button
        type="button"
        className="rounded-full p-2 text-muted-foreground transition hover:bg-muted flex-shrink-0"
        onClick={onToggleCollapse}
      >
        <Menu className="h-4 w-4" />
      </button>
    </div>

    <div className="flex-1 space-y-1 px-3">
      {visibleSections.map((section) => {
        const { label } = SECTION_CONFIG[section];
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
              <span className="text-sm font-semibold">{label}</span>
            )}
          </button>
        );
      })}
    </div>
  </aside>
  );
};

export default DoctorSidebar;

