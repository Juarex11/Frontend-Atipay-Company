import type { Investment } from '../../types';
import { InvestmentRow } from './InvestmentRow';
import { InvestmentDetailsModal } from './InvestmentDetailsModal';
import { useState } from 'react';

interface InvestmentsTableProps {
  investments: Investment[];
  isLoading: boolean;
  isWithdrawing: number | null;
  onWithdraw: (investmentId: number) => Promise<void>;
}

export const InvestmentsTable = ({
  investments,
  isLoading,
  isWithdrawing,
  onWithdraw,
}: InvestmentsTableProps) => {
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (investment: Investment) => {
    setSelectedInvestment(investment);
    setIsModalOpen(true);
  };

  return (
    <div className="mb-10 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div className="px-6 py-4 bg-gradient-to-r from-[#0c4a2a] to-[#0a7e3e]">
        <h2 className="text-lg font-semibold text-white">Mis Inversiones</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Plan</th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Monto</th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Fecha de Inicio</th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rendimiento</th>
              <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {investments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm font-medium text-gray-500">
                  {isLoading ? 'Cargando inversiones...' : 'No se encontraron inversiones'}
                </td>
              </tr>
            ) : (
              investments.map((investment) => (
                <InvestmentRow 
                  key={investment.id} 
                  investment={investment} 
                  isWithdrawing={isWithdrawing === investment.id}
                  onViewDetails={handleViewDetails}
                  onWithdraw={onWithdraw}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedInvestment && (
        <InvestmentDetailsModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          investment={selectedInvestment}
        />
      )}
    </div>
  );
};
