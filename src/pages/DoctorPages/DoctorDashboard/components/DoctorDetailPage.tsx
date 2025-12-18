import React, { useState } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button, Input, Textarea } from '@/components/ui';
import { Stethoscope, ClipboardList, MessageSquare, User, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { doctorAPI } from '@/services';
import { queryKeys } from '@/services/queryClient';
import { formatDate, formatCurrency } from '../utils';
import { STATUS_BADGE } from '../constants';
import type { DoctorSummary, ExaminationSummary, TreatmentPlan, TreatmentPhase } from '@/types/doctor';
import { showNotification } from '@/components/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDoctorLV2 } from '@/utils/auth';
import { useAuth } from '@/hooks';

interface DoctorDetailPageProps {
  doctorId: string;
  doctor: DoctorSummary;
}

const DoctorDetailPage: React.FC<DoctorDetailPageProps> = ({ doctorId, doctor }) => {
  const { token } = useAuth();
  const isLV2 = isDoctorLV2(token);
  const queryClient = useQueryClient();
  const [selectedExaminationId, setSelectedExaminationId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});

  // Fetch examinations and treatment plans for this doctor
  const { data: examinations = [], isLoading: loadingExaminations } = useQuery({
    queryKey: queryKeys.doctor.examinationsByDoctor(doctorId),
    queryFn: () => doctorAPI.getExaminationsByDoctorId(doctorId),
  });

  const { data: treatmentPlans = [], isLoading: loadingPlans } = useQuery({
    queryKey: queryKeys.doctor.treatmentPlansByDoctor(doctorId),
    queryFn: () => doctorAPI.getTreatmentPlansByDoctorId(doctorId),
  });

  // Fetch phases for all treatment plans
  const phaseQueries = useQueries({
    queries: treatmentPlans.map((plan) => ({
      queryKey: queryKeys.doctor.treatmentPhases(plan.id),
      queryFn: () => doctorAPI.getTreatmentPhases(plan.id),
      enabled: !!plan.id,
    })),
  });

  const phasesByPlan: Record<string, TreatmentPhase[]> = {};
  treatmentPlans.forEach((plan, index) => {
    phasesByPlan[plan.id] = phaseQueries[index]?.data ?? [];
  });

  // Mutation for adding comment to examination
  const addExaminationCommentMutation = useMutation({
    mutationFn: ({ examinationId, comment }: { examinationId: string; comment: string }) =>
      doctorAPI.commentExamination(examinationId, comment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctor.examinationsByDoctor(doctorId) });
      setCommentText({ ...commentText, [`exam_${variables.examinationId}`]: '' });
      showNotification.success('Đã thêm nhận xét vào hồ sơ khám');
    },
    onError: (error: any) => {
      showNotification.error('Không thể thêm nhận xét', error?.message || 'Đã xảy ra lỗi');
    },
  });

  // Mutation for adding comment to treatment phase
  const addPhaseCommentMutation = useMutation({
    mutationFn: ({ phaseId, comment }: { phaseId: string; comment: string }) =>
      doctorAPI.commentTreatmentPhase(phaseId, comment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctor.treatmentPlansByDoctor(doctorId) });
      setCommentText({ ...commentText, [`phase_${variables.phaseId}`]: '' });
      showNotification.success('Đã thêm nhận xét vào tiến trình điều trị');
    },
    onError: (error: any) => {
      showNotification.error('Không thể thêm nhận xét', error?.message || 'Đã xảy ra lỗi');
    },
  });

  const handleAddExaminationComment = (examinationId: string) => {
    const comment = commentText[`exam_${examinationId}`]?.trim();
    if (!comment) {
      showNotification.error('Vui lòng nhập nhận xét');
      return;
    }
    addExaminationCommentMutation.mutate({ examinationId, comment });
  };

  const handleAddPhaseComment = (phaseId: string) => {
    const comment = commentText[`phase_${phaseId}`]?.trim();
    if (!comment) {
      showNotification.error('Vui lòng nhập nhận xét');
      return;
    }
    addPhaseCommentMutation.mutate({ phaseId, comment });
  };

  return (
    <div className="lg:col-span-2 space-y-4">
      {/* Doctor Info */}
      <Card className="border-none bg-white/90 shadow-medium">
        <CardHeader>
          <CardTitle className="text-lg">Thông tin bác sĩ</CardTitle>
          <CardDescription>Chi tiết thông tin bác sĩ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
                {doctor.fullName?.charAt(0).toUpperCase() || 'D'}
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-900">{doctor.fullName || '-'}</h4>
                {doctor.specialization && (
                  <p className="text-gray-600">{doctor.specialization}</p>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              {doctor.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-gray-900">{doctor.phone}</span>
                </div>
              )}
              {doctor.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-gray-900">{doctor.email}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Examinations */}
      <Card className="border-none bg-white/90 shadow-medium">
        <CardHeader>
          <CardTitle className="text-lg">Hồ sơ khám</CardTitle>
          <CardDescription>{examinations.length} hồ sơ khám</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingExaminations ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : examinations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-6 py-8 text-center">
              <p className="text-sm text-muted-foreground">Chưa có hồ sơ khám nào.</p>
            </div>
          ) : (
            examinations.map((exam) => (
              <div
                key={exam.id}
                className="rounded-2xl border border-border/70 bg-white/70 px-4 py-4 shadow-sm transition hover:shadow-medium"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base font-semibold text-foreground">
                        {exam.patientName || 'Bệnh nhân'}
                      </h3>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-600">
                        {formatDate(exam.createAt)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Chẩn đoán:</strong> {exam.diagnosis || '-'}
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Điều trị:</strong> {exam.treatment || '-'}
                    </p>
                    {exam.totalCost > 0 && (
                      <p className="text-sm font-medium text-primary">
                        Chi phí: {formatCurrency(exam.totalCost)}
                      </p>
                    )}
                    {exam.listComment && exam.listComment.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Nhận xét:</h5>
                        <div className="space-y-1">
                          {exam.listComment.map((comment, idx) => (
                            <p key={idx} className="text-xs text-gray-600">{comment}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    {isLV2 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Thêm nhận xét..."
                            value={commentText[`exam_${exam.id}`] || ''}
                            onChange={(e) =>
                              setCommentText({ ...commentText, [`exam_${exam.id}`]: e.target.value })
                            }
                            className="flex-1"
                            rows={2}
                          />
                          <Button
                            onClick={() => handleAddExaminationComment(exam.id)}
                            disabled={addExaminationCommentMutation.isPending}
                            variant="primary"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Gửi
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Treatment Plans */}
      <Card className="border-none bg-white/90 shadow-medium">
        <CardHeader>
          <CardTitle className="text-lg">Phác đồ điều trị</CardTitle>
          <CardDescription>{treatmentPlans.length} phác đồ điều trị</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingPlans ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : treatmentPlans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-6 py-8 text-center">
              <p className="text-sm text-muted-foreground">Chưa có phác đồ điều trị nào.</p>
            </div>
          ) : (
            treatmentPlans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl border border-border/70 bg-white/70 px-4 py-4 shadow-sm transition hover:shadow-medium"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base font-semibold text-foreground">{plan.title}</h3>
                      <Badge className={STATUS_BADGE[plan.status] || STATUS_BADGE.Inprogress}>
                        {plan.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {plan.patientName || 'Bệnh nhân'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(plan.createAt)}
                      </span>
                      <span className="font-medium text-primary">{formatCurrency(plan.totalCost)}</span>
                    </div>
                    {plan.notes && (
                      <div className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
                        <strong>Ghi chú:</strong> {plan.notes}
                      </div>
                    )}
                    {phasesByPlan[plan.id] && phasesByPlan[plan.id].length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Tiến trình điều trị:</h5>
                        <div className="space-y-2">
                          {phasesByPlan[plan.id].map((phase) => (
                            <div key={phase.id} className="rounded-lg bg-gray-50 p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">
                                  Tiến trình {phase.phaseNumber}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {phase.status || 'Đang thực hiện'}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 mb-2">{phase.description || '-'}</p>
                              {phase.cost > 0 && (
                                <p className="text-xs font-medium text-primary">
                                  Chi phí: {formatCurrency(phase.cost)}
                                </p>
                              )}
                              {phase.listComment && phase.listComment.length > 0 && (
                                <div className="mt-2 pt-2 border-t">
                                  <h6 className="text-xs font-medium text-gray-700 mb-1">Nhận xét:</h6>
                                  <div className="space-y-1">
                                    {phase.listComment.map((comment, idx) => (
                                      <p key={idx} className="text-xs text-gray-600">{comment}</p>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {isLV2 && (
                                <div className="mt-2 pt-2 border-t">
                                  <div className="flex gap-2">
                                    <Textarea
                                      placeholder="Thêm nhận xét..."
                                      value={commentText[`phase_${phase.id}`] || ''}
                                      onChange={(e) =>
                                        setCommentText({ ...commentText, [`phase_${phase.id}`]: e.target.value })
                                      }
                                      className="flex-1"
                                      rows={2}
                                    />
                                    <Button
                                      onClick={() => handleAddPhaseComment(phase.id)}
                                      disabled={addPhaseCommentMutation.isPending}
                                      variant="primary"
                                      size="sm"
                                    >
                                      <MessageSquare className="h-3 w-3 mr-1" />
                                      Gửi
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorDetailPage;

