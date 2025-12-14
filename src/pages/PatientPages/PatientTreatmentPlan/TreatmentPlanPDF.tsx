import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { TreatmentPhase } from '@/types/doctor';
import type { DoctorSummary } from '@/types/doctor';
import type { NurseInfo } from '@/services/api/nurse';

interface TreatmentPlanApi {
  id: string;
  title: string;
  description: string;
  duration: string;
  notes: string;
  status: string;
  totalCost?: number;
  doctorFullname?: string;
  doctorId?: string;
  nurseId?: string;
  patientId?: string;
  createAt?: string;
}

// Đăng ký font Roboto từ Google Fonts
// Lưu ý: Link bạn copy là CSS link (https://fonts.googleapis.com/css2?...)
// Cần mở link đó trong browser để lấy URL trực tiếp đến file font (.woff2)
// Hoặc sử dụng URL trực tiếp từ fonts.gstatic.com như bên dưới
Font.register({
  family: 'Roboto',
  fonts: [
    {
      // Roboto Regular (400) - URL trực tiếp đến file font
      // Để lấy URL: Mở https://fonts.googleapis.com/css2?family=Roboto:wght@400 trong browser
      // Tìm @font-face và copy URL từ src: url('...')
      src: 'https://fonts.gstatic.com/s/roboto/v50/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWubEbVmbiArmlw.woff2',
      fontWeight: 400,
      fontStyle: 'normal',
    },
    {
      // Roboto Bold (700) - URL trực tiếp đến file font
      // Để lấy URL: Mở https://fonts.googleapis.com/css2?family=Roboto:wght@700 trong browser
      // Tìm @font-face và copy URL từ src: url('...')
      src: 'https://fonts.gstatic.com/s/roboto/v50/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWuYjalmbiArmlw.woff2',
      fontWeight: 700,
      fontStyle: 'normal',
    },
  ],
});

// Styles - Sử dụng font Roboto
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    padding: 40,
    fontSize: 10,
    lineHeight: 1.5,
  },
  header: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    padding: 20,
    marginBottom: 30,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 400,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 10,
    color: '#1F2937',
    borderBottom: '2 solid #3B82F6',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: '40%',
    fontWeight: 700,
    color: '#4B5563',
  },
  value: {
    width: '60%',
    color: '#111827',
  },
  fullRow: {
    marginBottom: 8,
  },
  phaseCard: {
    marginBottom: 15,
    padding: 10,
    border: '1 solid #E5E7EB',
    borderRadius: 4,
  },
  phaseTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 8,
    color: '#1F2937',
  },
  commentSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1 solid #E5E7EB',
  },
  commentTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 5,
    color: '#4B5563',
  },
  commentText: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 3,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#6B7280',
    borderTop: '1 solid #E5E7EB',
    paddingTop: 10,
  },
});

interface TreatmentPlanPDFProps {
  plan: TreatmentPlanApi;
  doctor?: DoctorSummary | null;
  nurse?: NurseInfo | null;
  phases: TreatmentPhase[];
}

