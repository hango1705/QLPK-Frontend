import React, { useState } from 'react';
import { Card, Button, Input, Alert } from '@/components/ui';
import { showNotification } from '@/components/ui';

interface TreatmentProgress {
  id: string;
  date: string;
  treatmentPlan: string;
  doctor: string;
  progress: number; // 0-100
  status: 'ongoing' | 'completed' | 'delayed';
  description: string;
  nextAppointment?: string;
  notes: string;
  attachments: string[];
}

const PatientTreatmentProgress = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - in real app, this would come from API
  const [progressRecords, setProgressRecords] = useState<TreatmentProgress[]>([
    {
      id: '1',
      date: '2024-01-15',
      treatmentPlan: 'Điều trị viêm nướu',
      doctor: 'BS. Nguyễn Văn A',
      progress: 30,
      status: 'ongoing',
      description: 'Bắt đầu điều trị viêm nướu, làm sạch răng chuyên nghiệp',
      nextAppointment: '2024-01-22',
      notes: 'Bệnh nhân hợp tác tốt, cần tiếp tục điều trị',
      attachments: ['xray_1.jpg', 'photo_1.jpg']
    },
    {
      id: '2',
      date: '2024-01-22',
      treatmentPlan: 'Điều trị viêm nướu',
      doctor: 'BS. Nguyễn Văn A',
      progress: 60,
      status: 'ongoing',
      description: 'Tiếp tục điều trị, sử dụng laser trị liệu',
      nextAppointment: '2024-01-29',
      notes: 'Tình trạng cải thiện rõ rệt, nướu đã bớt sưng',
      attachments: ['photo_2.jpg']
    },
    {
      id: '3',
      date: '2024-01-20',
      treatmentPlan: 'Trám răng sâu',
      doctor: 'BS. Trần Thị B',
      progress: 100,
      status: 'completed',
      description: 'Hoàn thành trám răng hàm dưới bên trái',
      notes: 'Trám răng thành công, cần theo dõi',
      attachments: ['xray_2.jpg', 'photo_3.jpg']
    }
  ]);

  const handleAddProgress = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      showNotification.success('Thêm tiến trình điều trị thành công!');
      setIsAdding(false);
    } catch (error) {
      showNotification.error('Có lỗi xảy ra khi thêm tiến trình');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'delayed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'Đang thực hiện';
      case 'completed':
        return 'Hoàn thành';
      case 'delayed':
        return 'Chậm tiến độ';
      default:
        return 'Không xác định';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tiến trình điều trị</h1>
              <p className="text-gray-600 mt-1">
                Theo dõi quá trình điều trị và tiến độ phục hồi
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={() => setIsAdding(true)} 
                variant="primary"
              >
                Thêm tiến trình
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tổng tiến trình</p>
                <p className="text-2xl font-bold text-gray-900">{progressRecords.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Hoàn thành</p>
                <p className="text-2xl font-bold text-gray-900">
                  {progressRecords.filter(p => p.status === 'completed').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">🔄</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Đang thực hiện</p>
                <p className="text-2xl font-bold text-gray-900">
                  {progressRecords.filter(p => p.status === 'ongoing').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Chậm tiến độ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {progressRecords.filter(p => p.status === 'delayed').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Progress Timeline */}
        <div className="space-y-6">
          {progressRecords.map((record, index) => (
            <Card key={record.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {record.treatmentPlan}
                  </h3>
                  <p className="text-gray-600">
                    Ngày: {record.date} • Bác sĩ: {record.doctor}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                  {getStatusText(record.status)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Tiến độ</span>
                  <span className="text-sm font-bold text-gray-900">{record.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getProgressColor(record.progress)}`}
                    style={{ width: `${record.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Mô tả tiến trình</h4>
                <p className="text-gray-700 text-sm">{record.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Ghi chú</h4>
                  <p className="text-gray-700 text-sm">{record.notes}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Lịch hẹn tiếp theo</h4>
                  <p className="text-gray-700 text-sm">
                    {record.nextAppointment ? record.nextAppointment : 'Chưa có lịch hẹn'}
                  </p>
                </div>
              </div>

              {/* Attachments */}
              {record.attachments.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Tài liệu đính kèm</h4>
                  <div className="flex flex-wrap gap-2">
                    {record.attachments.map((attachment, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        📎 {attachment}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
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

        {/* Add New Progress Modal */}
        {isAdding && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Thêm tiến trình điều trị
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
                        Phác đồ điều trị
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Chọn phác đồ</option>
                        <option value="1">Điều trị viêm nướu</option>
                        <option value="2">Trám răng sâu</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bác sĩ điều trị
                      </label>
                      <Input placeholder="Tên bác sĩ" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày cập nhật
                      </label>
                      <Input type="date" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tiến độ (%)
                      </label>
                      <Input type="number" min="0" max="100" placeholder="0-100" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả tiến trình
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mô tả tiến trình điều trị..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lịch hẹn tiếp theo
                      </label>
                      <Input type="date" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trạng thái
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="ongoing">Đang thực hiện</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="delayed">Chậm tiến độ</option>
                      </select>
                    </div>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tài liệu đính kèm
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">
                        <button type="button" className="font-medium text-blue-600 hover:text-blue-500">
                          Tải lên tài liệu
                        </button>
                        {' '}hoặc kéo thả vào đây
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button 
                      onClick={() => setIsAdding(false)} 
                      variant="outline"
                    >
                      Hủy
                    </Button>
                    <Button 
                      onClick={handleAddProgress}
                      variant="primary"
                      loading={isLoading}
                    >
                      Lưu tiến trình
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

export default PatientTreatmentProgress;
