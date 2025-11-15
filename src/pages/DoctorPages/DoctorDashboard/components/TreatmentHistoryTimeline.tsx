import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from '@/components/ui';
import { Clock, CheckCircle2, Hourglass, Activity, FileText, User } from 'lucide-react';
import { formatDate, formatDateTime } from '../utils';
// Note: Install react-vertical-timeline-component if available: npm install react-vertical-timeline-component
// For now using custom vertical timeline implementation

interface TreatmentHistoryItem {
  id: string;
  date: string;
  condition: string;
  treatment: string;
  dentist: string;
  notes?: string;
  status: 'done' | 'pending' | 'in-progress';
  type: 'examination' | 'phase';
}

interface TreatmentHistoryTimelineProps {
  treatments: TreatmentHistoryItem[];
}

const TreatmentHistoryTimeline: React.FC<TreatmentHistoryTimelineProps> = ({ treatments }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <Activity className="h-5 w-5 text-blue-600" />;
      case 'pending':
        return <Hourglass className="h-5 w-5 text-amber-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-50 text-green-600 border-green-100';
      case 'in-progress':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'pending':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'done':
        return 'Hoàn thành';
      case 'in-progress':
        return 'Đang điều trị';
      case 'pending':
        return 'Chờ xử lý';
      default:
        return 'Chưa xác định';
    }
  };

  const formatDateLabel = (date: string) => {
    if (!date) return 'Chưa có ngày';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;
      
      const monthNames = ['Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6', 'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'];
      const day = d.getDate();
      const month = monthNames[d.getMonth()];
      return `${day} ${month}`;
    } catch {
      return date;
    }
  };

  if (treatments.length === 0) {
    return (
      <Card className="border-none bg-white/90 shadow-medium rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Lịch sử điều trị</CardTitle>
          <CardDescription>Timeline các lần khám và điều trị</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">Chưa có lịch sử điều trị</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none bg-white/90 shadow-medium rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Lịch sử điều trị</CardTitle>
        <CardDescription>Timeline các lần khám và điều trị</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200" />

          {/* Timeline items */}
          <div className="space-y-6">
            {treatments.map((treatment, index) => (
              <div key={treatment.id} className="relative flex gap-4">
                {/* Icon */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border-2 border-blue-500 shadow-md">
                    {getStatusIcon(treatment.status)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="rounded-xl border border-border/70 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-primary">
                            {formatDateLabel(treatment.date)}
                          </span>
                          {treatment.type === 'examination' && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                              Khám bệnh
                            </Badge>
                          )}
                          {treatment.type === 'phase' && (
                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200">
                              Tiến trình
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(treatment.date) || 'Chưa có ngày'}
                        </p>
                      </div>
                      <Badge className={`text-xs ${getStatusBadge(treatment.status)}`}>
                        {getStatusLabel(treatment.status)}
                      </Badge>
                    </div>

                    {/* Condition */}
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Tình trạng
                      </p>
                      <p className="text-sm font-medium text-foreground">{treatment.condition}</p>
                    </div>

                    {/* Treatment */}
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Phương pháp điều trị
                      </p>
                      <p className="text-sm text-foreground">{treatment.treatment}</p>
                    </div>

                    {/* Dentist */}
                    <div className="mb-2 flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Bác sĩ:</span> {treatment.dentist}
                      </p>
                    </div>

                    {/* Notes */}
                    {treatment.notes && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="flex items-start gap-2">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                              Ghi chú
                            </p>
                            <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                              {treatment.notes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TreatmentHistoryTimeline;

