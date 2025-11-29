// Formateador de moneda en Soles Peruanos (PEN)
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'completed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

export const getPlanColor = (type: string) => {
  switch (type) {
    case 'basic':
      return 'from-blue-500 to-blue-600';
    case 'premium':
      return 'from-purple-500 to-purple-600';
    case 'vip':
      return 'from-amber-500 to-amber-600';
    default:
      return 'from-gray-500 to-gray-600';
  }
};

export const getPlanBgColor = (type: string) => {
  switch (type) {
    case 'basic':
      return 'bg-blue-500 dark:bg-blue-600';
    case 'premium':
      return 'bg-purple-500 dark:bg-purple-600';
    case 'vip':
      return 'bg-amber-500 dark:bg-amber-600';
    default:
      return 'bg-gray-500 dark:bg-gray-600';
  }
};
