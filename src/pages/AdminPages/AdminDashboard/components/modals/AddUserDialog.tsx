import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  showNotification,
} from '@/components/ui';
import { UserPlus, Mail, Send } from 'lucide-react';
import type { DoctorCreateRequest, NurseCreateRequest } from '@/services/api/auth';
import { authAPI } from '@/services/api/auth';

type UserType = 'doctor' | 'nurse';

interface AddUserDialogProps {
  open: boolean;
  userType: UserType;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DoctorCreateRequest | NurseCreateRequest) => void;
  isLoading: boolean;
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({
  open,
  userType,
  onOpenChange,
  onSubmit,
  isLoading,
}) => {
  const [form, setForm] = useState<DoctorCreateRequest | NurseCreateRequest>({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    gender: '',
    dob: '',
    createAt: new Date().toISOString().split('T')[0],
    ...(userType === 'doctor'
      ? {
          specialization: '',
          licenseNumber: '',
          yearsExperience: 0,
        }
      : {
          department: '',
        }),
    verifiedCode: '',
  });

  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setForm({
        username: '',
        password: '',
        fullName: '',
        email: '',
        phone: '',
        address: '',
        gender: '',
        dob: '',
        createAt: new Date().toISOString().split('T')[0],
        ...(userType === 'doctor'
          ? {
              specialization: '',
              licenseNumber: '',
              yearsExperience: 0,
            }
          : {
              department: '',
            }),
        verifiedCode: '',
      });
      setCodeSent(false);
    }
  }, [open, userType]);

  const handleSendVerificationCode = async () => {
    if (!form.email) {
      return;
    }

    setSendingCode(true);
    try {
      await authAPI.sendVerificationCode(form.email);
      setCodeSent(true);
      showNotification.success('Đã gửi mã xác thực đến email');
    } catch (error: any) {
      showNotification.error('Không thể gửi mã xác thực', error?.message || 'Đã xảy ra lỗi');
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = () => {
    // Validation
    if (!form.username || form.username.length < 8) {
      return;
    }
    if (!form.password || form.password.length < 8) {
      return;
    }
    if (!form.fullName) {
      return;
    }
    if (!form.email) {
      return;
    }
    if (!form.verifiedCode) {
      return;
    }
    if (userType === 'doctor') {
      const doctorForm = form as DoctorCreateRequest;
      if (!doctorForm.specialization || !doctorForm.licenseNumber || doctorForm.yearsExperience < 0) {
        return;
      }
    } else {
      const nurseForm = form as NurseCreateRequest;
      if (!nurseForm.department) {
        return;
      }
    }

    onSubmit(form);
  };

  const isFormValid = () => {
    if (!form.username || form.username.length < 8) return false;
    if (!form.password || form.password.length < 8) return false;
    if (!form.fullName) return false;
    if (!form.email) return false;
    if (!form.verifiedCode) return false;
    if (userType === 'doctor') {
      const doctorForm = form as DoctorCreateRequest;
      if (!doctorForm.specialization || !doctorForm.licenseNumber || doctorForm.yearsExperience < 0) {
        return false;
      }
    } else {
      const nurseForm = form as NurseCreateRequest;
      if (!nurseForm.department) return false;
    }
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-2 border-b border-border/70 px-6 pb-4 pt-6">
          <DialogTitle className="text-xl font-semibold text-foreground">
            Thêm {userType === 'doctor' ? 'Bác sĩ' : 'Y tá'} mới
          </DialogTitle>
          <DialogDescription>
            Tạo tài khoản {userType === 'doctor' ? 'bác sĩ' : 'y tá'} mới trong hệ thống
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Thông tin cơ bản</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Tên đăng nhập <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Tối thiểu 8 ký tự"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  minLength={8}
                />
                {form.username && form.username.length < 8 && (
                  <p className="text-xs text-destructive">Tên đăng nhập phải có ít nhất 8 ký tự</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Mật khẩu <span className="text-destructive">*</span>
                </label>
                <Input
                  type="password"
                  placeholder="Tối thiểu 8 ký tự"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={8}
                />
                {form.password && form.password.length < 8 && (
                  <p className="text-xs text-destructive">Mật khẩu phải có ít nhất 8 ký tự</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">
                  Họ và tên <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Nhập họ và tên đầy đủ"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={form.email}
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value });
                      setCodeSent(false);
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSendVerificationCode}
                    disabled={!form.email || sendingCode || codeSent}
                    className="whitespace-nowrap"
                  >
                    {sendingCode ? (
                      'Đang gửi...'
                    ) : codeSent ? (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Đã gửi
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Gửi mã
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Mã xác thực <span className="text-destructive">*</span></label>
                <Input
                  placeholder="Nhập mã xác thực từ email"
                  value={form.verifiedCode}
                  onChange={(e) => setForm({ ...form, verifiedCode: e.target.value })}
                  disabled={!codeSent}
                />
                {!codeSent && (
                  <p className="text-xs text-muted-foreground">Vui lòng gửi mã xác thực trước</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Số điện thoại</label>
                <Input
                  placeholder="0123456789"
                  value={form.phone || ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Giới tính</label>
                <select
                  value={form.gender || ''}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full rounded-xl border border-border/70 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Ngày sinh</label>
                <Input
                  type="date"
                  value={form.dob || ''}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Địa chỉ</label>
                <Input
                  placeholder="Nhập địa chỉ"
                  value={form.address || ''}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4 border-t border-border/70 pt-4">
            <h3 className="text-sm font-semibold text-foreground">
              Thông tin {userType === 'doctor' ? 'chuyên môn' : 'nghề nghiệp'}
            </h3>

            {userType === 'doctor' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Chuyên khoa <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="VD: Răng hàm mặt, Nha khoa tổng quát"
                    value={(form as DoctorCreateRequest).specialization || ''}
                    onChange={(e) =>
                      setForm({ ...form, specialization: e.target.value } as DoctorCreateRequest)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Số chứng chỉ hành nghề <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Nhập số chứng chỉ"
                    value={(form as DoctorCreateRequest).licenseNumber || ''}
                    onChange={(e) =>
                      setForm({ ...form, licenseNumber: e.target.value } as DoctorCreateRequest)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Số năm kinh nghiệm <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    value={(form as DoctorCreateRequest).yearsExperience || 0}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        yearsExperience: parseInt(e.target.value) || 0,
                      } as DoctorCreateRequest)
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Khoa/Phòng ban <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="VD: Khoa điều dưỡng, Phòng khám"
                  value={(form as NurseCreateRequest).department || ''}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value } as NurseCreateRequest)
                  }
                />
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-wrap gap-3 border-t border-border/70 bg-white px-6 py-4">
          <Button variant="outline" className="flex-1 border-border/70" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            className="flex-1 bg-primary text-white hover:bg-primary/90"
            onClick={handleSubmit}
            disabled={isLoading || !isFormValid()}
          >
            {isLoading ? (
              'Đang tạo...'
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Tạo {userType === 'doctor' ? 'bác sĩ' : 'y tá'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;

