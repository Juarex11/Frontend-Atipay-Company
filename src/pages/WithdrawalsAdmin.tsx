import { useState, useEffect, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { withdrawalService, type Withdrawal as ServiceWithdrawal } from '@/services/withdrawalService';

type WithdrawalStatus = 'pending' | 'approved' | 'rejected';

interface User {
  id: string;
  email: string;
  name?: string;
}

type Withdrawal = ServiceWithdrawal & {
  user: string | User;
  reference_code?: string;
  requestDate?: string | Date;
  priority?: 'high' | 'normal' | 'low';
  status: WithdrawalStatus;
  amount?: number;
  method?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
};

import { AlertCircle } from 'lucide-react';
import { AtipayCoin } from '@/components/ui/AtipayCoin';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  pending: {
    bg: 'bg-blue-600',
    text: 'text-white',
    border: 'border-blue-700'
  },
  approved: {
    bg: 'bg-emerald-600',
    text: 'text-white',
    border: 'border-emerald-700'
  },
  rejected: {
    bg: 'bg-gray-600',
    text: 'text-white',
    border: 'border-gray-700'
  },
  earring: {
    bg: 'bg-blue-600',
    text: 'text-white',
    border: 'border-blue-700'
  }
};

const getStatusText = (status: WithdrawalStatus): string => {
  const statusMap: Record<string, string> = {
    'pending': 'Pendiente',
    'approved': 'Aprobado',
    'rejected': 'Rechazado',
    'earring': 'Pendiente'
  };
  return statusMap[status] || status;
};

const formatDateSafely = (dateString?: string | Date) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Fecha inválida' : format(date, 'PPpp', { locale: es });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Error de fecha';
  }
};

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  declare state: { hasError: boolean };
  declare props: { children: ReactNode };
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error en el componente:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-600 bg-red-50 rounded-md flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>Ocurrió un error al cargar este elemento.</span>
        </div>
      );
    }

    return this.props.children;
  }
}

