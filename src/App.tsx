import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// 1. Import thêm component "App" từ antd và đổi tên thành AntApp để tránh trùng lặp
import { ConfigProvider, App as AntApp } from 'antd';
import HomePage from './pages/Homepage/index';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0EA5E9',
          colorSuccess: '#10B981',
          borderRadius: 12,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  </QueryClientProvider>
);

export default App;
