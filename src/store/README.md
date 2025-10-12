# State Management & API Layer

Hệ thống quản lý state và API layer hoàn chỉnh cho dự án QLPK Frontend, được xây dựng với Redux Toolkit, React Query, Axios và custom hooks.

## 🏗️ Kiến trúc

### Redux Store
- **Redux Toolkit**: State management với RTK Query
- **Redux Persist**: Lưu trữ state trong localStorage
- **TypeScript**: Type-safe state management

### API Layer
- **Axios**: HTTP client với interceptors
- **React Query**: Data fetching và caching
- **Error Handling**: Centralized error management
- **Token Management**: Auto refresh và retry logic

### Custom Hooks
- **useAuth**: Authentication management
- **useUser**: User profile management
- **useApi**: API data fetching hooks
- **useUtils**: Utility hooks (localStorage, debounce, etc.)

## 📦 Cài đặt

```bash
npm install
```

## 🚀 Sử dụng

### Authentication

```tsx
import { useAuth } from '@/hooks';

const LoginComponent = () => {
  const { login, logout, user, isAuthenticated, isLoading } = useAuth();

  const handleLogin = async () => {
    await login({ email: 'user@example.com', password: 'password' });
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.name}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin} disabled={isLoading}>
          Login
        </button>
      )}
    </div>
  );
};
```

### User Profile Management

```tsx
import { useUser } from '@/hooks';

const ProfileComponent = () => {
  const { profile, updateProfile, isUpdating } = useUser();

  const handleUpdate = async () => {
    await updateProfile('userId', { name: 'New Name' });
  };

  return (
    <div>
      <h1>{profile?.name}</h1>
      <button onClick={handleUpdate} disabled={isUpdating}>
        Update Profile
      </button>
    </div>
  );
};
```

### API Data Fetching

```tsx
import { useUserProfile } from '@/hooks';

const UserProfile = ({ userId }: { userId: string }) => {
  const { data: profile, isLoading, error } = useUserProfile(userId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{profile?.name}</div>;
};
```

## 🔧 Cấu hình

### Environment Variables

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### Redux Store Configuration

```tsx
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Only persist auth slice
};

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});
```

### Axios Configuration

```tsx
// src/services/api/client.ts
const apiClient = axios.create({
  baseURL: process.env.VITE_API_BASE_URL,
  timeout: 10000,
});

// Request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh
      await store.dispatch(refreshToken());
    }
    return Promise.reject(error);
  }
);
```

## 📁 Cấu trúc thư mục

```
src/
├── store/
│   ├── index.ts              # Store configuration
│   ├── hooks.ts              # Typed Redux hooks
│   └── slices/
│       ├── authSlice.ts      # Authentication state
│       └── userSlice.ts      # User profile state
├── services/
│   ├── queryClient.ts        # React Query configuration
│   └── api/
│       ├── client.ts         # Axios instance
│       ├── auth.ts           # Auth API endpoints
│       └── user.ts           # User API endpoints
├── hooks/
│   ├── useAuth.ts           # Authentication hooks
│   ├── useApi.ts            # API data fetching hooks
│   └── useUtils.ts          # Utility hooks
└── components/
    └── ErrorBoundary.tsx    # Error boundary component
```

## 🎯 Tính năng

### Authentication
- ✅ Login/Register với validation
- ✅ Token management với auto refresh
- ✅ Persistent authentication state
- ✅ Role-based access control
- ✅ Logout với cleanup

### User Management
- ✅ Profile CRUD operations
- ✅ Avatar upload
- ✅ Password change
- ✅ Account deletion
- ✅ Medical history management

### API Features
- ✅ Automatic token refresh
- ✅ Request/Response interceptors
- ✅ Error handling với user-friendly messages
- ✅ Loading states
- ✅ Retry logic cho failed requests
- ✅ Request cancellation

### State Management
- ✅ Redux Toolkit với RTK Query
- ✅ Redux Persist cho authentication
- ✅ TypeScript support
- ✅ DevTools integration
- ✅ Optimistic updates

### Error Handling
- ✅ Global error boundary
- ✅ API error interceptors
- ✅ User-friendly error messages
- ✅ Error logging
- ✅ Fallback UI

## 🔒 Security

- **Token Storage**: Secure token storage với httpOnly cookies
- **CSRF Protection**: CSRF tokens cho sensitive operations
- **Input Validation**: Client-side và server-side validation
- **XSS Protection**: Sanitized input handling
- **Rate Limiting**: API rate limiting

## 📊 Performance

- **Caching**: React Query caching với smart invalidation
- **Optimistic Updates**: Immediate UI updates
- **Code Splitting**: Lazy loading cho routes
- **Bundle Optimization**: Tree shaking và minification
- **Memory Management**: Proper cleanup và garbage collection

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📝 Best Practices

1. **State Normalization**: Normalize nested data structures
2. **Error Boundaries**: Wrap components với error boundaries
3. **Loading States**: Always show loading states
4. **Optimistic Updates**: Update UI immediately khi possible
5. **Cache Management**: Proper cache invalidation
6. **Type Safety**: Use TypeScript cho type safety
7. **Error Handling**: Handle errors gracefully
8. **Performance**: Monitor và optimize performance

## 🚀 Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📚 Tài liệu tham khảo

- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Axios Documentation](https://axios-http.com/docs/intro)
- [Redux Persist Documentation](https://github.com/rt2zz/redux-persist)

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết.
