import { App } from 'antd';

// Hook-based notification functions that can consume context
export const useNotification = () => {
  const { notification } = App.useApp();

  return {
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
};

// Legacy static functions for backward compatibility (deprecated)
import { notification as staticNotification } from 'antd';

export const showNotification = {
  success: (message: string, description?: string) => {
    staticNotification.success({
      message,
      description,
      placement: 'topRight',
      duration: 4,
    });
  },
  error: (message: string, description?: string) => {
    staticNotification.error({
      message,
      description,
      placement: 'topRight',
      duration: 4,
    });
  },
  info: (message: string, description?: string) => {
    staticNotification.info({
      message,
      description,
      placement: 'topRight',
      duration: 4,
    });
  },
  warning: (message: string, description?: string) => {
    staticNotification.warning({
      message,
      description,
      placement: 'topRight',
      duration: 4,
    });
  },
};
