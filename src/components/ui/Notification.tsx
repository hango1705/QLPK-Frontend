import { notification } from 'antd';

export const showNotification = {
  success: (message: string, description?: string) => {
    notification.success({
      message,
      description,
      placement: 'topRight',
      duration: 4,
    });
  },
  error: (message: string, description?: string) => {
    notification.error({
      message,
      description,
      placement: 'topRight',
      duration: 4,
    });
  },
  info: (message: string, description?: string) => {
    notification.info({
      message,
      description,
      placement: 'topRight',
      duration: 4,
    });
  },
  warning: (message: string, description?: string) => {
    notification.warning({
      message,
      description,
      placement: 'topRight',
      duration: 4,
    });
  },
};
