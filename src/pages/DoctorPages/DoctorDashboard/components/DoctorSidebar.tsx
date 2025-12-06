import React from 'react';
import { Button } from '@/components/ui';
import { Sparkles, Menu } from 'lucide-react';
import { SECTION_CONFIG, SECTION_ORDER } from '../constants';
import type { DoctorSidebarProps, Section } from '../types';
import { cn } from '@/utils/cn';

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
          <Sparkles className="h-5 w-5" />
        </div>
        {!isCollapsed && (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">DentalCARE</p>
            <p className="text-base font-semibold text-foreground">Doctor Workspace</p>
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
      {SECTION_ORDER.map((section) => {
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

    <div className="mt-auto border-t border-border/80 px-5 py-6">
      <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 text-sm leading-relaxed text-muted-foreground">
        <p className="font-semibold text-primary">Gợi ý nhanh</p>
        <p>Tạo kết quả khám hoặc tiến trình điều trị ngay khi hoàn tất hẹn.</p>
        <Button
          variant="ghost"
          className="mt-3 h-10 w-full border border-primary/40 text-primary hover:bg-primary/10"
          onClick={onCreateExam}
          disabled={!scheduledCount}
        >
          Ghi nhận khám
        </Button>
      </div>
    </div>
  </aside>
);

export default DoctorSidebar;

