import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import type { ExaminationDetail } from '../PatientInitialExamination';
import type { DentalServiceOrder, PrescriptionOrder } from '@/types/doctor';

// Import font files as URLs using Vite's ?url suffix
import BeVietnamProRegular from '@/fonts/Be_Vietnam_Pro/BeVietnamPro-Regular.ttf?url';
import BeVietnamProMedium from '@/fonts/Be_Vietnam_Pro/BeVietnamPro-Medium.ttf?url';
import BeVietnamProBold from '@/fonts/Be_Vietnam_Pro/BeVietnamPro-Bold.ttf?url';

// Register Be Vietnam Pro font family
Font.register({
  family: 'BeVietnamPro',
  fonts: [
    {
      src: BeVietnamProRegular,
      fontWeight: 400,
      fontStyle: 'normal',
    },
    {
      src: BeVietnamProMedium,
      fontWeight: 500,
      fontStyle: 'normal',
    },
    {
      src: BeVietnamProBold,
      fontWeight: 700,
      fontStyle: 'normal',
    },
  ],
});

// Styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'BeVietnamPro',
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
  serviceCard: {
    marginBottom: 10,
    padding: 10,
    border: '1 solid #E5E7EB',
    borderRadius: 4,
    backgroundColor: '#F9FAFB',
  },
  serviceName: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 5,
    color: '#1F2937',
  },
  serviceDetail: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 3,
  },
  prescriptionCard: {
    marginBottom: 10,
    padding: 10,
    border: '1 solid #E5E7EB',
    borderRadius: 4,
    backgroundColor: '#F9FAFB',
  },
  prescriptionName: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 5,
    color: '#1F2937',
  },
  prescriptionDetail: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 3,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  imageContainer: {
    width: '30%',
    marginRight: '3%',
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 100,
    objectFit: 'cover',
    borderRadius: 4,
  },
  imageLabel: {
    fontSize: 8,
    color: '#6B7280',
    marginTop: 5,
    textAlign: 'center',
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
  costBox: {
    backgroundColor: '#ECFDF5',
    padding: 15,
    borderRadius: 4,
    marginTop: 10,
    border: '1 solid #10B981',
  },
  costLabel: {
    fontSize: 10,
    color: '#059669',
    marginBottom: 5,
  },
  costValue: {
    fontSize: 18,
    fontWeight: 700,
    color: '#047857',
  },
});

interface ExaminationPDFProps {
  examination: ExaminationDetail;
}