const WithdrawalRow = ({
  withdrawal,
  onStatusUpdate
}: {
  withdrawal: Withdrawal;
  onStatusUpdate: (withdrawal: Withdrawal, newStatus: 'approved' | 'rejected') => void;
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: 'approved' | 'rejected') => {
    try {
      setIsUpdating(true);
      const updatedWithdrawal = await withdrawalService.updateWithdrawalStatus(
        withdrawal.id.toString(),
        { status: newStatus }
      );
      onStatusUpdate(updatedWithdrawal as Withdrawal, newStatus);
      toast.success(`Retiro ${newStatus === 'approved' ? 'aprobado' : 'rechazado'} correctamente`);
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      toast.error('Error al actualizar el estado del retiro');
    } finally {
      setIsUpdating(false);
    }
  };

  const getUserInfo = () => {
    if (!withdrawal.user) return {
      email: 'Usuario no disponible',
      name: '',
      holder: withdrawal.holder || ''
    };
    if (typeof withdrawal.user === 'string') return {
      email: withdrawal.user,
      name: '',
      holder: withdrawal.holder || ''
    };
    return {
      email: withdrawal.user.email || 'Usuario sin correo',
      name: withdrawal.user.name || '',
      holder: withdrawal.holder || ''
    };
  };

  console.log('Withdrawal status:', withdrawal.status, 'Type:', typeof withdrawal.status);

  const isPending = withdrawal.status === 'pending' || (withdrawal.status as string) === 'earring';
  const showActionButtons = isPending;

  const getStatusColor = (status: WithdrawalStatus) => {
    switch (status) {
      case 'approved':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      case 'pending':
      default:
        return 'text-amber-600';
    }
  };

  try {
    return (
      <TableRow key={withdrawal.id} className="hover:bg-gray-50">
        <TableCell className="py-3">
          <div className="px-2">
            <div className="flex flex-col items-center space-y-1">
              <span className="font-medium text-sm w-full text-center">{getUserInfo().email}</span>
              {getUserInfo().name && (
                <span className="text-xs text-gray-600 w-full text-center">{getUserInfo().name}</span>
              )}
              {getUserInfo().holder && (
                <span className="text-xs text-gray-500 w-full text-center">Titular: {getUserInfo().holder}</span>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="whitespace-nowrap py-3">
          <div className="px-2">
            <div className="flex flex-col items-center space-y-0.5">
              <div className="flex items-center justify-center gap-1">
                <AtipayCoin size="xs" className="w-3 h-3 text-gray-900 -mt-px" />
                <span className="text-sm font-medium text-gray-900">
                  {Number(withdrawal.amount).toLocaleString('es-ES', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                    useGrouping: true
                  }).replace(/\./g, '|')
                    .replace(/,/g, '.')
                    .replace(/\|/g, ',')}
                </span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="text-xs text-gray-500">Neto:</span>
                <AtipayCoin size="xs" className="w-2.5 h-2.5 text-gray-500 -mt-px" />
                <span className="text-xs text-gray-500">
                  {Number(withdrawal.net_amount || (withdrawal.amount - (withdrawal.commission || 0))).toLocaleString('es-ES', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                    useGrouping: true
                  }).replace(/\./g, '|')
                    .replace(/,/g, '.')
                    .replace(/\|/g, ',')}
                </span>
              </div>
              {withdrawal.commission > 0 && (
                <div className="flex items-center justify-center gap-1">
                  <span className="text-xs text-red-500">Comisión:</span>
                  <AtipayCoin size="xs" className="w-2.5 h-2.5 text-red-500 -mt-px" />
                  <span className="text-xs text-red-500">
                    {Number(withdrawal.commission).toLocaleString('es-ES', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                      useGrouping: true
                    }).replace(/\./g, '|')
                      .replace(/,/g, '.')
                      .replace(/\|/g, ',')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="whitespace-nowrap py-3">
          <div className="px-2">
            <div className="flex flex-col items-center space-y-1">
              <span className="w-full px-2 py-0.5 text-center text-xs font-medium rounded-full bg-blue-200/50 text-blue-600/90 border border-blue-100/50 capitalize">
                {withdrawal.method}
              </span>
              {withdrawal.phone_number && (
                <span className="text-xs text-gray-500 text-center">
                  {withdrawal.phone_number}
                </span>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="whitespace-nowrap py-3">
          <div className="px-2">
            <div className="flex justify-center">
              <span
                className={`w-full px-2 py-1 text-center text-xs font-medium rounded-full ${statusColors[withdrawal.status].bg} ${statusColors[withdrawal.status].text} ${statusColors[withdrawal.status].border}`}
              >
                {getStatusText(withdrawal.status)}
              </span>
            </div>
          </div>
        </TableCell>
        <TableCell className="whitespace-nowrap py-3">
          <div className="px-2">
            <div className="flex justify-center">
              <span className="text-sm text-gray-600">
                {formatDateSafely(withdrawal.created_at)}
              </span>
            </div>
          </div>
        </TableCell>
        <TableCell className="whitespace-nowrap">
          {showActionButtons ? (
            <div className="flex justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate('approved')}
                disabled={isUpdating}
                className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
              >
                {isUpdating ? 'Procesando...' : 'Aprobar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate('rejected')}
                disabled={isUpdating}
                className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
              >
                {isUpdating ? 'Procesando...' : 'Rechazar'}
              </Button>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(withdrawal.status)}`}>
                {getStatusText(withdrawal.status)}
              </span>
            </div>
          )}
        </TableCell>
      </TableRow>
    );
  } catch (error: unknown) {
    console.error('Error en WithdrawalRow:', error);
    return (
      <TableRow>
        <TableCell colSpan={8} className="text-center text-red-600 p-4">
          Error al mostrar este retiro
        </TableCell>
      </TableRow>
    );
  }
};

export function WithdrawalsAdmin() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadWithdrawals = async () => {
    try {
      setIsLoading(true);
      const data = await withdrawalService.getAllWithdrawals() as Array<Partial<Withdrawal> & Record<string, unknown>>;

      const formattedWithdrawals = data.map((item) => ({
    ...item,
    id: item.id || '',
    user: item.user || 'unknown',
    amount: Number(item.amount) || 0,
    method: item.method || 'other',
    status: (item.status || 'pending').toLowerCase() as WithdrawalStatus,
    reference_code: item.reference_code || '',
    //Buscamos 'created_at' O 'request_date' (por si Laravel lo manda así)
    //Quitamos el "|| new Date()" para que no mienta con la fecha
    created_at: item.created_at || item.request_date || item.date || undefined,
    updated_at: item.updated_at || undefined,
    requestDate: item.requestDate || item.request_date || undefined,
    
    priority: item.priority || 'normal'
} as Withdrawal));

      setWithdrawals(formattedWithdrawals);
    } catch (error) {
      toast.error('Error al cargar los retiros');
      console.error('Error loading withdrawals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const handleStatusUpdate = (updatedWithdrawal: Withdrawal, newStatus: 'approved' | 'rejected') => {
    setWithdrawals(prev =>
      prev.map(w => {
        if (w.id === updatedWithdrawal.id) {
          return {
            ...w,
            status: newStatus,
            updated_at: new Date().toISOString()
          };
        }
        return w;
      })
    );
    loadWithdrawals();
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const userInfo = typeof withdrawal.user === 'string'
      ? { email: withdrawal.user.toLowerCase(), name: '' }
      : {
        email: (withdrawal.user?.email || '').toLowerCase(),
        name: (withdrawal.user?.name || '').toLowerCase()
      };

    return (
      userInfo.email.includes(searchLower) ||
      (userInfo.name && userInfo.name.includes(searchLower))
    );
  });

  const renderContent = () => {
    if (isLoading) {
      return renderLoading();
    }

    if (filteredWithdrawals.length === 0) {
      return renderEmptyState();
    }

    return renderWithdrawalsTable();
  };

  const renderLoading = () => (
    <div className="flex justify-center items-center h-40">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <p className="text-muted-foreground">No hay retiros registrados</p>
    </div>
  );

  const renderWithdrawalsTable = () => (
    <div className="rounded-md border overflow-hidden">
      <Table className="[&_th]:py-3 [&_td]:py-2">
        <TableHeader className="bg-gray-50">
          <TableRow className="h-12">
            <TableHead className="w-[30%] font-semibold text-gray-700 text-center">
              <div className="px-2">Usuario</div>
            </TableHead>
            <TableHead className="w-[20%] font-semibold text-gray-700 text-center">
              <div className="px-2">Monto</div>
            </TableHead>
            <TableHead className="w-[20%] font-semibold text-gray-700 text-center">
              <div className="px-2">Método</div>
            </TableHead>
            <TableHead className="w-[15%] font-semibold text-gray-700 text-center">
              <div className="px-2">Estado</div>
            </TableHead>
            <TableHead className="w-[15%] font-semibold text-gray-700 text-center">
              <div className="px-2">Fecha</div>
            </TableHead>
            <TableHead className="w-[15%] font-semibold text-gray-700 text-center">
              <div className="px-2">Acciones</div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredWithdrawals.map((withdrawal) => (
            <ErrorBoundary key={withdrawal.id}>
              <WithdrawalRow
                key={withdrawal.id}
                withdrawal={withdrawal}
                onStatusUpdate={handleStatusUpdate}
              />
            </ErrorBoundary>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="container mx-auto py-6">

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Historial de Retiros</CardTitle>
                <CardDescription>
                  Gestiona las solicitudes de retiro de los usuarios
                </CardDescription>
              </div>
            </div>
            <div className="mt-4 md:mt-0 w-full md:w-64">
              <input
                type="text"
                placeholder="Buscar por email o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>

    </div>
  );
}

export default WithdrawalsAdmin;
