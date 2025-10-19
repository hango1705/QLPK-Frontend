import React, { useState } from 'react';
import { Card, Button, Input, Alert } from '@/components/ui';
import { showNotification } from '@/components/ui';

interface TreatmentPlan {
  id: string;
  title: string;
  doctor: string;
  date: string;
  description: string;
  procedures: string[];
  medications: string[];
  duration: string;
  status: 'active' | 'completed' | 'paused';
  notes: string;
}

const PatientTreatmentPlan = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - in real app, this would come from API
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([
    {
      id: '1',
      title: 'Điều trị viêm nướu',
      doctor: 'BS. Nguyễn Văn A',
      date: '2024-01-15',
      description: 'Kế hoạch điều trị viêm nướu cấp tính',
      procedures: [
        'Làm sạch răng chuyên nghiệp',
        'Điều trị bằng laser',
        'Hướng dẫn vệ sinh răng miệng'
      ],
      medications: [
        'Thuốc kháng viêm: Ibuprofen 400mg',
        'Nước súc miệng: Chlorhexidine 0.12%',
        'Kem đánh răng: Sensodyne'
      ],
      duration: '2 tuần',
      status: 'active',
      notes: 'Cần tái khám sau 1 tuần để đánh giá tiến triển'
    },
    {
      id: '2',
      title: 'Trám răng sâu',
      doctor: 'BS. Trần Thị B',
      date: '2024-01-20',
      description: 'Kế hoạch trám răng hàm dưới bên trái',
      procedures: [
        'Gây tê cục bộ',
        'Loại bỏ mô sâu',
        'Trám composite',
        'Đánh bóng bề mặt'
      ],
      medications: [
        'Thuốc tê: Lidocaine 2%',
        'Thuốc giảm đau: Paracetamol 500mg'
      ],
      duration: '1 ngày',
      status: 'completed',
      notes: 'Trám răng hoàn thành, cần theo dõi'
    }
  ]);

  const handleAddPlan = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      showNotification.success('Thêm phác đồ điều trị thành công!');
      setIsAdding(false);
    } catch (error) {
      showNotification.error('Có lỗi xảy ra khi thêm phác đồ');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Đang thực hiện';
      case 'completed':
        return 'Hoàn thành';
      case 'paused':
        return 'Tạm dừng';
      default:
        return 'Không xác định';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Phác đồ điều trị</h1>
              <p className="text-gray-600 mt-1">
                Kế hoạch điều trị được bác sĩ chỉ định
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={() => setIsAdding(true)} 
                variant="primary"
              >
                Thêm phác đồ
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
                <span className="text-2xl">📝</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tổng phác đồ</p>
                <p className="text-2xl font-bold text-gray-900">{treatmentPlans.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">🔄</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Đang thực hiện</p>
                <p className="text-2xl font-bold text-gray-900">
                  {treatmentPlans.filter(p => p.status === 'active').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Hoàn thành</p>
                <p className="text-2xl font-bold text-gray-900">
                  {treatmentPlans.filter(p => p.status === 'completed').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">⏸️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tạm dừng</p>
                <p className="text-2xl font-bold text-gray-900">
                  {treatmentPlans.filter(p => p.status === 'paused').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Treatment Plans */}
        <div className="space-y-6">
          {treatmentPlans.map((plan) => (
            <Card key={plan.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {plan.title}
                  </h3>
                  <p className="text-gray-600">
                    Bác sĩ: {plan.doctor} • Ngày: {plan.date}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                  {getStatusText(plan.status)}
                </span>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Mô tả</h4>
                <p className="text-gray-700 text-sm">{plan.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Quy trình điều trị</h4>
                  <ul className="text-gray-700 text-sm space-y-1">
                    {plan.procedures.map((procedure, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        {procedure}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Thuốc điều trị</h4>
                  <ul className="text-gray-700 text-sm space-y-1">
                    {plan.medications.map((medication, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {medication}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Thời gian điều trị</h4>
                  <p className="text-gray-700 text-sm">{plan.duration}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Ghi chú</h4>
                  <p className="text-gray-700 text-sm">{plan.notes}</p>
                </div>
              </div>

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

        {/* Add New Treatment Plan Modal */}
        {isAdding && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Thêm phác đồ điều trị mới
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
                        Tên phác đồ
                      </label>
                      <Input placeholder="Tên phác đồ điều trị" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bác sĩ chỉ định
                      </label>
                      <Input placeholder="Tên bác sĩ" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mô tả phác đồ điều trị..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quy trình điều trị
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Liệt kê các bước điều trị..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thuốc điều trị
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Danh sách thuốc..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Thời gian điều trị
                      </label>
                      <Input placeholder="Ví dụ: 2 tuần" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trạng thái
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="active">Đang thực hiện</option>
                        <option value="paused">Tạm dừng</option>
                        <option value="completed">Hoàn thành</option>
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

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button 
                      onClick={() => setIsAdding(false)} 
                      variant="outline"
                    >
                      Hủy
                    </Button>
                    <Button 
                      onClick={handleAddPlan}
                      variant="primary"
                      loading={isLoading}
                    >
                      Lưu phác đồ
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

export default PatientTreatmentPlan;
