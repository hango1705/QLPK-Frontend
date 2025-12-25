import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Input } from '@/components/ui';
import { Search, Heart, Mail, Phone, ClipboardList } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { TreatmentPlan } from '@/types/doctor';
import type { NurseInfo } from '@/services/api/nurse';

interface NurseWithPlans extends NurseInfo {
  assignedPlans: TreatmentPlan[];
}

interface NursesSectionProps {
  nurses: NurseWithPlans[];
  isLoading?: boolean;
}

const NursesSection: React.FC<NursesSectionProps> = ({ nurses, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNurses = useMemo(() => {
    return nurses.filter((nurse) => {
      const matchesSearch =
        nurse.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nurse.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nurse.phone?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [nurses, searchQuery]);

  const avatarOf = (name?: string) => {
    const ch = (name || '?').trim().charAt(0).toUpperCase();
    return ch || 'N';
  };

  return (
    <Card className="border-none bg-white/90 shadow-medium">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-lg">Danh sách y tá</CardTitle>
          <CardDescription>Tổng {nurses.length} y tá trong hệ thống</CardDescription>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary">
          {filteredNurses.length} kết quả
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Nurses List */}
        {isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          </div>
        ) : filteredNurses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            <Heart className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>Không tìm thấy y tá nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNurses.map((nurse) => (
              <div
                key={nurse.id}
                className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-white/60 px-4 py-4 transition hover:shadow-medium"
              >
                {/* Nurse Info */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700 font-semibold text-lg flex-shrink-0">
                    {avatarOf(nurse.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-base font-semibold text-foreground">
                        {nurse.fullName || 'Chưa có tên'}
                      </p>
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        Y TÁ
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {nurse.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate">{nurse.email}</span>
                        </div>
                      )}
                      {nurse.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{nurse.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assigned Treatment Plans */}
                {nurse.assignedPlans && nurse.assignedPlans.length > 0 ? (
                  <div className="border-t border-border/50 pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <ClipboardList className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">
                        Phác đồ được giao ({nurse.assignedPlans.length})
                      </p>
                    </div>
                    <div className="space-y-2">
                      {nurse.assignedPlans.map((plan) => (
                        <div
                          key={plan.id}
                          className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {plan.title || 'Không có tiêu đề'}
                            </p>
                            {plan.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                {plan.description}
                              </p>
                            )}
                          </div>
                          {plan.status && (
                            <Badge
                              className={cn(
                                'text-xs ml-2 flex-shrink-0',
                                plan.status.toLowerCase().includes('hoàn')
                                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                                  : plan.status.toLowerCase().includes('tạm')
                                  ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                  : 'bg-green-100 text-green-700 border-green-200'
                              )}
                            >
                              {plan.status}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-border/50 pt-3">
                    <p className="text-sm text-muted-foreground italic">
                      Chưa có phác đồ nào được giao
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NursesSection;

