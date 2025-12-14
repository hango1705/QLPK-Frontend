import React from 'react';
import { Button, ScrollArea } from '@/components/ui';
import { SECTION_CONFIG } from '../constants';
import type { PatientSidebarProps, Section } from '../types';
import { cn } from '@/utils/cn';

const PatientSidebar: React.FC<PatientSidebarProps> = ({
  activeSection,
  onSectionChange,
  isCollapsed,
  onToggleCollapse,
  sidebarOpen,
  onToggleSidebar,
}) => {
  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      onToggleCollapse();
    } else {
      onToggleSidebar();
    }
  };

  return (
    <aside
      className={cn(
        'fixed lg:sticky top-16 z-40 h-[calc(100vh-4rem)] border-r border-border bg-background transition-all duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
        isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      <ScrollArea className="h-full py-6 px-3">
        <nav className="space-y-2">
          {(Object.keys(SECTION_CONFIG) as Section[]).map((section) => {
            const { label, icon } = SECTION_CONFIG[section];
            const isActive = activeSection === section;
            return (
              <Button
                key={section}
                variant={isActive ? 'primary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3',
                  isCollapsed ? 'justify-center px-0' : '',
                  isActive ? 'bg-primary/5' : 'hover:bg-primary/10',
                )}
                onClick={() => onSectionChange(section)}
                title={isCollapsed ? label : ''}
              >
                <span className="h-5 w-5">{icon}</span>
                {!isCollapsed && label}
              </Button>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
};

export default PatientSidebar;

