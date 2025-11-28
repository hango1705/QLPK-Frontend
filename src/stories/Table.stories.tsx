import type { Meta, StoryObj } from '@storybook/react';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Tag } from 'antd';

const meta: Meta<typeof Table> = {
  title: 'UI/Table',
  component: Table,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'striped', 'bordered'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    loading: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleData = [
  {
    key: '1',
    name: 'Nguyễn Văn A',
    age: 32,
    address: 'Hà Nội',
    status: 'active',
    appointment: '2024-01-15',
  },
  {
    key: '2',
    name: 'Lê Thị B',
    age: 28,
    address: 'TP.HCM',
    status: 'pending',
    appointment: '2024-01-16',
  },
  {
    key: '3',
    name: 'Trần Văn C',
    age: 45,
    address: 'Đà Nẵng',
    status: 'completed',
    appointment: '2024-01-14',
  },
];

const columns = [
  {
    title: 'Tên',
    dataIndex: 'name',
    key: 'name',
    sorter: (a: any, b: any) => a.name.localeCompare(b.name),
  },
  {
    title: 'Tuổi',
    dataIndex: 'age',
    key: 'age',
    sorter: (a: any, b: any) => a.age - b.age,
  },
  {
    title: 'Địa chỉ',
    dataIndex: 'address',
    key: 'address',
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => {
      const color = status === 'active' ? 'green' : status === 'pending' ? 'orange' : 'blue';
      const text = status === 'active' ? 'Hoạt động' : status === 'pending' ? 'Chờ xử lý' : 'Hoàn thành';
      return <Tag color={color}>{text}</Tag>;
    },
  },
  {
    title: 'Lịch hẹn',
    dataIndex: 'appointment',
    key: 'appointment',
    sorter: (a: any, b: any) => new Date(a.appointment).getTime() - new Date(b.appointment).getTime(),
  },
  {
    title: 'Hành động',
    key: 'action',
    render: () => (
      <div className="flex gap-2">
        <Button size="sm" variant="ghost">Xem</Button>
        <Button size="sm" variant="outline">Sửa</Button>
      </div>
    ),
  },
];

export const Default: Story = {
  args: {
    columns,
    dataSource: sampleData,
  },
};

export const Striped: Story = {
  args: {
    variant: 'striped',
    columns,
    dataSource: sampleData,
  },
};

export const Bordered: Story = {
  args: {
    variant: 'bordered',
    columns,
    dataSource: sampleData,
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    columns,
    dataSource: [],
  },
};

export const Empty: Story = {
  args: {
    columns,
    dataSource: [],
    emptyText: 'Không có dữ liệu để hiển thị',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold mb-4">Small Size</h3>
        <Table size="sm" columns={columns} dataSource={sampleData} />
      </div>
      <div>
        <h3 className="text-lg font-bold mb-4">Medium Size</h3>
        <Table size="md" columns={columns} dataSource={sampleData} />
      </div>
      <div>
        <h3 className="text-lg font-bold mb-4">Large Size</h3>
        <Table size="lg" columns={columns} dataSource={sampleData} />
      </div>
    </div>
  ),
};

export const WithPagination: Story = {
  args: {
    columns,
    dataSource: [...sampleData, ...sampleData, ...sampleData], // More data for pagination
    pagination: {
      pageSize: 5,
      showSizeChanger: true,
      showQuickJumper: true,
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold mb-4">Default</h3>
        <Table columns={columns} dataSource={sampleData} />
      </div>
      <div>
        <h3 className="text-lg font-bold mb-4">Striped</h3>
        <Table variant="striped" columns={columns} dataSource={sampleData} />
      </div>
      <div>
        <h3 className="text-lg font-bold mb-4">Bordered</h3>
        <Table variant="bordered" columns={columns} dataSource={sampleData} />
      </div>
    </div>
  ),
};
