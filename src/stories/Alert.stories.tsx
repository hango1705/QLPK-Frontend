import type { Meta, StoryObj } from '@storybook/react';
import { Alert, showNotification } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['success', 'info', 'warning', 'error'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    closable: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    variant: 'success',
    message: 'Thành công!',
    description: 'Dữ liệu đã được lưu thành công.',
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    message: 'Thông tin',
    description: 'Đây là thông tin quan trọng bạn cần biết.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    message: 'Cảnh báo',
    description: 'Vui lòng kiểm tra lại thông tin trước khi tiếp tục.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    message: 'Lỗi',
    description: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
  },
};

export const WithoutDescription: Story = {
  args: {
    variant: 'success',
    message: 'Thành công!',
  },
};

export const NotClosable: Story = {
  args: {
    variant: 'info',
    message: 'Thông báo quan trọng',
    description: 'Thông báo này không thể đóng.',
    closable: false,
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Alert 
        variant="info" 
        size="sm" 
        message="Small alert" 
        description="This is a small alert"
      />
      <Alert 
        variant="info" 
        size="md" 
        message="Medium alert" 
        description="This is a medium alert"
      />
      <Alert 
        variant="info" 
        size="lg" 
        message="Large alert" 
        description="This is a large alert"
      />
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Alert 
        variant="success" 
        message="Thành công" 
        description="Dữ liệu đã được lưu thành công."
      />
      <Alert 
        variant="info" 
        message="Thông tin" 
        description="Đây là thông tin quan trọng."
      />
      <Alert 
        variant="warning" 
        message="Cảnh báo" 
        description="Vui lòng kiểm tra lại thông tin."
      />
      <Alert 
        variant="error" 
        message="Lỗi" 
        description="Đã xảy ra lỗi. Vui lòng thử lại."
      />
    </div>
  ),
};

export const NotificationDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Notification Examples</h3>
      <div className="flex gap-4">
        <Button 
          onClick={() => showNotification.success('Thành công!', 'Dữ liệu đã được lưu.')}
        >
          Success Notification
        </Button>
        <Button 
          onClick={() => showNotification.error('Lỗi!', 'Đã xảy ra lỗi hệ thống.')}
        >
          Error Notification
        </Button>
        <Button 
          onClick={() => showNotification.warning('Cảnh báo!', 'Vui lòng kiểm tra lại.')}
        >
          Warning Notification
        </Button>
        <Button 
          onClick={() => showNotification.info('Thông tin', 'Có thông tin mới.')}
        >
          Info Notification
        </Button>
      </div>
    </div>
  ),
};