const TreatmentPlanPDF: React.FC<TreatmentPlanPDFProps> = ({ plan, doctor, nurse, phases }) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      // Backend trả về định dạng dd/MM/yyyy
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        if (day && month && year) {
          return `${day}/${month}/${year}`;
        }
      }
      // Nếu là ISO string hoặc format khác
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('vi-VN');
      }
      return dateStr;
    } catch {
      return dateStr || '-';
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
  };

  const formatGender = (gender?: string) => {
    if (!gender) return '-';
    if (gender === 'male') return 'Nam';
    if (gender === 'female') return 'Nữ';
    return gender;
  };

  return (
    <Document
      title={`Phác đồ điều trị - ${plan.title}`}
      author="eDental System"
      subject="Phác đồ điều trị"
      creator="eDental"
      language="vi-VN"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>PHÁC ĐỒ ĐIỀU TRỊ</Text>
          <Text style={styles.subtitle}>eDental - Hệ thống quản lý phòng khám nha khoa</Text>
        </View>

        {/* Thông tin phác đồ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin phác đồ</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Tên phác đồ:</Text>
            <Text style={styles.value}>{plan.title || '-'}</Text>
          </View>
          <View style={styles.fullRow}>
            <Text style={styles.label}>Mô tả:</Text>
            <Text style={styles.value}>{plan.description || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Thời gian điều trị:</Text>
            <Text style={styles.value}>{plan.duration || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Trạng thái:</Text>
            <Text style={styles.value}>{plan.status || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tổng chi phí:</Text>
            <Text style={styles.value}>{formatCurrency(plan.totalCost)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Ngày tạo:</Text>
            <Text style={styles.value}>{formatDate(plan.createAt)}</Text>
          </View>
          {plan.notes && (
            <View style={styles.fullRow}>
              <Text style={styles.label}>Ghi chú:</Text>
              <Text style={styles.value}>{plan.notes}</Text>
            </View>
          )}
        </View>

        {/* Thông tin bác sĩ */}
        {doctor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin bác sĩ</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Họ và tên:</Text>
              <Text style={styles.value}>{doctor.fullName || '-'}</Text>
            </View>
            {doctor.specialization && (
              <View style={styles.row}>
                <Text style={styles.label}>Chuyên khoa:</Text>
                <Text style={styles.value}>{doctor.specialization}</Text>
              </View>
            )}
            {doctor.licenseNumber && (
              <View style={styles.row}>
                <Text style={styles.label}>Số giấy phép:</Text>
                <Text style={styles.value}>{doctor.licenseNumber}</Text>
              </View>
            )}
            {doctor.phone && (
              <View style={styles.row}>
                <Text style={styles.label}>Số điện thoại:</Text>
                <Text style={styles.value}>{doctor.phone}</Text>
              </View>
            )}
            {doctor.email && (
              <View style={styles.row}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{doctor.email}</Text>
              </View>
            )}
            {doctor.address && (
              <View style={styles.fullRow}>
                <Text style={styles.label}>Địa chỉ:</Text>
                <Text style={styles.value}>{doctor.address}</Text>
              </View>
            )}
            {doctor.gender && (
              <View style={styles.row}>
                <Text style={styles.label}>Giới tính:</Text>
                <Text style={styles.value}>{formatGender(doctor.gender)}</Text>
              </View>
            )}
            {doctor.dob && (
              <View style={styles.row}>
                <Text style={styles.label}>Ngày sinh:</Text>
                <Text style={styles.value}>{formatDate(doctor.dob)}</Text>
              </View>
            )}
            {doctor.yearsExperience !== undefined && doctor.yearsExperience !== null && (
              <View style={styles.row}>
                <Text style={styles.label}>Số năm kinh nghiệm:</Text>
                <Text style={styles.value}>{doctor.yearsExperience} năm</Text>
              </View>
            )}
          </View>
        )}

        {/* Thông tin y tá */}
        {nurse && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin y tá</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Họ và tên:</Text>
              <Text style={styles.value}>{nurse.fullName || '-'}</Text>
            </View>
            {nurse.phone && (
              <View style={styles.row}>
                <Text style={styles.label}>Số điện thoại:</Text>
                <Text style={styles.value}>{nurse.phone}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Trang ${pageNumber} / ${totalPages} - Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`
          }
          fixed
        />
      </Page>

      {/* Danh sách tiến trình - mỗi tiến trình có thể là một trang riêng */}
      {phases.map((phase, index) => (
        <Page key={phase.id || index} size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>TIẾN TRÌNH ĐIỀU TRỊ</Text>
            <Text style={styles.subtitle}>Tiến trình {phase.phaseNumber}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.phaseCard}>
              <Text style={styles.phaseTitle}>Thông tin tiến trình {phase.phaseNumber}</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Mô tả:</Text>
                <Text style={styles.value}>{phase.description || '-'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Ngày bắt đầu:</Text>
                <Text style={styles.value}>{formatDate(phase.startDate)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Ngày kết thúc:</Text>
                <Text style={styles.value}>{formatDate(phase.endDate)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Chi phí:</Text>
                <Text style={styles.value}>{formatCurrency(phase.cost)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Trạng thái:</Text>
                <Text style={styles.value}>{phase.status || '-'}</Text>
              </View>
              {phase.nextAppointment && (
                <View style={styles.row}>
                  <Text style={styles.label}>Lịch hẹn tiếp theo:</Text>
                  <Text style={styles.value}>{phase.nextAppointment}</Text>
                </View>
              )}

              {/* Nhận xét */}
              {phase.listComment && phase.listComment.length > 0 && (
                <View style={styles.commentSection}>
                  <Text style={styles.commentTitle}>Nhận xét:</Text>
                  {phase.listComment.map((comment, idx) => (
                    <Text key={idx} style={styles.commentText}>
                      • {comment}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Footer */}
          <Text
            style={styles.footer}
            render={({ pageNumber, totalPages }) =>
              `Trang ${pageNumber} / ${totalPages} - Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`
            }
            fixed
          />
        </Page>
      ))}
    </Document>
  );
};

export default TreatmentPlanPDF;

