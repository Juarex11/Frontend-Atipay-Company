import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Investment } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { StatusBadge } from '../ui/StatusBadge';
import { AtipayCoin } from '@/components/ui/AtipayCoin';

interface InvestmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: Investment;
}

export const InvestmentDetailsModal = ({
  isOpen,
  onClose,
  investment,
}: InvestmentDetailsModalProps) => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM 'de' yyyy", { locale: es });
  };

  const calculateEarnings = () => {
    if (!investment.start_date) {
      return {
        daysActive: 0,
        dailyEarning: 0,
        totalEarned: 0,
        nextPayout: 0
      };
    }

    const startDate = new Date(investment.start_date);
    const now = new Date();
    const daysActive = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    const dailyEarning = investment.daily_earning || 0;
    const totalEarned = daysActive * dailyEarning;

    return {
      daysActive,
      dailyEarning,
      totalEarned,
      nextPayout: dailyEarning // Next payout is the same as daily earning
    };
  };

  const earnings = calculateEarnings();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white">
        <DialogHeader>
          <div className="bg-gradient-to-r from-[#0c4a2a] to-[#0a7e3e] -mx-6 -mt-6 px-6 py-4 rounded-t-lg">
            <DialogTitle className="text-xl font-bold text-white">
              Detalles de la Inversión
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-800 border-b pb-2">Información General</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Plan:</span>
                  <span className="text-sm text-gray-800 font-medium">{investment.promotion?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Monto Invertido:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    S/ {(investment.promotion?.atipay_price_promotion || 0).toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Estado:</span>
                  <StatusBadge status={investment.status} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-800 border-b pb-2">Fechas</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Inicio:</span>
                  <span className="text-sm text-gray-700">{investment.start_date ? formatDate(investment.start_date) : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Finalización:</span>
                  <span className="text-sm text-gray-700">{investment.end_date ? formatDate(investment.end_date) : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Días activo:</span>
                  <span className="text-sm font-medium text-gray-800">{earnings.daysActive} días</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="text-base font-semibold text-gray-800 border-b pb-2">Rendimientos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <p className="text-xs font-medium text-green-700 mb-1">Ganancia Diaria</p>
                <div className="flex items-center gap-1">
                  <AtipayCoin size="sm" />
                  <span className="text-xl font-bold text-green-700">
                    {earnings.dailyEarning.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-xs font-medium text-blue-700 mb-1">Total Ganado</p>
                <div className="flex items-center gap-1">
                  <AtipayCoin size="sm" />
                  <span className="text-xl font-bold text-blue-700">
                    {earnings.totalEarned.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <p className="text-xs font-medium text-purple-700 mb-1">Próximo Pago</p>
                <div className="flex items-center gap-1">
                  <AtipayCoin size="sm" />
                  <span className="text-xl font-bold text-purple-700">
                    {earnings.nextPayout.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {investment.promotion?.name && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Detalles del Plan</h4>
              <p className="text-sm text-gray-600">
                {investment.promotion.name} - Interés: {investment.promotion.percentaje}%
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
