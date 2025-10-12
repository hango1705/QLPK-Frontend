import type { Meta, StoryObj } from '@storybook/react';
import { Loading, Spinner } from '@/components/ui/Loading';

const meta: Meta<typeof Loading> = {
  title: 'UI/Loading',
  component: Loading,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    variant: {
      control: { type: 'select' },
      options: ['spinner', 'dots', 'pulse'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    text: 'Đang tải...',
  },
};

export const WithText: Story = {
  args: {
    text: 'Đang xử lý yêu cầu của bạn',
  },
};

export const WithoutText: Story = {
  args: {},
};

export const Sizes: Story = {
  render: () => (
    <div className="flex gap-8 items-center">
      <Loading size="sm" text="Small" />
      <Loading size="md" text="Medium" />
      <Loading size="lg" text="Large" />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex gap-8 items-center">
      <Loading variant="spinner" text="Spinner" />
      <Loading variant="dots" text="Dots" />
      <Loading variant="pulse" text="Pulse" />
    </div>
  ),
};

export const SpinnerComponent: Story = {
  render: () => (
    <div className="flex gap-8 items-center">
      <div className="text-center">
        <Spinner size="sm" />
        <p className="text-sm text-muted-foreground mt-2">Small</p>
      </div>
      <div className="text-center">
        <Spinner size="md" />
        <p className="text-sm text-muted-foreground mt-2">Medium</p>
      </div>
      <div className="text-center">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground mt-2">Large</p>
      </div>
    </div>
  ),
};

export const LoadingStates: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-lg font-bold mb-4">Page Loading</h3>
        <Loading size="lg" text="Đang tải trang..." />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-bold mb-4">Form Submission</h3>
        <Loading size="md" text="Đang gửi dữ liệu..." />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-bold mb-4">Data Processing</h3>
        <Loading size="sm" text="Đang xử lý..." />
      </div>
    </div>
  ),
};
