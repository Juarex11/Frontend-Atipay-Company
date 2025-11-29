import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AtipayCoin } from '@/components/ui/AtipayCoin';
import type { UserListItem } from '@/services/userManagement.service';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserListItem | null;
}

type RoleType = 'admin' | 'user' | 'partner' | string;

const getRoleBadge = (role: RoleType | { id?: number | string; name?: string } | null) => {
  if (!role) return { variant: 'outline' as const, label: 'Desconocido', className: 'bg-gray-100 text-gray-800' };

  let roleName = '';
  if (typeof role === 'string') {
    roleName = role;
  } else if (role && 'name' in role) {
    roleName = role.name || '';
  } else if (role && 'id' in role && role.id !== undefined) {
    roleName = role.id.toString();
  }

  const roleMap: Record<string, { variant: 'default' | 'secondary' | 'outline'; label: string; className: string }> = {
    admin: {
      variant: 'default',
      label: 'Admin',
      className: 'bg-[#0a7e3e] text-white'
    },
    user: {
      variant: 'secondary',
      label: 'Usuario',
      className: 'bg-blue-100 text-blue-800'
    },
    partner: {
      variant: 'secondary',
      label: 'Socio',
      className: 'bg-purple-100 text-purple-800'
    }
  };

  const roleKey = roleName.toLowerCase();
  return roleMap[roleKey] || {
    variant: 'outline' as const,
    label: roleName,
    className: 'bg-gray-100 text-gray-800'
  };
};

type StatusType = 'active' | 'suspended' | 'pending' | 'inactive' | string;

const getStatusBadge = (status: StatusType) => {
  if (!status) return { variant: 'outline' as const, label: 'Desconocido', className: 'bg-gray-100' };

  const statusMap: Record<string, { variant: 'default' | 'destructive' | 'secondary' | 'outline'; label: string; className: string }> = {
    active: {
      variant: 'default',
      label: 'Activo',
      className: 'bg-green-100 text-green-800'
    },
    suspended: {
      variant: 'destructive',
      label: 'Suspendido',
      className: 'bg-red-100 text-red-800'
    },
    pending: {
      variant: 'secondary',
      label: 'Pendiente',
      className: 'bg-yellow-100 text-yellow-800'
    },
    inactive: {
      variant: 'outline',
      label: 'Inactivo',
      className: 'bg-gray-100 text-gray-800'
    }
  };

  const statusKey = status.toLowerCase();
  return statusMap[statusKey] || {
    variant: 'outline' as const,
    label: status,
    className: 'bg-gray-100 text-gray-800'
  };
};

export const UserDetailsModal = ({ isOpen, onClose, user }: UserDetailsModalProps) => {
  if (!user) return null;

  const roleInfo = getRoleBadge(user.role);
  const statusInfo = getStatusBadge(user.status || '');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Detalles del Usuario</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nombre de Usuario</p>
                <p className="font-medium">{user.username || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rol</p>
                <Badge variant={roleInfo.variant} className={roleInfo.className}>
                  {roleInfo.label}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge variant={statusInfo.variant} className={statusInfo.className}>
                  {statusInfo.label}
                </Badge>
              </div>
              {user.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">ID de Usuario</p>
                <p className="font-mono text-sm">{user.id}</p>
              </div>
            </div>
          </div>

          {/* Saldos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Saldos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Saldo Total</p>
                <div className="flex items-center mt-1">
                  <AtipayCoin size="sm" className="w-5 h-5 mr-2" />
                  <span className="text-xl font-bold">{user.atipay_money || '0.00'}</span>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Saldo Retirable</p>
                <div className="flex items-center mt-1">
                  <AtipayCoin size="sm" className="w-5 h-5 mr-2" />
                  <span className="text-xl font-bold">{user.withdrawable_balance || '0.00'}</span>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Puntos</p>
                <div className="flex items-center mt-1">
                  <span className="text-xl font-bold">{user.accumulated_points || '0'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Información de Referidos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Referidos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Código de Referencia</p>
                <p className="font-mono p-2 bg-gray-50 rounded-md mt-1">
                  {user.reference_code || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Referido por</p>
                <p className="font-medium">
                  {user.referrer?.username ? `@${user.referrer.username}` : 'Ninguno'}
                </p>
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Registro</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Registro</p>
                <p className="font-medium">{user.registration_date || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hora de Registro</p>
                <p className="font-medium">{user.registration_time || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;
