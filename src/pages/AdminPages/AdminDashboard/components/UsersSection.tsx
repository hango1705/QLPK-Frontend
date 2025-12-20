import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button, Input } from '@/components/ui';
import { Search, User, Eye, Ban, CheckCircle, Filter, UserPlus, Stethoscope, Heart, TrendingUp } from 'lucide-react';
import type { UsersSectionProps } from '../types';
import { ROLE_BADGE, STATUS_BADGE } from '../constants';
import { cn } from '@/utils/cn';

const UsersSection: React.FC<UsersSectionProps> = ({
  users,
  onViewUser,
  onDisableUser,
  onEnableUser,
  onAddDoctor,
  onAddNurse,
  onUpdateDoctorLevel,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && !user.disable) || (statusFilter === 'disabled' && user.disable);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { all: users.length };
    users.forEach((user) => {
      const role = user.role || 'unknown';
      counts[role] = (counts[role] || 0) + 1;
    });
    return counts;
  }, [users]);

  const statusCounts = useMemo(() => {
    const active = users.filter((u) => !u.disable).length;
    const disabled = users.filter((u) => u.disable).length;
    return { all: users.length, active, disabled };
  }, [users]);

  return (
    <Card className="border-none bg-white/90 shadow-medium">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-lg">Quản lý người dùng</CardTitle>
          <CardDescription>Tổng {users.length} người dùng trong hệ thống</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/10 text-primary">
            {filteredUsers.length} kết quả
          </Badge>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onAddDoctor}
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Stethoscope className="mr-2 h-3.5 w-3.5" />
              Thêm bác sĩ
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onAddNurse}
              className="border-green-200 text-green-600 hover:bg-green-50"
            >
              <Heart className="mr-2 h-3.5 w-3.5" />
              Thêm y tá
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên, username, email, số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-border/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Tất cả vai trò ({roleCounts.all})</option>
              <option value="admin">Admin ({roleCounts.admin || 0})</option>
              <option value="doctor">Bác sĩ ({roleCounts.doctor || 0})</option>
              <option value="nurse">Y tá ({roleCounts.nurse || 0})</option>
              <option value="patient">Bệnh nhân ({roleCounts.patient || 0})</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Tất cả ({statusCounts.all})</option>
              <option value="active">Hoạt động ({statusCounts.active})</option>
              <option value="disabled">Vô hiệu hóa ({statusCounts.disabled})</option>
            </select>
          </div>
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            <User className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>Không tìm thấy người dùng nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-white/60 px-4 py-3 transition hover:shadow-medium"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {user.full_name || user.username || 'Chưa có tên'}
                      </p>
                      {user.role && (
                        <Badge className={cn('text-xs', ROLE_BADGE[user.role.toLowerCase()] || ROLE_BADGE.patient)}>
                          {user.role.toUpperCase()}
                        </Badge>
                      )}
                      <Badge
                        className={cn(
                          'text-xs',
                          user.disable ? STATUS_BADGE.disabled : STATUS_BADGE.active,
                        )}
                      >
                        {user.disable ? 'Vô hiệu hóa' : 'Hoạt động'}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="truncate">@{user.username}</span>
                      {user.email && <span className="truncate">{user.email}</span>}
                      {user.phone && <span>{user.phone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewUser(user)}
                    className="border-border/70"
                  >
                    <Eye className="mr-2 h-3.5 w-3.5" />
                    Xem
                  </Button>
                  {user.role && user.role.toLowerCase() === 'doctor' && onUpdateDoctorLevel && !user.disable && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateDoctorLevel(user.id)}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      title="Thăng chức bác sĩ lên cấp độ 2 (DOCTORLV2)"
                    >
                      <TrendingUp className="mr-2 h-3.5 w-3.5" />
                      Thăng chức
                    </Button>
                  )}
                  {user.disable ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEnableUser(user.id)}
                      className="border-green-200 text-green-600 hover:bg-green-50"
                    >
                      <CheckCircle className="mr-2 h-3.5 w-3.5" />
                      Kích hoạt
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDisableUser(user.id)}
                      className="border-rose-200 text-rose-600 hover:bg-rose-50"
                    >
                      <Ban className="mr-2 h-3.5 w-3.5" />
                      Vô hiệu
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UsersSection;

