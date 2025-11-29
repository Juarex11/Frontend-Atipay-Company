import type { InvestmentStatus } from '../../types';

interface StatusBadgeProps {
  status: InvestmentStatus;
  className?: string;
}

export const StatusBadge = ({ status, className = '' }: StatusBadgeProps) => {
  const statusConfig = {
    active: {
      text: 'Activo',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    },
    pending: {
      text: 'Pendiente',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    },
    completed: {
      text: 'Completado',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    },
    rejected: {
      text: 'Rechazado',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    },
    cancelled: {
      text: 'Cancelado',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    },
  };

  const config = statusConfig[status] || {
    text: 'Desconocido',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-1 ${config.className} ${className}`}
    >
      {config.text}
    </span>
  );
};
