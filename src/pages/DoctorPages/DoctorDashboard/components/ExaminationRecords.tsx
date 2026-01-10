import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button } from '@/components/ui';
import { FileText, Calendar, Stethoscope, DollarSign, Eye } from 'lucide-react';
import type { ExaminationSummary } from '@/types/doctor';
import { formatDate, formatCurrency } from '../utils';

interface ExaminationRecordsProps {
  examinations: ExaminationSummary[];
  onViewDetail?: (examination: ExaminationSummary) => void;
}

const ExaminationRecords: React.FC<ExaminationRecordsProps> = ({ examinations, onViewDetail }) => {
  if (examinations.length === 0) {
    return (
      <Card className="border-none bg-white/90 shadow-medium rounded-2xl h-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Hồ sơ khám
          </CardTitle>
          <CardDescription>Danh sách các lần khám bệnh</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">Chưa có hồ sơ khám</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none bg-white/90 shadow-medium rounded-2xl h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Hồ sơ khám
        </CardTitle>
        <CardDescription>Danh sách các lần khám bệnh ({examinations.length})</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto pr-2 space-y-3">
          {examinations.map((exam) => (
            <div
              key={exam.id}
              className={`rounded-xl border border-border/70 bg-white p-4 shadow-sm transition-all ${
                onViewDetail ? 'hover:shadow-md cursor-pointer hover:border-primary/50' : ''
              }`}
              onClick={() => onViewDetail?.(exam)}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-primary">
                      {formatDate(exam.createAt || exam.examined_at)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground line-clamp-1">
                    {exam.diagnosis || 'Chưa có chẩn đoán'}
                  </p>
                </div>
                {exam.totalCost > 0 && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex-shrink-0">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {formatCurrency(exam.totalCost)}
                  </Badge>
                )}
              </div>

              {/* Symptoms */}
              {exam.symptoms && (
                <div className="mb-2">
                  <div className="flex items-start gap-2">
                    <Stethoscope className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                        Triệu chứng
                      </p>
                      <p className="text-xs text-foreground line-clamp-2">{exam.symptoms}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Services */}
              {exam.listDentalServicesEntityOrder && exam.listDentalServicesEntityOrder.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Dịch vụ
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {exam.listDentalServicesEntityOrder.slice(0, 3).map((service, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[10px] bg-blue-50 text-blue-700">
                        {service.name}
                      </Badge>
                    ))}
                    {exam.listDentalServicesEntityOrder.length > 3 && (
                      <Badge variant="secondary" className="text-[10px] bg-gray-50 text-gray-600">
                        +{exam.listDentalServicesEntityOrder.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* View Detail Button */}
              {onViewDetail && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetail(exam);
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Xem chi tiết
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExaminationRecords;