const ExaminationPDF: React.FC<ExaminationPDFProps> = ({ examination }) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      if (dateStr.includes('/')) {
        return dateStr;
      }
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

  const getImageTypeLabel = (type: string) => {
    switch (type) {
      case 'examinationTeeth':
        return 'Ảnh răng';
      case 'examinationFace':
        return 'Ảnh mặt';
      case 'examinationXray':
        return 'Ảnh X-quang';
      default:
        return type;
    }
  };

  // Group images by type
  const teethImages = (examination.listImage || []).filter(img => img.type === 'examinationTeeth');
  const faceImages = (examination.listImage || []).filter(img => img.type === 'examinationFace');
  const xrayImages = (examination.listImage || []).filter(img => img.type === 'examinationXray');

  return (
    <Document
      title={`Hồ sơ khám - ${examination.createAt || ''}`}
      author="eDental System"
      subject="Hồ sơ khám bệnh"
      creator="eDental"
      language="vi-VN"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>HỒ SƠ KHÁM BỆNH</Text>
          <Text style={styles.subtitle}>eDental - Hệ thống quản lý phòng khám nha khoa</Text>
        </View>

        {/* Thông tin cơ bản */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khám bệnh</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Ngày khám:</Text>
            <Text style={styles.value}>{formatDate(examination.createAt)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Bác sĩ:</Text>
            <Text style={styles.value}>{examination.examined_at || 'Chưa xác định'}</Text>
          </View>
        </View>

        {/* Triệu chứng */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Triệu chứng</Text>
          <View style={styles.fullRow}>
            <Text style={styles.value}>{examination.symptoms || 'Không có thông tin'}</Text>
          </View>
        </View>

        {/* Chẩn đoán */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chẩn đoán</Text>
          <View style={styles.fullRow}>
            <Text style={styles.value}>{examination.diagnosis || 'Không có thông tin'}</Text>
          </View>
        </View>

        {/* Điều trị */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Điều trị</Text>
          <View style={styles.fullRow}>
            <Text style={styles.value}>{examination.treatment || 'Không có thông tin'}</Text>
          </View>
        </View>

        {/* Ghi chú */}
        {examination.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ghi chú</Text>
            <View style={styles.fullRow}>
              <Text style={styles.value}>{examination.notes}</Text>
            </View>
          </View>
        )}

        {/* Dịch vụ đã sử dụng */}
        {examination.listDentalServicesEntityOrder && examination.listDentalServicesEntityOrder.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dịch vụ đã sử dụng</Text>
            {examination.listDentalServicesEntityOrder.map((service, index) => (
              <View key={index} style={styles.serviceCard}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDetail}>
                  Số lượng: {service.quantity} {service.unit}
                </Text>
                <Text style={styles.serviceDetail}>
                  Đơn giá: {service.unitPrice.toLocaleString('vi-VN')} VNĐ
                </Text>
                <Text style={[styles.serviceDetail, { fontWeight: 700, color: '#1F2937' }]}>
                  Thành tiền: {(service.cost ?? service.unitPrice * service.quantity).toLocaleString('vi-VN')} VNĐ
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Thuốc đã sử dụng */}
        {examination.listPrescriptionOrder && examination.listPrescriptionOrder.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thuốc đã sử dụng</Text>
            {examination.listPrescriptionOrder.map((pres, index) => (
              <View key={index} style={styles.prescriptionCard}>
                <Text style={styles.prescriptionName}>{pres.name}</Text>
                <Text style={styles.prescriptionDetail}>
                  Liều lượng: {pres.dosage} · Tần suất: {pres.frequency} · Thời gian: {pres.duration}
                </Text>
                <Text style={styles.prescriptionDetail}>
                  Số lượng: {pres.quantity} viên
                </Text>
                {pres.notes && (
                  <Text style={[styles.prescriptionDetail, { fontStyle: 'italic' }]}>
                    Ghi chú: {pres.notes}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Hình ảnh */}
        {examination.listImage && examination.listImage.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hình ảnh</Text>
            
            {/* Ảnh răng */}
            {teethImages.length > 0 && (
              <View style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, color: '#3B82F6' }}>
                  Ảnh răng ({teethImages.length})
                </Text>
                <View style={styles.imageGrid}>
                  {teethImages.map((img, idx) => (
                    <View key={idx} style={styles.imageContainer}>
                      {img.url && <Image src={img.url} style={styles.image} />}
                      <Text style={styles.imageLabel}>Ảnh {idx + 1}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Ảnh mặt */}
            {faceImages.length > 0 && (
              <View style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, color: '#10B981' }}>
                  Ảnh mặt ({faceImages.length})
                </Text>
                <View style={styles.imageGrid}>
                  {faceImages.map((img, idx) => (
                    <View key={idx} style={styles.imageContainer}>
                      {img.url && <Image src={img.url} style={styles.image} />}
                      <Text style={styles.imageLabel}>Ảnh {idx + 1}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Ảnh X-quang */}
            {xrayImages.length > 0 && (
              <View style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, color: '#8B5CF6' }}>
                  Ảnh X-quang ({xrayImages.length})
                </Text>
                <View style={styles.imageGrid}>
                  {xrayImages.map((img, idx) => (
                    <View key={idx} style={styles.imageContainer}>
                      {img.url && <Image src={img.url} style={styles.image} />}
                      <Text style={styles.imageLabel}>Ảnh {idx + 1}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Tổng chi phí */}
        {examination.totalCost && (
          <View style={styles.section}>
            <View style={styles.costBox}>
              <Text style={styles.costLabel}>Tổng chi phí</Text>
              <Text style={styles.costValue}>{formatCurrency(examination.totalCost)}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Hồ sơ khám được tạo bởi hệ thống eDental</Text>
          <Text>Ngày xuất: {new Date().toLocaleDateString('vi-VN')}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ExaminationPDF;
