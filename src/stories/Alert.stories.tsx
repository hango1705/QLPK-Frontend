import type { Meta, StoryObj } from '@storybook/react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';
import { showNotification } from '@/components/ui/Notification';
import { Button } from '@/components/ui/Button';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

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
      options: ['default', 'destructive'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: (
      <>
        <CheckCircle className="size-4" />
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>
          Your changes have been saved successfully.
        </AlertDescription>
      </>
    ),
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: (
      <>
        <AlertCircle className="size-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          There was a problem with your request. Please try again.
        </AlertDescription>
      </>
    ),
  },
};

export const WithIcon: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Alert variant="default">
        <CheckCircle className="size-4" />
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>
          Operation completed successfully.
        </AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Something went wrong. Please contact support.
        </AlertDescription>
      </Alert>
      <Alert variant="default">
        <Info className="size-4" />
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>
          Here's some important information you should know.
        </AlertDescription>
      </Alert>
      <Alert variant="default">
        <AlertTriangle className="size-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          Please review your input before proceeding.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

export const WithoutTitle: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Alert variant="default">
        <AlertDescription>
          This is an alert without a title.
        </AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertDescription>
          This is a destructive alert without a title.
        </AlertDescription>
      </Alert>
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
