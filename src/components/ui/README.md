# UI Components Library

Thư viện components UI tùy chỉnh cho dự án QLPK Frontend, được xây dựng trên nền tảng Ant Design và Tailwind CSS.

## 🚀 Cài đặt

```bash
npm install
```

## 📦 Components

### Button
Component button với nhiều variants và sizes khác nhau.

```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="lg">Primary Button</Button>
<Button variant="secondary" size="md">Secondary Button</Button>
<Button variant="outline" size="sm">Outline Button</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean
- `disabled`: boolean

### Card
Component card với các variants và padding options.

```tsx
import { Card } from '@/components/ui';

<Card variant="elevated" hoverable padding="lg">
  <h3>Card Title</h3>
  <p>Card content</p>
</Card>
```

**Props:**
- `variant`: 'default' | 'elevated' | 'outlined' | 'filled'
- `padding`: 'none' | 'sm' | 'md' | 'lg'
- `hoverable`: boolean

### Input
Component input với validation và helper text.

```tsx
import { Input } from '@/components/ui';

<Input 
  variant="outlined" 
  placeholder="Nhập nội dung..."
  helperText="Thông tin hướng dẫn"
/>
```

**Props:**
- `variant`: 'default' | 'filled' | 'outlined'
- `size`: 'sm' | 'md' | 'lg'
- `error`: boolean
- `helperText`: string

### Modal
Component modal với các variants và sizes.

```tsx
import { Modal } from '@/components/ui';

<Modal variant="centered" size="lg" title="Modal Title">
  <p>Modal content</p>
</Modal>
```

**Props:**
- `variant`: 'default' | 'centered' | 'fullscreen'
- `size`: 'sm' | 'md' | 'lg' | 'xl'

### Loading & Spinner
Components loading với nhiều variants.

```tsx
import { Loading, Spinner } from '@/components/ui';

<Loading size="lg" text="Đang tải..." />
<Spinner size="md" />
```

**Props:**
- `size`: 'sm' | 'md' | 'lg'
- `variant`: 'spinner' | 'dots' | 'pulse'
- `text`: string

### Alert & Notification
Components alert và notification system.

```tsx
import { Alert, showNotification } from '@/components/ui';

<Alert variant="success" message="Thành công!" />
showNotification.success('Thành công!', 'Dữ liệu đã được lưu.');
```

**Props:**
- `variant`: 'success' | 'info' | 'warning' | 'error'
- `size`: 'sm' | 'md' | 'lg'
- `closable`: boolean

### Table
Component table với sorting và pagination.

```tsx
import { Table } from '@/components/ui';

<Table 
  columns={columns} 
  dataSource={data} 
  variant="striped"
  size="md"
/>
```

**Props:**
- `variant`: 'default' | 'striped' | 'bordered'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean
- `emptyText`: string

## 🎨 Design System

### Colors
- **Primary**: Dental Blue (#0EA5E9)
- **Secondary**: Mint Green (#10B981)
- **Accent**: Light Green (#4ADE80)
- **Destructive**: Red (#EF4444)

### Typography
- **Font Family**: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
- **Sizes**: sm (14px), md (16px), lg (18px)

### Spacing
- **Padding**: none, sm (16px), md (24px), lg (32px)
- **Border Radius**: sm (4px), md (8px), lg (12px)

## 📚 Storybook

Chạy Storybook để xem tài liệu và examples:

```bash
npm run storybook
```

Truy cập: http://localhost:6006

## 🛠️ Development

### Cấu trúc thư mục
```
src/components/ui/
├── Button.tsx
├── Card.tsx
├── Input.tsx
├── Modal.tsx
├── Loading.tsx
├── Alert.tsx
├── Table.tsx
└── index.ts
```

### Utilities
- `cn()`: Utility function để merge className với Tailwind CSS
- Design tokens được định nghĩa trong `src/index.css`

## 🎯 Best Practices

1. **Consistent Styling**: Luôn sử dụng design tokens và utility classes
2. **Accessibility**: Tất cả components đều hỗ trợ accessibility
3. **TypeScript**: Đầy đủ type definitions cho tất cả props
4. **Responsive**: Components responsive trên mọi screen sizes
5. **Performance**: Optimized với React.memo và proper ref forwarding

## 🔧 Customization

Để customize components, bạn có thể:

1. **Override CSS classes**: Sử dụng `className` prop
2. **Modify design tokens**: Cập nhật CSS custom properties trong `src/index.css`
3. **Extend components**: Tạo wrapper components cho specific use cases

## 📝 License

MIT License - Xem file LICENSE để biết thêm chi tiết.
