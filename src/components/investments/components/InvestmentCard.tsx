import type { Investment } from '../types';
import { getPlanBgColor } from '../utils/formatters';
import { AtipayCoin } from '@/components/ui/AtipayCoin';
import { Button } from "@/components/ui/button";
import { Clock as ClockIcon, TrendingUp } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";

interface InvestmentCardProps {
  investment: Investment;
  onReinvest?: (id: number) => void;
}

export const InvestmentCard: React.FC<InvestmentCardProps> = ({ investment, onReinvest }) => {
  const investmentAmount = investment.promotion?.atipay_price_promotion || 0;
  const currentValue = investment.currentValue || investmentAmount;
  const profit = currentValue - investmentAmount;
  const profitPercentage = investmentAmount > 0 ? (profit / investmentAmount) * 100 : 0;
  let endDate: Date | null = null;
  if (investment.end_date) {
    endDate = new Date(investment.end_date);
  } else if (investment.promotion?.duration_months) {
    const days = investment.promotion.duration_months * 30;
    const durationMs = days * 24 * 60 * 60 * 1000;
    endDate = new Date(new Date().getTime() + durationMs);
  }
  const daysRemaining = endDate
    ? Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const isCompleted = investment.status === 'completed';
  const isActive = investment.status === 'active';

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
      {/* Plan type indicator */}
      <div className={`absolute right-0 top-0 h-1 w-full ${(() => {
        const planName = investment?.promotion?.name?.toLowerCase() || '';
        if (planName.includes('basic')) return getPlanBgColor('basic');
        if (planName.includes('premium')) return getPlanBgColor('premium');
        if (planName.includes('vip')) return getPlanBgColor('vip');
        return getPlanBgColor('default');
      })()
        }`}></div>

      {/* Card Header */}
      <div className="p-5 pb-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">{investment.promotion.name}</h3>
              {(() => {
                if (isCompleted) {
                  return (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Completado
                    </span>
                  );
                } else if (isActive) {
                  return (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      Activo
                    </span>
                  );
                } else {
                  return (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                      Pendiente
                    </span>
                  );
                }
              })()}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Plazo: {investment.promotion.duration_months} meses
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-gray-500">Valor actual</p>
            <div className="flex items-center gap-1">
              <AtipayCoin size="sm" />
              <span className="text-xl font-bold text-gray-900">
                {currentValue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Inversión inicial</p>
            <div className="flex items-center gap-1">
              <AtipayCoin size="xs" />
              <span className="text-base font-semibold text-gray-900">
                {investmentAmount.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Retorno esperado</p>
            <div className="flex items-center gap-1">
              <AtipayCoin size="xs" />
              <span className="text-base font-semibold text-green-600">
                {(investment.expectedReturn || 0).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Ganancia actual</p>
            <div className="flex items-center gap-1">
              <AtipayCoin size="xs" />
              <span className="text-base font-semibold text-green-600">
                {profit.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Rendimiento</span>
            </div>
            <p className="text-lg font-semibold text-green-600">
              {profitPercentage.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progreso</span>
            <span className="font-medium">
              {investment.progress ? `${investment.progress}%` : 'N/A'}
            </span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={cn(
                "h-full transition-all duration-300",
                getPlanBgColor(investment.promotion.name.toLowerCase()),
                `w-[${investment.progress || 0}%]`
              )}
            />
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Inversión inicial</span>
            <div className="flex items-center gap-1 text-sm font-medium text-gray-500">
              <AtipayCoin size="xs" />
              <span>{investmentAmount.toFixed(2)}</span>
            </div>
          </div>
          {profit > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Ganancia actual</span>
              <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                <AtipayCoin size="xs" />
                <span>+{profit.toFixed(2)}</span>
              </div>
            </div>
          )}
          {investment.total_earning > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Ganancia total</span>
              <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                <AtipayCoin size="xs" />
                <span>+{investment.total_earning.toFixed(2)}</span>
              </div>
            </div>
          )}
          {endDate && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Fecha de vencimiento</span>
              <span>{format(endDate, 'PP', { locale: es })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between border-t border-gray-100 p-4">
        <div className="flex items-center text-sm text-gray-600">
          <ClockIcon className="mr-1.5 h-4 w-4 text-gray-400" />
          <span>
            {isCompleted
              ? 'Completado'
              : `Finaliza en ${daysRemaining} días`}
          </span>
        </div>
        {onReinvest && !isCompleted && (
          <Button
            onClick={() => onReinvest(investment.id)}
            size="sm"
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Reinvertir
          </Button>
        )}
      </div>
    </div>
  );
};
