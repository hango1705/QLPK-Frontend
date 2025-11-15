import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

// Common chart colors
export const chartColors = {
  primary: 'rgb(59, 130, 246)', // blue-500
  secondary: 'rgb(16, 185, 129)', // green-500
  accent: 'rgb(139, 92, 246)', // purple-500
  warning: 'rgb(245, 158, 11)', // amber-500
  danger: 'rgb(239, 68, 68)', // rose-500
  info: 'rgb(14, 165, 233)', // sky-500
  muted: 'rgb(156, 163, 175)', // gray-400
};

// Chart color palettes
export const colorPalettes = {
  primary: [
    'rgba(59, 130, 246, 0.8)', // blue-500
    'rgba(37, 99, 235, 0.8)', // blue-600
    'rgba(29, 78, 216, 0.8)', // blue-700
  ],
  gradient: [
    'rgba(59, 130, 246, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(245, 158, 11, 0.8)',
  ],
  pastel: [
    'rgba(147, 197, 253, 0.8)', // blue-300
    'rgba(134, 239, 172, 0.8)', // green-300
    'rgba(196, 181, 253, 0.8)', // purple-300
    'rgba(253, 224, 71, 0.8)', // yellow-300
  ],
};

// Common chart options
export const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 1000,
    easing: 'easeInOutQuart' as const,
  },
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 15,
        font: {
          size: 12,
          family: 'Inter, sans-serif',
          weight: '500',
        },
        color: 'rgb(55, 65, 81)',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      padding: 12,
      titleFont: {
        size: 14,
        weight: 'bold' as const,
        family: 'Inter, sans-serif',
      },
      bodyFont: {
        size: 13,
        family: 'Inter, sans-serif',
      },
      cornerRadius: 8,
      displayColors: true,
      titleSpacing: 4,
      bodySpacing: 4,
      callbacks: {
        label: function (context: any) {
          const label = context.dataset.label || '';
          const value = context.parsed.y !== null ? context.parsed.y : context.parsed;
          return `${label}: ${value}`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          size: 11,
          family: 'Inter, sans-serif',
        },
        color: 'rgb(107, 114, 128)',
        padding: 8,
      },
    },
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
        drawBorder: false,
      },
      ticks: {
        font: {
          size: 11,
          family: 'Inter, sans-serif',
        },
        color: 'rgb(107, 114, 128)',
        padding: 8,
      },
      beginAtZero: true,
    },
  },
};

// Bar chart specific options
export const barChartOptions = {
  ...commonChartOptions,
  elements: {
    bar: {
      borderRadius: 8,
      borderSkipped: false,
    },
  },
  plugins: {
    ...commonChartOptions.plugins,
    legend: {
      ...commonChartOptions.plugins.legend,
      display: false,
    },
    tooltip: {
      ...commonChartOptions.plugins.tooltip,
      callbacks: {
        label: function (context: any) {
          const label = context.dataset.label || '';
          const value = context.parsed.y;
          return `${label}: ${value} hoạt động`;
        },
      },
    },
  },
};

// Line chart specific options
export const lineChartOptions = {
  ...commonChartOptions,
  elements: {
    line: {
      tension: 0.4,
      borderWidth: 2.5,
      fill: true,
    },
    point: {
      radius: 4,
      hoverRadius: 7,
      hoverBorderWidth: 2,
      borderWidth: 2,
    },
  },
  plugins: {
    ...commonChartOptions.plugins,
    legend: {
      ...commonChartOptions.plugins.legend,
      display: true,
      position: 'top' as const,
    },
  },
};

// Doughnut/Pie chart specific options
export const doughnutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 1200,
    easing: 'easeInOutQuart' as const,
    animateRotate: true,
    animateScale: true,
  },
  interaction: {
    intersect: false,
  },
  plugins: {
    legend: {
      display: true,
      position: 'right' as const,
      labels: {
        usePointStyle: true,
        padding: 15,
        font: {
          size: 12,
          family: 'Inter, sans-serif',
          weight: '500',
        },
        color: 'rgb(55, 65, 81)',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      padding: 12,
      titleFont: {
        size: 14,
        weight: 'bold' as const,
        family: 'Inter, sans-serif',
      },
      bodyFont: {
        size: 13,
        family: 'Inter, sans-serif',
      },
      cornerRadius: 8,
      titleSpacing: 4,
      bodySpacing: 4,
      callbacks: {
        label: function (context: any) {
          const label = context.label || '';
          const value = context.parsed || 0;
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
          return `${label}: ${value} (${percentage}%)`;
        },
      },
    },
  },
};

