/**
 * Utility functions for Patient Dashboard
 */

/**
 * Extract username from JWT token
 */
export function getUsernameFromToken(token: string): string | null {
  if (!token) return null;
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const decoded = JSON.parse(atob(payload));
    return decoded.sub || null;
  } catch {
    return null;
  }
}

/**
 * Format backend date and time to display format
 */
export const formatBackendDateTime = (date: string, time: string) => {
  if (!date || !time) return '';
  const [y, m, d] = date.split('-');
  return `${time} ${d}/${m}/${y}`;
};

/**
 * Format date to Vietnamese locale
 */
export const formatDate = (d?: string) => {
  if (!d) return '';
  try {
    const date = new Date(d);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  } catch {}
  return d;
};

/**
 * Format date and time to Vietnamese locale
 */
export const formatDateTime = (dt?: string) => {
  if (!dt) return '';
  try {
    const d = new Date(dt);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  } catch {}
  return dt;
};

/**
 * Format currency to Vietnamese Dong
 */
export const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return '0 đ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Normalize dateTime from backend (ISO or HH:mm dd/MM/yyyy) to 'HH:mm dd/MM/yyyy'
 */
export const normalizeDateTime = (dt: string): string => {
  if (!dt) return '';
  // If already in format 'HH:mm dd/MM/yyyy', return as is
  if (/^\d{2}:\d{2}\s\d{2}\/\d{2}\/\d{4}$/.test(dt)) return dt;
  // Try to parse ISO format (2025-10-21T13:00:00 or 2025-10-21T13:00:00.000)
  try {
    const d = new Date(dt);
    if (!isNaN(d.getTime())) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${hours}:${minutes} ${day}/${month}/${year}`;
    }
  } catch {}
  return dt;
};

/**
 * Get status color class for badges
 */
export const getStatusColor = (status: string): string => {
  const s = (status || '').toLowerCase();
  if (s.includes('done') || s.includes('completed')) {
    return 'bg-green-500/10 text-green-600 border-green-200';
  }
  if (s.includes('scheduled') || s.includes('planned')) {
    return 'bg-blue-500/10 text-blue-600 border-blue-200';
  }
  if (s.includes('cancel') || s.includes('cancelled')) {
    return 'bg-red-500/10 text-red-600 border-red-200';
  }
  if (s.includes('in-progress') || s.includes('progress')) {
    return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
  }
  return 'bg-gray-500/10 text-gray-600 border-gray-200';
};

/**
 * Get status label in Vietnamese
 */
export const getStatusLabel = (status: string): string => {
  const s = (status || '').toLowerCase();
  if (s.includes('done') || s.includes('completed')) return 'Hoàn thành';
  if (s.includes('scheduled')) return 'Đã lên lịch';
  if (s.includes('cancel') || s.includes('cancelled')) return 'Đã hủy';
  if (s.includes('in-progress') || s.includes('progress')) return 'Đang điều trị';
  if (s.includes('planned')) return 'Đã lên kế hoạch';
  return status || 'N/A';
};

