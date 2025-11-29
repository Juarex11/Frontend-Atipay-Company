import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Check, X, ArrowUpRight, User, CreditCard, Hash } from 'lucide-react';
import { formatCurrency } from '@/pages/admin/Dashboard/utils/formatters';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AtipayCoin } from '@/components/ui/AtipayCoin';
import { cn } from '@/lib/utils';

export interface Withdrawal {
  id: string;
  user: string;
  amount: number;
  method: string;
  status: 'pending' | 'approved' | 'rejected';
  reference_code?: string;
  created_at: string;
  updated_at: string;
}

interface WithdrawalListProps {
  withdrawals: Withdrawal[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const getMethodDisplayName = (method: string) => {
  const methodMap: Record<string, string> = {
    'yape': 'Yape',
    'plin': 'Plin',
    'bcp': 'BCP',
    'interbank': 'Interbank',
    'bbva': 'BBVA',
    'other': 'Otro'
  };
  return methodMap[method] || method;
};

const getStatusDisplay = (status: string) => {
  const statusMap: Record<string, { 
    text: string; 
    color: string; 
    bg: string; 
    border: string;
    icon: React.ReactNode;
  }> = {
    'pending': { 
      text: 'Pendiente', 
      color: 'text-amber-600', 
      bg: 'bg-amber-50/80',
      border: 'border-amber-100',
      icon: <Clock className="w-4 h-4" />
    },
    'approved': { 
      text: 'Aprobado', 
      color: 'text-green-600', 
      bg: 'bg-green-50/80',
      border: 'border-green-100',
      icon: <Check className="w-4 h-4" />
    },
    'rejected': { 
      text: 'Rechazado', 
      color: 'text-red-600', 
      bg: 'bg-red-50/80',
      border: 'border-red-100',
      icon: <X className="w-4 h-4" />
    }
  };
  return statusMap[status] || { 
    text: status, 
    color: 'text-gray-600', 
    bg: 'bg-gray-50/80',
    border: 'border-gray-100',
    icon: <Clock className="w-4 h-4" />
  };
};


const renderStatusActions = (status: string, onApprove: () => void, onReject: () => void) => {
  if (status !== 'pending') {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 border border-gray-100">
        {status === 'approved' ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500" />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onApprove}
        className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-700 hover:border-green-300 transition-all duration-200 shadow-sm w-full sm:w-auto justify-center"
      >
        <CheckCircle className="h-4 w-4 mr-1.5" />
        Aprobar
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onReject}
        className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-700 hover:border-red-300 transition-all duration-200 shadow-sm w-full sm:w-auto justify-center"
      >
        <XCircle className="h-4 w-4 mr-1.5" />
        Rechazar
      </Button>
    </div>
  );
};

export const WithdrawalList = ({ withdrawals, onApprove, onReject }: WithdrawalListProps) => {
  if (withdrawals.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-dashed border-gray-200 hover:border-green-200 transition-colors duration-300">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-green-50 flex items-center justify-center mb-4">
          <AtipayCoin size="lg" className="text-green-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No hay solicitudes</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          No hay solicitudes de retiro pendientes en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {withdrawals.map((withdrawal) => {
        const statusInfo = getStatusDisplay(withdrawal.status);
        const isPending = withdrawal.status === 'pending';
        const timeAgo = formatDistanceToNow(new Date(withdrawal.created_at), { 
          addSuffix: true, 
          locale: es 
        });
        
        return (
          <div 
            key={withdrawal.id} 
            className={cn(
              'bg-white rounded-xl border overflow-hidden transition-all duration-300 group',
              'hover:shadow-lg transform hover:-translate-y-0.5',
              isPending 
                ? 'border-amber-100 bg-gradient-to-r from-white to-amber-50/50 hover:border-amber-200' 
                : 'border-gray-100',
              statusInfo.border,
              'mb-4 last:mb-0' // Añadido margen inferior para separar las tarjetas
            )}
          >
            <div className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Left side - Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'flex-shrink-0 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl',
                      isPending 
                        ? 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600' 
                        : 'bg-gradient-to-br from-green-50 to-green-100 text-green-600',
                      'shadow-sm mt-0.5'
                    )}>
                      <ArrowUpRight className={cn(
                        'h-5 w-5 sm:h-6 sm:w-6',
                        isPending ? 'text-amber-500' : 'text-green-500'
                      )} />
                    </div>
                    
                    <div className="space-y-2.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xl sm:text-2xl font-bold text-gray-900">
                          {formatCurrency(withdrawal.amount)}
                        </span>
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap',
                          'border',
                          statusInfo.color,
                          statusInfo.bg,
                          statusInfo.border,
                          'shadow-sm'
                        )}>
                          {statusInfo.icon}
                          <span className="ml-1.5">{statusInfo.text}</span>
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                          <span className="font-medium truncate">{getMethodDisplayName(withdrawal.method)}</span>
                        </div>
                        <div className="flex items-center group">
                          <User className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0 group-hover:text-green-500 transition-colors" />
                          <span className="font-medium text-gray-800 group-hover:text-green-600 transition-colors truncate">
                            {withdrawal.user}
                          </span>
                        </div>
                        {withdrawal.reference_code && (
                          <div className="flex items-center sm:col-span-2">
                            <Hash className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                            <span className="font-mono text-xs sm:text-sm bg-gray-50 px-2 py-1 rounded-md truncate max-w-[200px] sm:max-w-none">
                              {withdrawal.reference_code}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-0.5 text-xs text-gray-500 flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">Solicitado {timeAgo}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right side - Actions */}
                <div className="sm:ml-4 flex-shrink-0">
                  {renderStatusActions(
                    withdrawal.status,
                    () => onApprove(withdrawal.id),
                    () => onReject(withdrawal.id)
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
