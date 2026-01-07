import React, { useEffect, useState } from 'react';
import { Card, Button, Input, Alert, AlertTitle, AlertDescription, showNotification } from '@/components/ui';
import { Select } from 'antd';
import { UserOutlined, PhoneOutlined, HeartOutlined, SafetyCertificateOutlined, SaveOutlined, MailOutlined, HomeOutlined, ManOutlined, CalendarOutlined } from '@ant-design/icons';
import { patientAPI } from '@/services/api/patient';
import { adminAPI } from '@/services/api/admin';
import { useSelector } from 'react-redux';
import { usePermission } from '@/hooks';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

const GENDER_OPTS = [
  { label: 'Nam', value: 'male' },
  { label: 'Nữ', value: 'female' },
  { label: 'Khác', value: 'other' },
];

const BLOOD_OPTS = [
  'A', 'B', 'O', 'AB', 'A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-', 'Không rõ'
];

const PatientBasicInfo = () => {
  const token = useSelector((state: any) => state.auth.token);
  const { hasPermission } = usePermission();
  const canGetBasicInfo = hasPermission('GET_BASIC_INFO');
  const [patient, setPatient] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true); // loading tổng
  const [saving, setSaving] = useState(false); // loading nút Lưu
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [fieldErrors, setFieldErrors] = useState<any>({});

  // Load info userId/patientId
  useEffect(() => {
    if (!token || !canGetBasicInfo) return;
    setLoading(true);
    setMsg(null);
    setError(null);
    Promise.all([
      adminAPI.getMyInfo(),
      patientAPI.getMyInfo()
    ])
      .then(([u, p]) => {
        setUser(u);
        setPatient(p);
        setForm({
          fullName: u.fullName,
          phone: u.phone,
          email: u.email,
          address: u.address,
          gender: u.gender,
          dob: u.dob,
          emergencyContactName: p.emergencyContactName,
          emergencyPhoneNumber: p.emergencyPhoneNumber,
          bloodGroup: p.bloodGroup,
          allergy: p.allergy,
          medicalHistory: p.medicalHistory,
        });
        setLoading(false);
      })
      .catch(() => {
        setError('Không thể lấy thông tin bệnh nhân này!');
        setLoading(false);
      });
  }, [token, canGetBasicInfo]);

  // Handlers
  const onChange = (e: any) => {
    const { name, value } = e.target;
    setForm((f: any) => ({ ...f, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((fe: any) => ({ ...fe, [name]: undefined }));
  };

  const onSelectChange = (name: string, value: string) => {
    setForm((f: any) => ({ ...f, [name]: value }));
  };

  // Lưu info cá nhân
  const saveInfo = async () => {
    if (!user?.id) return setMsg('Thiếu userId!');
    // Validation các trường bắt buộc
    const errs: any = {};
    
    // Họ tên bắt buộc
    if (!form.fullName || form.fullName.trim() === '') {
      errs.fullName = 'Họ tên không được để trống';
    }
    
    // Số điện thoại bắt buộc
    if (!form.phone || form.phone.trim() === '') {
      errs.phone = 'Số điện thoại không được để trống';
    } else if (!/^\d{9,11}$/.test((form.phone || '').replace(/\D/g, ''))) {
      errs.phone = 'Số điện thoại phải có 9-11 chữ số';
    }
    
    // Email không được sửa, chỉ validate format nếu có
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Email không hợp lệ';
    }
    
    setFieldErrors(errs);
    if (Object.keys(errs).length) { 
      setError('Vui lòng kiểm tra lại các trường bôi đỏ'); 
      return; 
    }
    
    setSaving(true); setMsg(null); setError(null);
    try {
      // Không gửi email khi update vì không được sửa
      await adminAPI.updateUserInfo(user.id, {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        // Không gửi email - giữ nguyên email hiện tại
        address: form.address?.trim() || '',
        gender: form.gender || '',
        dob: form.dob || '',
      });
      setMsg('Đã lưu thông tin cá nhân!');
      showNotification.success('Thành công', 'Đã lưu thông tin cá nhân');
    } catch (e: any) {
      setError('Lưu thông tin cá nhân thất bại!');
    } finally { setSaving(false); }
  };

  // Lưu liên hệ khẩn cấp
  const saveEmergency = async () => {
    if (!patient?.id) return setMsg('Thiếu patientId!');
    setSaving(true); setMsg(null); setError(null);
    try {
      await patientAPI.updateEmergencyContact(patient.id, {
        emergencyContactName: form.emergencyContactName,
        emergencyPhoneNumber: form.emergencyPhoneNumber
      });
      setMsg('Đã lưu liên hệ khẩn cấp!');
      showNotification.success('Thành công', 'Đã lưu liên hệ khẩn cấp');
    } catch (e: any) {
      setError('Lưu liên hệ khẩn cấp thất bại!');
    } finally { setSaving(false); }
  };

  // Lưu hồ sơ y tế
  const saveMedical = async () => {
    if (!patient?.id) return setMsg('Thiếu patientId!');
    setSaving(true); setMsg(null); setError(null);
    try {
      await patientAPI.updateMedicalInformation(patient.id, {
        bloodGroup: form.bloodGroup,
        allergy: form.allergy,
        medicalHistory: form.medicalHistory
      });
      setMsg('Đã lưu hồ sơ y tế!');
      showNotification.success('Thành công', 'Đã lưu hồ sơ y tế');
    } catch (e: any) {
      setError('Lưu hồ sơ y tế thất bại!');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Đang tải dữ liệu…</div>;

  return (
    <PermissionGuard permission="GET_BASIC_INFO" fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertTitle>Không có quyền truy cập</AlertTitle>
          <AlertDescription>Bạn không có quyền xem thông tin cơ bản bệnh nhân</AlertDescription>
        </Alert>
      </div>
    }>
      {/* Align background with Patient overview page: remove gray container background */}
      <div className="min-h-screen">
      <div className="py-8">
        {msg && (
          <Alert variant="default" className="mb-2">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{msg}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" className="mb-2">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="mb-3 font-semibold text-gray-800 flex items-center gap-2"><UserOutlined /> Thông tin cá nhân</div>
            <label className="block text-sm font-medium mb-1">
              Họ tên <span className="text-red-500">*</span>
            </label>
            <Input 
              aria-label="Họ tên" 
              name="fullName" 
              value={form.fullName || ''} 
              onChange={onChange} 
              className={`mb-1 ${fieldErrors.fullName ? 'border-red-500' : ''}`}
              required
            />
            {fieldErrors.fullName && <div className="text-xs text-red-600 mb-2">{fieldErrors.fullName}</div>}
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input 
              aria-label="Email" 
              name="email" 
              value={form.email || ''} 
              disabled
              className="mb-3 bg-gray-100 cursor-not-allowed" 
              prefix={<MailOutlined />} 
              placeholder="name@example.com"
              title="Email không thể thay đổi"
            />
            <label className="block text-sm font-medium mb-1">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <Input 
              aria-label="Số điện thoại" 
              name="phone" 
              value={form.phone || ''} 
              onChange={onChange} 
              className={`mb-1 ${fieldErrors.phone ? 'border-red-500' : ''}`} 
              prefix={<PhoneOutlined />} 
              placeholder="0986532214"
              required
            />
            {fieldErrors.phone && <div className="text-xs text-red-600 mb-2">{fieldErrors.phone}</div>}
            <label className="block text-sm font-medium mb-1">Địa chỉ</label>
            <Input aria-label="Địa chỉ" name="address" value={form.address || ''} onChange={onChange} className="mb-3" prefix={<HomeOutlined />} />
            <label className="block text-sm font-medium mb-1">Giới tính</label>
            <Select
              style={{ width: '100%' }}
              value={form.gender || ''}
              options={GENDER_OPTS}
              onChange={(v) => onSelectChange('gender', v)}
              placeholder="Chọn giới tính"
              className="mb-3"
            />
            <label className="block text-sm font-medium mb-1">Ngày sinh</label>
            <Input aria-label="Ngày sinh" type="date" name="dob" value={form.dob || ''} onChange={onChange} className="mb-3" prefix={<CalendarOutlined />} />
            <div className="mt-8">
              <Button className="w-full" onClick={saveInfo} loading={saving}>
                <span className="flex items-center justify-center gap-2"><SaveOutlined /> Lưu thông tin cá nhân</span>
              </Button>
            </div>
          </Card>
          <Card className="p-6">
            <div className="mb-3 font-semibold text-gray-800 flex items-center gap-2"><SafetyCertificateOutlined /> Liên hệ khẩn cấp</div>
            <label className="block text-sm font-medium mb-1">Họ tên liên hệ</label>
            <Input aria-label="Họ tên liên hệ" name="emergencyContactName" value={form.emergencyContactName || ''} onChange={onChange} className="mb-3" />
            <label className="block text-sm font-medium mb-1">Số ĐT khẩn cấp</label>
            <Input aria-label="Số ĐT khẩn cấp" name="emergencyPhoneNumber" value={form.emergencyPhoneNumber || ''} onChange={onChange} className="mb-3" prefix={<PhoneOutlined />} />
            <div className="mt-8">
              <Button className="w-full" onClick={saveEmergency} loading={saving}>
                <span className="flex items-center justify-center gap-2"><SaveOutlined /> Lưu liên hệ khẩn cấp</span>
              </Button>
            </div>
          </Card>
          <Card className="p-6 lg:col-span-2">
            <div className="mb-3 font-semibold text-gray-800 flex items-center gap-2"><HeartOutlined /> Hồ sơ y tế cá nhân</div>
            <label className="block text-sm font-medium mb-1">Nhóm máu</label>
            <Select
              style={{ width: '100%' }}
              value={form.bloodGroup || ''}
              options={BLOOD_OPTS.map(b => ({ label: b, value: b }))}
              onChange={(v) => onSelectChange('bloodGroup', v)}
              placeholder="Chọn nhóm máu"
              className="mb-3"
            />
            <label className="block text-sm font-medium mb-1">Dị ứng</label>
            <Input aria-label="Dị ứng" name="allergy" value={form.allergy || ''} onChange={onChange} className="mb-3" placeholder="Cá, Hải sản, Phấn hoa..." />
            <label className="block text-sm font-medium mb-1">Lịch sử bệnh</label>
            <Input aria-label="Lịch sử bệnh" name="medicalHistory" value={form.medicalHistory || ''} onChange={onChange} className="mb-3" placeholder="Không / Tiểu đường / Tăng huyết áp..." />
            <div className="mt-8">
              <Button className="w-full" onClick={saveMedical} loading={saving}>
                <span className="flex items-center justify-center gap-2"><SaveOutlined /> Lưu hồ sơ y tế</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
    </PermissionGuard>
  );
};

export default PatientBasicInfo;
