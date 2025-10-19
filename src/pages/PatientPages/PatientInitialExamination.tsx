import React, { useState } from 'react';
import { Card, Button, Input, Alert } from '@/components/ui';
import { showNotification } from '@/components/ui';

interface ExaminationRecord {
  id: string;
  date: string;
  doctor: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  notes: string;
}

const PatientInitialExamination = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - in real app, this would come from API
  const [examinations, setExaminations] = useState<ExaminationRecord[]>([
    {
      id: '1',
      date: '2024-01-15',
      doctor: 'BS. Nguyễn Văn A',
      symptoms: 'Đau răng hàm trên bên phải, sưng nướu',
      diagnosis: 'Viêm nướu cấp tính',
      treatment: 'Làm sạch răng, kê đơn thuốc kháng viêm',
      notes: 'Bệnh nhân cần vệ sinh răng miệng tốt hơn'
    },
    {
      id: '2',
      date: '2024-01-20',
      doctor: 'BS. Trần Thị B',
      symptoms: 'Đau răng hàm dưới bên trái',
      diagnosis: 'Sâu răng giai đoạn 2',
      treatment: 'Trám răng composite',
      notes: 'Cần theo dõi và tái khám sau 1 tuần'
    }
  ]);

  const handleAddExamination = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      showNotification.success('Thêm hồ sơ khám thành công!');
      setIsAdding(false);
    } catch (error) {
      showNotification.error('Có lỗi xảy ra khi thêm hồ sơ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hồ sơ khám ban đầu</h1>
              <p className="text-gray-600 mt-1">
                Lịch sử khám bệnh và chẩn đoán ban đầu
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={() => setIsAdding(true)} 
                variant="primary"
              >
                Thêm hồ sơ khám
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tổng số lần khám</p>
                <p className="text-2xl font-bold text-gray-900">{examinations.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">👨‍⚕️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Bác sĩ đã khám</p>
                <p className="text-2xl font-bold text-gray-900">2</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <span className="text-2xl">📅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Lần khám gần nhất</p>
                <p className="text-lg font-bold text-gray-900">20/01/2024</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Examination Records */}
        <div className="space-y-6">
          {examinations.map((examination) => (
            <Card key={examination.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Lần khám ngày {examination.date}
                  </h3>
                  <p className="text-gray-600">Bác sĩ: {examination.doctor}</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Hoàn thành
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Triệu chứng</h4>
                  <p className="text-gray-700 text-sm">{examination.symptoms}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Chẩn đoán</h4>
                  <p className="text-gray-700 text-sm">{examination.diagnosis}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Điều trị</h4>
                  <p className="text-gray-700 text-sm">{examination.treatment}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Ghi chú</h4>
                  <p className="text-gray-700 text-sm">{examination.notes}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" size="sm">
                    Xem chi tiết
                  </Button>
                  <Button variant="primary" size="sm">
                    Tải xuống
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Add New Examination Modal */}
        {isAdding && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Thêm hồ sơ khám mới
                  </h3>
                  <button
                    onClick={() => setIsAdding(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày khám
                      </label>
                      <Input type="date" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bác sĩ khám
                      </label>
                      <Input placeholder="Tên bác sĩ" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Triệu chứng
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mô tả triệu chứng..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chẩn đoán
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Chẩn đoán của bác sĩ..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phương pháp điều trị
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Phương pháp điều trị..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ghi chú
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ghi chú thêm..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button 
                      onClick={() => setIsAdding(false)} 
                      variant="outline"
                    >
                      Hủy
                    </Button>
                    <Button 
                      onClick={handleAddExamination}
                      variant="primary"
                      loading={isLoading}
                    >
                      Lưu hồ sơ
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientInitialExamination;
