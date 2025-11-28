import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'centered', 'fullscreen'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const ModalWrapper = ({ children, ...props }: any) => {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      <Modal
        {...props}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => setOpen(false)}
      >
        {children}
      </Modal>
    </>
  );
};

export const Default: Story = {
  render: (args) => (
    <ModalWrapper {...args}>
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground">Modal Title</h3>
        <p className="text-muted-foreground">
          This is a default modal with standard styling.
        </p>
      </div>
    </ModalWrapper>
  ),
};

export const Centered: Story = {
  render: (args) => (
    <ModalWrapper {...args} variant="centered">
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground">Centered Modal</h3>
        <p className="text-muted-foreground">
          This modal is centered on the screen.
        </p>
      </div>
    </ModalWrapper>
  ),
};

export const Fullscreen: Story = {
  render: (args) => (
    <ModalWrapper {...args} variant="fullscreen">
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground">Fullscreen Modal</h3>
        <p className="text-muted-foreground">
          This modal takes up the full screen.
        </p>
      </div>
    </ModalWrapper>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex gap-4">
      <ModalWrapper size="sm">
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Small Modal</h3>
          <p>This is a small modal.</p>
        </div>
      </ModalWrapper>
      <ModalWrapper size="md">
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Medium Modal</h3>
          <p>This is a medium modal.</p>
        </div>
      </ModalWrapper>
      <ModalWrapper size="lg">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold">Large Modal</h3>
          <p>This is a large modal.</p>
        </div>
      </ModalWrapper>
      <ModalWrapper size="xl">
        <div className="space-y-4">
          <h3 className="text-3xl font-bold">Extra Large Modal</h3>
          <p>This is an extra large modal.</p>
        </div>
      </ModalWrapper>
    </div>
  ),
};

export const AppointmentModal: Story = {
  render: (args) => (
    <ModalWrapper {...args} title="Đặt lịch hẹn" width={600}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Họ và tên
            </label>
            <input 
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Nhập họ và tên"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Số điện thoại
            </label>
            <input 
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Nhập số điện thoại"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Dịch vụ
          </label>
          <select className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
            <option>Nha khoa tổng quát</option>
            <option>Nha khoa thẩm mỹ</option>
            <option>Chỉnh nha</option>
            <option>Cấp cứu nha khoa</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Ghi chú
          </label>
          <textarea 
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
            placeholder="Nhập ghi chú (nếu có)"
          />
        </div>
      </div>
    </ModalWrapper>
  ),
};
