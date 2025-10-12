import type { Meta, StoryObj } from '@storybook/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SmileOutlined } from '@ant-design/icons';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'elevated', 'outlined', 'filled'],
    },
    padding: {
      control: { type: 'select' },
      options: ['none', 'sm', 'md', 'lg'],
    },
    hoverable: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <SmileOutlined className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Nha khoa tổng quát</h3>
            <p className="text-primary font-semibold">Dịch vụ chuyên nghiệp</p>
          </div>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Khám tổng quát, làm sạch răng và các điều trị phòng ngừa toàn diện.
        </p>
        <Button variant="ghost" className="p-0 h-auto">
          Tìm hiểu thêm →
        </Button>
      </div>
    ),
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground">Card Title</h3>
        <p className="text-muted-foreground">
          This is an elevated card with shadow effects.
        </p>
        <Button variant="primary">Action</Button>
      </div>
    ),
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground">Card Title</h3>
        <p className="text-muted-foreground">
          This card has a prominent border.
        </p>
        <Button variant="outline">Action</Button>
      </div>
    ),
  },
};

export const Filled: Story = {
  args: {
    variant: 'filled',
    children: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground">Card Title</h3>
        <p className="text-muted-foreground">
          This card has a filled background.
        </p>
        <Button variant="primary">Action</Button>
      </div>
    ),
  },
};

export const Hoverable: Story = {
  args: {
    variant: 'elevated',
    hoverable: true,
    children: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground">Hoverable Card</h3>
        <p className="text-muted-foreground">
          Hover over this card to see the effect.
        </p>
        <Button variant="primary">Action</Button>
      </div>
    ),
  },
};

export const PaddingVariants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Card padding="sm">
        <h3 className="font-bold">Small Padding</h3>
        <p className="text-sm">Content with small padding</p>
      </Card>
      <Card padding="md">
        <h3 className="font-bold">Medium Padding</h3>
        <p className="text-sm">Content with medium padding</p>
      </Card>
      <Card padding="lg">
        <h3 className="font-bold">Large Padding</h3>
        <p className="text-sm">Content with large padding</p>
      </Card>
      <Card padding="none">
        <div className="p-4 bg-muted/30">
          <h3 className="font-bold">No Padding</h3>
          <p className="text-sm">Content with custom padding</p>
        </div>
      </Card>
    </div>
  ),
};
