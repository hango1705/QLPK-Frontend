import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '@/components/ui/Input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'filled', 'outlined'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    error: {
      control: { type: 'boolean' },
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Nhập nội dung...',
  },
};

export const Filled: Story = {
  args: {
    variant: 'filled',
    placeholder: 'Filled input...',
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    placeholder: 'Outlined input...',
  },
};

export const WithHelperText: Story = {
  args: {
    placeholder: 'Input with helper text',
    helperText: 'This is helpful information',
  },
};

export const WithError: Story = {
  args: {
    placeholder: 'Input with error',
    error: true,
    helperText: 'This field is required',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input size="sm" placeholder="Small input" />
      <Input size="md" placeholder="Medium input" />
      <Input size="lg" placeholder="Large input" />
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input variant="default" placeholder="Default variant" />
      <Input variant="filled" placeholder="Filled variant" />
      <Input variant="outlined" placeholder="Outlined variant" />
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Họ và tên
        </label>
        <Input placeholder="Nhập họ và tên" />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Email
        </label>
        <Input type="email" placeholder="Nhập email" />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Số điện thoại
        </label>
        <Input placeholder="Nhập số điện thoại" helperText="Số điện thoại để liên hệ" />
      </div>
    </div>
  ),
};
