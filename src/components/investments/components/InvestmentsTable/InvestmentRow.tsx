import type { Investment } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { AtipayCoin } from '@/components/ui/AtipayCoin';

interface InvestmentRowProps {
  investment: Investment;
  isWithdrawing: boolean;
  onViewDetails: (investment: Investment) => void;
  onWithdraw?: (investmentId: number) => Promise<void>;
}

export const InvestmentRow = ({
  investment,
  isWithdrawing,
  onViewDetails,
  onWithdraw,
}: InvestmentRowProps) => {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {investment.promotion?.name || 'Plan no disponible'}
        </div>
        <div className="text-xs text-gray-500">
          {investment.promotion?.name ? `Plan de inversión` : 'Sin detalles'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-semibold text-gray-900">
          <div className="flex items-center gap-1">
            <AtipayCoin size="xs" className="w-4 h-4" />
            {investment.promotion.atipay_price_promotion.toLocaleString('es-ES', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={investment.status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {new Date(investment.start_date).toLocaleDateString('es-ES')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {investment.daily_earning ? (
          <div className="flex items-center gap-1 text-green-600 font-semibold">
            <AtipayCoin size="xs" className="w-3 h-3" />
            {investment.daily_earning.toFixed(2)} diarios
          </div>
        ) : (
          <span className="text-gray-400">N/A</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => onViewDetails(investment)}
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-white text-[#0a7e3e] border border-[#0a7e3e] hover:bg-[#f0f9f0] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:border-gray-300"
            disabled={isWithdrawing}
          >
            Ver detalles
          </button>
          {onWithdraw && (
            <button
              onClick={() => onWithdraw(investment.id)}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-1.5"
              disabled={isWithdrawing}
            >
              {isWithdrawing ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="https://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                <>
                  <svg xmlns="https://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Retirar
                </>
              )}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
