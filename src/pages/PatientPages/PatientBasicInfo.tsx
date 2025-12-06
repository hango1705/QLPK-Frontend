import React, { useEffect, useState } from 'react';
import { Card, Button, Input, Alert, AlertTitle, AlertDescription, showNotification } from '@/components/ui';
import { Select } from 'antd';
import { UserOutlined, PhoneOutlined, HeartOutlined, SafetyCertificateOutlined, SaveOutlined, MailOutlined, HomeOutlined, ManOutlined, CalendarOutlined } from '@ant-design/icons';
import { patientAPI } from '@/services/api/patient';
import { adminAPI } from '@/services/api/admin';
import { useSelector } from 'react-redux';

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
    if (!token) return;
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
  }, [token]);

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
    // simple validations
    const errs: any = {};
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email không hợp lệ';
    if (form.phone && !/^\d{9,11}$/.test((form.phone || '').replace(/\D/g, ''))) errs.phone = 'Số điện thoại 9-11 chữ số';
    setFieldErrors(errs);
    if (Object.keys(errs).length) { setError('Vui lòng kiểm tra lại các trường bôi đỏ'); return; }
    setSaving(true); setMsg(null); setError(null);
    try {
      await adminAPI.updateUserInfo(user.id, {
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        address: form.address,
        gender: form.gender,
        dob: form.dob,
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Thông tin cơ bản bệnh nhân</h1>
              <p className="text-gray-600 mt-1">Chỉnh sửa thông tin cá nhân, liên hệ, nhóm máu, dị ứng, bệnh nền...</p>
            </div>
          </div>
        </div>
      </div>
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
            <label className="block text-sm font-medium mb-1">Họ tên</label>
            <Input aria-label="Họ tên" name="fullName" value={form.fullName || ''} onChange={onChange} className="mb-3" />
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input aria-label="Email" name="email" value={form.email || ''} onChange={onChange} className={`mb-1 ${fieldErrors.email ? 'border-red-500' : ''}`} prefix={<MailOutlined />} placeholder="name@example.com" />
            {fieldErrors.email && <div className="text-xs text-red-600 mb-2">{fieldErrors.email}</div>}
            <label className="block text-sm font-medium mb-1">Số điện thoại</label>
            <Input aria-label="Số điện thoại" name="phone" value={form.phone || ''} onChange={onChange} className={`mb-1 ${fieldErrors.phone ? 'border-red-500' : ''}`} prefix={<PhoneOutlined />} placeholder="0986532214" />
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
  );
};

export default PatientBasicInfo;
