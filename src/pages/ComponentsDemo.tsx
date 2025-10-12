import React, { useState } from 'react';
import { 
  Button, 
  Card, 
  Input, 
  Modal, 
  Loading, 
  Alert, 
  Table,
  showNotification 
} from '@/components/ui';
import { CalendarOutlined, SmileOutlined } from '@ant-design/icons';

const ComponentsDemo = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleShowNotification = (type: 'success' | 'error' | 'warning' | 'info') => {
    showNotification[type](
      `${type.charAt(0).toUpperCase() + type.slice(1)} Notification`,
      'This is a demo notification message'
    );
  };

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  const tableData = [
    { key: '1', name: 'Nguyễn Văn A', age: 32, status: 'active' },
    { key: '2', name: 'Lê Thị B', age: 28, status: 'pending' },
    { key: '3', name: 'Trần Văn C', age: 45, status: 'completed' },
  ];

  const tableColumns = [
    { title: 'Tên', dataIndex: 'name', key: 'name' },
    { title: 'Tuổi', dataIndex: 'age', key: 'age' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status' },
  ];

  return (
    <div className="min-h-screen bg-gradient-fresh py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            UI Components Library
          </h1>
          <p className="text-xl text-muted-foreground">
            Thư viện components tùy chỉnh cho dự án QLPK Frontend
          </p>
        </div>

        {/* Buttons Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">Buttons</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="mt-4 flex gap-4">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
          <div className="mt-4 flex gap-4">
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button variant="primary" icon={<CalendarOutlined />}>
              With Icon
            </Button>
          </div>
        </section>

        {/* Cards Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">Cards</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="default" padding="lg">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <SmileOutlined className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Default Card</h3>
                <p className="text-muted-foreground">This is a default card with standard styling.</p>
              </div>
            </Card>
            <Card variant="elevated" hoverable padding="lg">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <SmileOutlined className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-bold">Elevated Card</h3>
                <p className="text-muted-foreground">This card has elevated styling and hover effects.</p>
              </div>
            </Card>
            <Card variant="outlined" padding="lg">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <SmileOutlined className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-bold">Outlined Card</h3>
                <p className="text-muted-foreground">This card has a prominent border.</p>
              </div>
            </Card>
            <Card variant="filled" padding="lg">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <SmileOutlined className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Filled Card</h3>
                <p className="text-muted-foreground">This card has a filled background.</p>
              </div>
            </Card>
          </div>
        </section>

        {/* Inputs Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">Inputs</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Input placeholder="Default input" />
              <Input variant="filled" placeholder="Filled input" />
              <Input variant="outlined" placeholder="Outlined input" />
              <Input placeholder="Input with helper text" helperText="This is helpful information" />
              <Input placeholder="Input with error" error helperText="This field is required" />
            </div>
            <div className="space-y-4">
              <Input size="sm" placeholder="Small input" />
              <Input size="md" placeholder="Medium input" />
              <Input size="lg" placeholder="Large input" />
              <Input disabled placeholder="Disabled input" />
            </div>
          </div>
        </section>

        {/* Alerts Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">Alerts & Notifications</h2>
          <div className="space-y-4 mb-8">
            <Alert variant="success" message="Success!" description="Operation completed successfully." />
            <Alert variant="info" message="Information" description="Here's some important information." />
            <Alert variant="warning" message="Warning" description="Please check your input before proceeding." />
            <Alert variant="error" message="Error" description="Something went wrong. Please try again." />
          </div>
          <div className="flex gap-4">
            <Button onClick={() => handleShowNotification('success')}>Success Notification</Button>
            <Button onClick={() => handleShowNotification('error')}>Error Notification</Button>
            <Button onClick={() => handleShowNotification('warning')}>Warning Notification</Button>
            <Button onClick={() => handleShowNotification('info')}>Info Notification</Button>
          </div>
        </section>

        {/* Loading Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">Loading & Spinners</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Loading size="sm" text="Small loading" />
            </div>
            <div className="text-center">
              <Loading size="md" text="Medium loading" />
            </div>
            <div className="text-center">
              <Loading size="lg" text="Large loading" />
            </div>
          </div>
          <div className="mt-8 text-center">
            <Button onClick={handleLoadingDemo} loading={loading}>
              {loading ? 'Loading...' : 'Start Loading Demo'}
            </Button>
          </div>
        </section>

        {/* Table Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">Table</h2>
          <Table 
            columns={tableColumns} 
            dataSource={tableData}
            variant="striped"
            size="md"
          />
        </section>

        {/* Modal Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">Modal</h2>
          <div className="flex gap-4">
            <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          </div>
          <Modal
            open={modalOpen}
            onCancel={() => setModalOpen(false)}
            onOk={() => setModalOpen(false)}
            title="Demo Modal"
            variant="centered"
            size="md"
          >
            <div className="space-y-4">
              <p className="text-muted-foreground">
                This is a demo modal showcasing the custom Modal component.
              </p>
              <Input placeholder="Enter some text..." />
              <div className="flex gap-2">
                <Button variant="primary">Save</Button>
                <Button variant="outline">Cancel</Button>
              </div>
            </div>
          </Modal>
        </section>

        {/* Footer */}
        <div className="text-center text-muted-foreground">
          <p>UI Components Library - Built with React, TypeScript, Ant Design & Tailwind CSS</p>
        </div>
      </div>
    </div>
  );
};

export default ComponentsDemo;
