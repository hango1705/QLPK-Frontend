import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription, Button, Input, Card, CardContent } from '@/components/ui';
import { Eye, EyeOff } from 'lucide-react';
import apiClient from '@/services/api/client';
import type { AccountPanelProps } from '../types';

const AccountPanel: React.FC<AccountPanelProps> = ({
  patient,
  user: userProp,
  editForm: editFormProp,
  onEditFormChange,
  onSave,
  saving,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(userProp || null);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [fieldErrors, setFieldErrors] = useState<{ current?: string; new?: string; confirm?: string }>({});
  const [copiedUserId, setCopiedUserId] = useState(false);

  useEffect(() => {
    if (userProp) {
      setUser(userProp);
    } else {
      load();
    }
  }, [userProp]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/api/v1/users/myInfo');
      setUser(res.data.result || res.data || null);
    } catch {
      setError('Không tải được thông tin tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = () => {
    const errors: { current?: string; new?: string; confirm?: string } = {};
    if (!passwords.currentPassword) errors.current = 'Vui lòng nhập mật khẩu hiện tại';
    if (!passwords.newPassword) {
      errors.new = 'Vui lòng nhập mật khẩu mới';
    } else if (passwords.newPassword.length < 6) {
      errors.new = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    if (!passwords.confirmPassword) {
      errors.confirm = 'Vui lòng xác nhận mật khẩu';
    } else if (passwords.newPassword !== passwords.confirmPassword) {
      errors.confirm = 'Mật khẩu xác nhận không khớp';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const changePassword = async () => {
    if (!user || !user.id) {
      setError('Thiếu userId');
      return;
    }
    if (!validatePassword()) return;

    setPwdLoading(true);
    setError(null);
    setPwdSuccess(null);
    try {
      await apiClient.put(`/api/v1/users/updatePassword/${user.id}`, {
        oldPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setFieldErrors({});
      setPwdSuccess('Đổi mật khẩu thành công!');
      setTimeout(() => setPwdSuccess(null), 5000);
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Đổi mật khẩu thất bại';
      setError(msg);
      if (msg.toLowerCase().includes('sai') || msg.toLowerCase().includes('incorrect')) {
        setFieldErrors({ current: 'Mật khẩu hiện tại không đúng' });
      }
    } finally {
      setPwdLoading(false);
    }
  };

  const copyUserId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedUserId(true);
      setTimeout(() => setCopiedUserId(false), 2000);
    }
  };

  const getAvatarInitial = () => {
    if (user?.email) return user.email.charAt(0).toUpperCase();
    if (user?.username) return user.username.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {pwdSuccess && (
        <Alert variant="default" className="mb-4">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{pwdSuccess}</AlertDescription>
        </Alert>
      )}
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      ) : (
        <>
          {user ? (
            <div className="space-y-6">
              {/* Thông tin đăng nhập */}
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md">
                    {getAvatarInitial()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Thông tin đăng nhập</h3>
                    <p className="text-sm text-gray-600">Quản lý thông tin tài khoản của bạn</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 py-2 border-b border-blue-100">
                    <span className="text-sm font-medium text-gray-700 w-28">Email:</span>
                    <span className="text-sm font-medium text-gray-900 flex-1">{user.email}</span>
                  </div>
                  {user.username && (
                    <div className="flex items-center gap-3 py-2 border-b border-blue-100">
                      <span className="text-sm font-medium text-gray-700 w-28">Username:</span>
                      <span className="text-sm font-medium text-gray-900 flex-1">{user.username}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-sm font-medium text-gray-700 w-28">User ID:</span>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs font-mono text-gray-600 bg-white px-2 py-1 rounded border">
                        {user.id.substring(0, 8)}...{user.id.substring(user.id.length - 4)}
                      </span>
                      <button
                        onClick={copyUserId}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition"
                        title="Copy User ID"
                      >
                        {copiedUserId ? 'Đã copy' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Đổi mật khẩu */}
              <Card className="p-6 bg-white border border-gray-200 shadow-sm">
                <div className="mb-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Đổi mật khẩu</h3>
                  <p className="text-sm text-gray-600">Cập nhật mật khẩu để bảo mật tài khoản của bạn</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mật khẩu hiện tại <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwords.currentPassword}
                        onChange={(e) => {
                          setPasswords({ ...passwords, currentPassword: e.target.value });
                          if (fieldErrors.current) setFieldErrors({ ...fieldErrors, current: undefined });
                        }}
                        placeholder="Nhập mật khẩu hiện tại"
                        className={`w-full ${fieldErrors.current ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                        aria-label={showPasswords.current ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {fieldErrors.current && <p className="text-xs text-red-600 mt-1">{fieldErrors.current}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwords.newPassword}
                        onChange={(e) => {
                          setPasswords({ ...passwords, newPassword: e.target.value });
                          if (fieldErrors.new) setFieldErrors({ ...fieldErrors, new: undefined });
                          if (fieldErrors.confirm && passwords.confirmPassword) {
                            setFieldErrors({ ...fieldErrors, confirm: undefined });
                          }
                        }}
                        placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                        className={`w-full ${fieldErrors.new ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                        aria-label={showPasswords.new ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {fieldErrors.new && <p className="text-xs text-red-600 mt-1">{fieldErrors.new}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwords.confirmPassword}
                        onChange={(e) => {
                          setPasswords({ ...passwords, confirmPassword: e.target.value });
                          if (fieldErrors.confirm) {
                            if (e.target.value === passwords.newPassword) {
                              setFieldErrors({ ...fieldErrors, confirm: undefined });
                            } else {
                              setFieldErrors({ ...fieldErrors, confirm: 'Mật khẩu xác nhận không khớp' });
                            }
                          }
                        }}
                        placeholder="Nhập lại mật khẩu mới"
                        className={`w-full ${fieldErrors.confirm ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                        aria-label={showPasswords.confirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {fieldErrors.confirm && <p className="text-xs text-red-600 mt-1">{fieldErrors.confirm}</p>}
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={changePassword}
                    loading={pwdLoading}
                    variant="primary"
                    className="px-6 py-2 font-medium shadow-sm hover:shadow-md transition"
                  >
                    Lưu thay đổi
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">Không có dữ liệu tài khoản.</div>
          )}
        </>
      )}
    </div>
  );
};

export default AccountPanel;

