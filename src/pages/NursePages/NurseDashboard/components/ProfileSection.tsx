import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks';
import { userAPI } from '@/services/api/user';
import { showNotification, Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { Loading } from '@/components/ui';
import { User, Mail, Phone, MapPin, Calendar, Save } from 'lucide-react';

const ProfileSection: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    gender: '',
    dob: '',
  });

  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ['user', 'myInfo'],
    queryFn: userAPI.getMyInfo,
    enabled: true,
  });

  // Update form data when profileResponse changes
  useEffect(() => {
    if (profileResponse) {
      setFormData({
        fullName: profileResponse.fullName || '',
        phone: profileResponse.phone || '',
        email: profileResponse.email || '',
        address: profileResponse.address || '',
        gender: profileResponse.gender || '',
        dob: profileResponse.dob ? profileResponse.dob.split('T')[0] : '',
      });
    }
  }, [profileResponse]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      if (!profileResponse?.id) {
        throw new Error('User ID not available');
      }
      // Exclude email from update payload
      const { email, ...updateData } = data;
      return userAPI.updateProfile(profileResponse.id, updateData);
    },
    onSuccess: (result) => {
      if (result) {
        showNotification.success('Cập nhật thông tin thành công');
        queryClient.invalidateQueries({ queryKey: ['user', 'myInfo'] });
        queryClient.invalidateQueries({ queryKey: ['nurse', 'profile'] });
        // Update form data with new values
        if (result.fullName) setFormData(prev => ({ ...prev, fullName: result.fullName }));
        if (result.phone !== undefined) setFormData(prev => ({ ...prev, phone: result.phone || '' }));
        if (result.address !== undefined) setFormData(prev => ({ ...prev, address: result.address || '' }));
        if (result.gender !== undefined) setFormData(prev => ({ ...prev, gender: result.gender || '' }));
        if (result.dob) setFormData(prev => ({ ...prev, dob: result.dob.split('T')[0] }));
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Cập nhật thông tin thất bại';
      showNotification.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  const profile = profileResponse;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Thông tin cá nhân</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Quản lý thông tin cá nhân của bạn
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
          <CardDescription>
            Cập nhật thông tin cá nhân của bạn. Thông tin này sẽ được hiển thị trong hồ sơ của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Họ và tên
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Tên đăng nhập
                </Label>
                <Input
                  id="username"
                  value={profile?.username || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Tên đăng nhập không thể thay đổi</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || profile?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email không thể thay đổi</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Số điện thoại
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ngày sinh
                </Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleChange('dob', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Giới tính
                </Label>
                <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Nam</SelectItem>
                    <SelectItem value="FEMALE">Nữ</SelectItem>
                    <SelectItem value="OTHER">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Địa chỉ
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Nhập địa chỉ"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="min-w-[120px]"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loading size="sm" className="mr-2" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSection;

