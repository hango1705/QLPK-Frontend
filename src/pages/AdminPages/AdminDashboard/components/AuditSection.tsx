import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Input } from '@/components/ui';
import { Search, Activity, Calendar, User, Filter } from 'lucide-react';
import type { AuditSectionProps } from '../types';
import { cn } from '@/utils/cn';

const AuditSection: React.FC<AuditSectionProps> = ({ logs, onFilter, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Extract unique usernames and actions for filters
  const uniqueUsernames = useMemo(() => {
    const usernames = new Set(logs.map((log) => log.username));
    return Array.from(usernames).sort();
  }, [logs]);

  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map((log) => log.action));
    return Array.from(actions).sort();
  }, [logs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.id?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesUsername = !usernameFilter || log.username === usernameFilter;
      const matchesAction = !actionFilter || log.action === actionFilter;

      let matchesDate = true;
      if (dateFilter) {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        matchesDate = logDate === dateFilter;
      }

      return matchesSearch && matchesUsername && matchesAction && matchesDate;
    });
  }, [logs, searchQuery, usernameFilter, actionFilter, dateFilter]);

  // Group logs by date
  const groupedLogs = useMemo(() => {
    const groups: Record<string, typeof logs> = {};
    filteredLogs.forEach((log) => {
      const date = new Date(log.timestamp).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(log);
    });
    return groups;
  }, [filteredLogs]);

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionBadgeColor = (action: string) => {
    if (action?.toLowerCase().includes('đăng nhập') || action?.toLowerCase().includes('login')) {
      return 'bg-green-50 text-green-600 border-green-100';
    }
    if (action?.toLowerCase().includes('đăng xuất') || action?.toLowerCase().includes('logout')) {
      return 'bg-gray-50 text-gray-600 border-gray-100';
    }
    if (action?.toLowerCase().includes('tạo') || action?.toLowerCase().includes('create')) {
      return 'bg-blue-50 text-blue-600 border-blue-100';
    }
    if (action?.toLowerCase().includes('cập nhật') || action?.toLowerCase().includes('update')) {
      return 'bg-amber-50 text-amber-600 border-amber-100';
    }
    if (action?.toLowerCase().includes('xóa') || action?.toLowerCase().includes('delete')) {
      return 'bg-rose-50 text-rose-600 border-rose-100';
    }
    return 'bg-purple-50 text-purple-600 border-purple-100';
  };

  return (
    <Card className="border-none bg-white/90 shadow-medium">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-lg">Nhật ký hệ thống</CardTitle>
          <CardDescription>Tổng {logs.length} bản ghi hoạt động</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/10 text-primary">
            {filteredLogs.length} kết quả
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo username, action, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <select
              value={usernameFilter}
              onChange={(e) => setUsernameFilter(e.target.value)}
              className="rounded-xl border border-border/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Tất cả người dùng</option>
              {uniqueUsernames.map((username) => (
                <option key={username} value={username}>
                  {username}
                </option>
              ))}
            </select>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="rounded-xl border border-border/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Tất cả hành động</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-border/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Logs List */}
        {isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            <Activity className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>Không tìm thấy bản ghi nào</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedLogs)
              .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
              .map(([date, dateLogs]) => (
                <div key={date} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">{date}</h3>
                    <Badge variant="outline" className="text-xs">
                      {dateLogs.length} bản ghi
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {dateLogs
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((log, index) => (
                        <div
                          key={log.id || `${log.username}-${log.timestamp}-${index}`}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-white/60 px-4 py-3 transition hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Activity className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={cn('text-xs', getActionBadgeColor(log.action))}>
                                  {log.action}
                                </Badge>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  <span>{log.username}</span>
                                </div>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatDateTime(log.timestamp)}
                              </p>
                            </div>
                          </div>
                          {log.id && (
                            <div className="text-xs text-muted-foreground font-mono">
                              {log.id.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditSection;

