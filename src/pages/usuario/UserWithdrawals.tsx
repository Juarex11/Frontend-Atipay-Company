import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { withdrawalService, type Withdrawal } from '@/services/withdrawalService';
import { useUserBalance } from '@/hooks/useUserBalance';
import { PlusCircle, Clock, CheckCircle, XCircle, AlertCircle, DollarSign, CreditCard, Wallet } from 'lucide-react';
import { AtipayCoin } from '@/components/ui/AtipayCoin';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { NewWithdrawalDialog } from '@/components/withdrawals/NewWithdrawalDialog';

type WithdrawalData = Omit<Withdrawal, 'status'> & {
  status: 'pending' | 'approved' | 'rejected' | 'earring';
};

export function UserWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalData[]>([]);
  const [isNewWithdrawalOpen, setIsNewWithdrawalOpen] = useState(false);
  const { balance, loading: balanceLoading } = useUserBalance();

  const handleNewWithdraw = () => {
    setIsNewWithdrawalOpen(true);
  };

  const handleWithdrawalSuccess = () => {
    loadWithdrawals();
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'earring':
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 mr-1" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 mr-1" />;
      case 'earring':
      case 'pending':
        return <Clock className="h-4 w-4 mr-1" />;
      default:
        return <AlertCircle className="h-4 w-4 mr-1" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'earring': 'Pendiente',
      'pending': 'Pendiente',
      'approved': 'Aprobado',
      'rejected': 'Rechazado'
    };
    return statusMap[status] || status;
  };

  const formatCurrency = (amount: number) => {
    return Number(amount).toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      useGrouping: true
    })
      .replace(/\./g, '|')
      .replace(/,/g, '.')
      .replace(/\|/g, ',');
  };

  const formatDate = (dateString: string | Date): string => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Fecha inválida' : format(date, 'PPp', { locale: es });
    } catch (e) {
      console.error('Error formatting date:', dateString, e);
      return 'Fecha inválida';
    }
  };

  const getMethodName = (method: string) => {
    const methods: Record<string, string> = {
      'yape': 'Yape',
      'plin': 'Plin',
      'bcp': 'BCP',
      'interbank': 'Interbank',
      'bbva': 'BBVA',
      'other': 'Otro'
    };
    return methods[method] || method;
  };

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadWithdrawals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await withdrawalService.getMyWithdrawals();
      setWithdrawals(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar los retiros';
      console.error('Error fetching withdrawals:', errorMessage);
      setError(`Error al cargar los retiros: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWithdrawals();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full">
        {/* Encabezado */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="w-full">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl mb-4">
              Mis Retiros
            </h2>

            {isLoading && (
              <div className="mb-4 p-4 bg-blue-50 text-blue-800 rounded-md">
                Cargando tus retiros...
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-md">
                {error}
                <button
                  onClick={loadWithdrawals}
                  className="ml-4 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-md text-sm"
                >
                  Reintentar
                </button>
              </div>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Gestiona y revisa el estado de tus solicitudes de retiro
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button
              onClick={handleNewWithdraw}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Retiro
            </Button>
            <NewWithdrawalDialog
              open={isNewWithdrawalOpen}
              onOpenChange={setIsNewWithdrawalOpen}
              onSuccess={handleWithdrawalSuccess}
            />
          </div>
        </div>

        {/* Resumen */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {/* Nueva carta de Saldo Disponible */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-lg p-6 border-0">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-white/90">Saldo Disponible</p>
              <div className="h-4 w-4">
                <Wallet className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center gap-2">
                <AtipayCoin size="sm" className="w-5 h-5 text-white" />
                <span className="text-2xl font-bold text-white">
                  {balanceLoading ? '...' : formatCurrency(balance || 0)}
                </span>
              </div>
            </div>
            <p className="text-xs text-white/80 mt-2">
              Tu saldo actual en la plataforma
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#0c4a2a] to-[#0a7e3e] text-white rounded-lg p-6 border-0">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-white/90">Total Retirado</p>
              <div className="h-4 w-4">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center gap-2">
                <AtipayCoin size="sm" className="w-5 h-5 text-white" />
                <span className="text-2xl font-bold text-white">
                  {formatCurrency(
                    withdrawals
                      .filter(w => w.status === 'approved')
                      .reduce((sum, w) => sum + Number(w.amount), 0)
                  )}
                </span>
              </div>
            </div>
            <p className="text-xs text-white/80 mt-2">
              Monto total aprobado
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-600 to-amber-800 text-white rounded-lg p-6 border-0">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-white/90">Pendientes</p>
              <div className="h-4 w-4">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">
                  {withdrawals.filter(w => w.status === 'pending' || w.status === 'earring').length}
                </span>
              </div>
            </div>
            <p className="text-xs text-white/80 mt-2">
              Solicitudes en revisión
            </p>
          </div>

          <div className="bg-gradient-to-br from-rose-600 to-rose-800 text-white rounded-lg p-6 border-0">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-white/90">Rechazados</p>
              <div className="h-4 w-4">
                <XCircle className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">
                  {withdrawals.filter(w => w.status === 'rejected').length}
                </span>
              </div>
            </div>
            <p className="text-xs text-white/80 mt-2">
              Solicitudes rechazadas
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-8">
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Historial de Retiros
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Revisa el estado de tus solicitudes de retiro
              </p>
            </div>

            {withdrawals.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center mb-4">
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No hay retiros registrados</h4>
                <p className="text-gray-500 mb-4 max-w-md mx-auto">
                  Aún no has realizado ninguna solicitud de retiro. ¡Crea tu primer retiro ahora!
                </p>
                <Button
                  onClick={handleNewWithdraw}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear primer retiro
                </Button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader className="bg-green-600">
                      <TableRow className="border-b border-green-700">
                        <TableHead className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-32">Método</TableHead>
                        <TableHead className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Titular</TableHead>
                        <TableHead className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-32">Referencia</TableHead>
                        <TableHead className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-32">Monto</TableHead>
                        <TableHead className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-32">Comisión</TableHead>
                        <TableHead className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-32">Neto</TableHead>
                        <TableHead className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider w-36">Estado</TableHead>
                        <TableHead className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-40">Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white divide-y divide-gray-100">
                      {withdrawals.map((withdrawal) => {
                        const statusVariant = getStatusVariant(withdrawal.status);
                        const statusBg = {
                          'default': 'bg-green-100 text-green-800',
                          'destructive': 'bg-red-100 text-red-800',
                          'secondary': 'bg-amber-100 text-amber-800',
                          'outline': 'bg-gray-100 text-gray-800'
                        }[statusVariant] || 'bg-gray-100 text-gray-800';

                        return (
                          <TableRow
                            key={withdrawal.id}
                            className="hover:bg-gray-50 transition-colors duration-150"
                          >
                            <TableCell className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center min-w-[120px]">
                                <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center mr-2">
                                  {(() => {
                                    switch (statusVariant) {
                                      case 'default': return <CreditCard className="h-4 w-4 text-green-600" />;
                                      case 'destructive': return <CreditCard className="h-4 w-4 text-red-600" />;
                                      default: return <CreditCard className="h-4 w-4 text-amber-600" />;
                                    }
                                  })()}
                                </div>
                                <span className="text-sm font-medium text-gray-900 truncate">
                                  {getMethodName(withdrawal.method)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-900 truncate max-w-[180px]">{withdrawal.holder}</div>
                            </TableCell>
                            <TableCell className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {withdrawal.method === 'yape' || withdrawal.method === 'plin'
                                  ? withdrawal.phone_number || 'N/A'
                                  : withdrawal.account_number || 'N/A'
                                }
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <AtipayCoin size="xs" className="w-3 h-3" />
                                  {withdrawal.amount.toLocaleString('es-ES', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-red-600 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <span>-</span>
                                  <AtipayCoin size="xs" className="w-3 h-3" />
                                  {withdrawal.commission.toLocaleString('es-ES', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-semibold text-green-600 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <AtipayCoin size="xs" className="w-3 h-3" />
                                  {withdrawal.net_amount.toLocaleString('es-ES', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 whitespace-nowrap">
                              <div className="flex justify-center">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusBg} whitespace-nowrap`}>
                                  {getStatusIcon(withdrawal.status)}
                                  <span className="ml-1">{getStatusText(withdrawal.status)}</span>
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-500 text-right">
                                {withdrawal.date ? formatDate(withdrawal.date) : 'N/A'}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


export default UserWithdrawals;
