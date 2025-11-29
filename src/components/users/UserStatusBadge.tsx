import { Badge } from '@/components/ui/badge';

interface UserStatusBadgeProps {
  readonly status: 'active' | 'inactive' | 'suspended' | 'pending' | undefined;
}

const statusConfig = {
  active: {
    label: 'Activo',
    className: 'bg-green-100 text-green-800 hover:bg-green-200',
    icon: '✓'
  },
  inactive: {
    label: 'Inactivo',
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    icon: '⏸️'
  },
  suspended: {
    label: 'Suspendido',
    className: 'bg-red-100 text-red-800 hover:bg-red-200',
    icon: '⛔'
  },
  pending: {
    label: 'Pendiente',
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    icon: '⏳'
  },
  undefined: {
    label: 'Desconocido',
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    icon: '❓'
  }
} as const;

export function UserStatusBadge({ status }: Readonly<UserStatusBadgeProps>) {
  const config = status ? statusConfig[status] : statusConfig.undefined;
  
  return (
    <Badge className={config.className}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  );
}
