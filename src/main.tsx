import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'antd/dist/reset.css';

// Capture VNPay callback query params as early as possible to avoid losing them
if (window.location.pathname.includes('/payment/paymentCallback') && window.location.search) {
  sessionStorage.setItem('vnpay_callback_search', window.location.search);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
