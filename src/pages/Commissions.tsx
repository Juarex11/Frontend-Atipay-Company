import React, { useState, useEffect } from 'react';
import {
  getCommissionSummary,
  getUnwithdrawnHistory,
  withdrawCommissions,
  getCommissionHistory,
  getWithdrawalHistory,
} from '../services/commissionService';
import { getUserProfile } from '@/services/userService';
import { toast } from '@/components/ui/use-toast';
import { AtipayCoin } from '@/components/ui/AtipayCoin';
import type { CommissionHistoryItem } from '../types/commission';
interface UnwithdrawnCommission {
  id: number;
  user_id: number;
  referred_user_id: number;
  level: number;
  commission_amount: string;
  points_generated: number;
  source_type: string;
  month: number;
  year: number;
  withdrawn: number;
  locked: number;
}

interface CommissionSummary {
  summary: {
    total_pendientes: number;
    total_retiradas: number;
  };
}

interface WithdrawalHistoryItem {
  id: number;
  user_id: number;
  amount: string;
  month: number;
  year: number;
  withdrawn_at: string;
}

interface ApiWithdrawalItem {
  id: number;
  user_id: number;
  amount: string;
  month: number;
  year: number;
  withdrawn_at: string;
}

interface ApiWithdrawalResponse {
  success: boolean;
  message?: string;
  history?: ApiWithdrawalItem[];
}

const Commissions: React.FC = () => {
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [history, setHistory] = useState<{ history: { [key: string]: { total: number; comisiones: UnwithdrawnCommission[] } } } | null>(null);
  const [commissionHistory, setCommissionHistory] = useState<CommissionHistoryItem[]>([]);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [loading, setLoading] = useState({
    summary: true,
    history: true,
    profile: true,
    withdrawing: false,
    commissionHistory: true
  });
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalHistoryItem[]>([]);
  const [loadingWithdrawalHistory, setLoadingWithdrawalHistory] = useState(true);
  const [withdrawalHistoryError, setWithdrawalHistoryError] = useState('');
  
  const [error, setError] = useState({
    summary: '',
    history: '',
    profile: '',
    withdraw: '',
    commissionHistory: ''
  });

  const fetchWithdrawalHistory = async () => {
    try {
      setLoadingWithdrawalHistory(true);
      setWithdrawalHistoryError('');
      
      const historyData = await getWithdrawalHistory();
      setWithdrawalHistory(historyData);
    } catch (error) {
      console.error('Error fetching withdrawal history:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cargar el historial';
      setWithdrawalHistoryError(errorMessage);
      setWithdrawalHistory([]);
    } finally {
      setLoadingWithdrawalHistory(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchWithdrawalHistory();
    fetchCommissionHistory();
  }, []);

  const fetchCommissionHistory = async () => {
    try {
      setLoading(prev => ({ ...prev, commissionHistory: true }));
      const historyData = await getCommissionHistory();
      setCommissionHistory(historyData);
      setError(prev => ({ ...prev, commissionHistory: '' }));
    } catch (err: unknown) {
      const error = err as { errorData?: { message?: string } };
      const message = error.errorData?.message || 'Error al cargar el historial de comisiones';
      setError(prev => ({ ...prev, commissionHistory: message }));
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    } finally {
      setLoading(prev => ({ ...prev, commissionHistory: false }));
    }
  };

  const fetchData = async () => {
    try {
      setLoading(prev => ({ ...prev, summary: true, history: true, profile: true }));

      const [summaryRes, historyRes, profileRes] = await Promise.all([
        getCommissionSummary(),
        getUnwithdrawnHistory().then(response => {
          // Transform the API response to match our expected format
          if (response && response.history) {
            const historyData = response.history;
            // If it's already in the expected format, return as is
            if (typeof historyData === 'object' && !Array.isArray(historyData)) {
              return { history: historyData };
            }
            // Otherwise, transform the array format
            const transformedHistory: { [key: string]: { total: number; comisiones: UnwithdrawnCommission[] } } = {};

            (historyData as Array<{ month: string | number; year: number; amount: string }>).forEach(item => {
              const key = `${item.month}-${item.year}`;
              if (!transformedHistory[key]) {
                transformedHistory[key] = { total: 0, comisiones: [] };
              }
              const amount = parseFloat(item.amount || '0');
              transformedHistory[key].total += amount;

              transformedHistory[key].comisiones.push({
                id: 0,
                user_id: 0,
                referred_user_id: 0,
                level: 1,
                commission_amount: amount.toString(),
                points_generated: 0,
                source_type: 'purchase',
                month: typeof item.month === 'string' ? parseInt(item.month) : item.month,
                year: item.year,
                withdrawn: 0,
                locked: 0
              });
            });

            return { history: transformedHistory };
          }
          return { history: {} };
        }),
        getUserProfile()
      ]);

      setSummary(summaryRes);
      setHistory(historyRes);
      setUserPoints(Number(profileRes.accumulated_points) || 0);
      setError({ summary: '', history: '', profile: '', withdraw: '', commissionHistory: '' });
    } catch (err: unknown) {
      const error = err as { errorData?: { message?: string }, response?: { url?: string } };
      const message = error.errorData?.message || 'Error al cargar los datos';
      if (error.response?.url?.includes('summary')) {
        setError(prev => ({
          ...prev,
          summary: error.response?.url?.includes('summary') ? message : prev.summary,
          history: error.response?.url?.includes('history') ? message : prev.history,
          profile: error.response?.url?.includes('profile') ? message : prev.profile,
        }));
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    } finally {
      setLoading(prev => ({
        ...prev,
        summary: false,
        history: false,
        profile: false
      }));
    }
  };

  const handleWithdraw = async () => {
    if (!summary?.summary.total_pendientes) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No hay comisiones disponibles para retirar',
      });
      return;
    }

    try {
      setLoading(prev => ({ ...prev, withdrawing: true }));
      const result = await withdrawCommissions();

      if (result.success) {
        toast({
          title: '¡Éxito!',
          description: `¡Has retirado $${result.amount} con éxito!`,
        });
        fetchData(); // Refresh data
        fetchCommissionHistory(); 
      } else {
        toast({
          variant: 'destructive',
          title: 'Advertencia',
          description: result.message,
        });
      }
    } catch (err: unknown) {
      const error = err as { errorData?: { message?: string } };
      const message = error.errorData?.message || 'Error al retirar comisiones';
      setError(prev => ({ ...prev, withdraw: message }));
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    } finally {
      setLoading(prev => ({ ...prev, withdrawing: false }));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Mis Comisiones</h1>
          <p className="text-gray-600 text-sm md:text-base">Administra y retira tus comisiones generadas</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={handleWithdraw}
            disabled={loading.withdrawing || !summary?.summary.total_pendientes}
            className={`w-full md:w-auto px-6 py-3 rounded-lg font-medium text-white shadow-lg transition-all duration-200 transform hover:scale-105 ${loading.withdrawing || !summary?.summary.total_pendientes
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
              }`}
          >
            {loading.withdrawing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </span>
            ) : (
              'Retirar Comisiones'
            )}
          </button>
          {error.withdraw && (
            <p className="mt-2 text-sm text-red-600">{error.withdraw}</p>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Pending Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-green-100 hover:shadow-lg transition-shadow duration-300">
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-50 text-green-600 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Mis puntos</p>
                {loading.profile ? (
                  <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <p className="text-2xl font-bold text-gray-800">
                      {userPoints.toLocaleString('es-ES', {
                        useGrouping: true
                      })}
                    </p>
                    <AtipayCoin size="sm" className="ml-1" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawn Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-green-100 hover:shadow-lg transition-shadow duration-300">
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-50 text-green-600 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Retiradas</p>
                {loading.summary ? (
                  <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <p className="text-2xl font-bold text-gray-800">{summary?.summary.total_retiradas.toFixed(2)}</p>
                    <AtipayCoin size="sm" className="ml-1" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Available for Withdrawal */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg overflow-hidden md:col-span-2 lg:col-span-1">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">Disponible para retiro</p>
                {loading.summary ? (
                  <div className="h-8 w-32 bg-green-500/50 rounded animate-pulse mt-1"></div>
                ) : (
                  <div className="flex items-center">
                    <p className="text-2xl font-bold text-white">
                      {(summary?.summary.total_pendientes || 0).toFixed(2)}
                    </p>
                    <AtipayCoin size="sm" className="ml-1 text-yellow-300" />
                  </div>
                )}
                <p className="text-xs text-green-100 mt-1">
                  {loading.profile
                    ? 'Cargando información de puntos...'
                    : userPoints >= 100
                      ? `¡Tienes ${userPoints.toLocaleString('es-ES')} puntos!`
                      : `Necesitas ${(100 - userPoints).toLocaleString('es-ES')} puntos más para poder retirar`}
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Unwithdrawn Commissions Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Historial Detallado de Comisiones
          </h2>
          <p className="text-sm text-gray-500 mt-1">Visualiza todas tus comisiones con su estado actual</p>
        </div>

        {loading.commissionHistory ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : error.commissionHistory ? (
          <div className="p-6 text-center">
            <div className="text-red-500 bg-red-50 p-4 rounded-lg inline-flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error.commissionHistory}
            </div>
          </div>
        ) : commissionHistory.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-flex flex-col items-center justify-center p-6 rounded-xl bg-gray-50 max-w-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-700 mb-1">No hay comisiones</h3>
              <p className="text-gray-500 text-sm">Aún no has generado comisiones</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nivel
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puntos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Origen
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {commissionHistory.map((commission) => (
                  <tr key={commission.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-8 w-8 bg-green-50 rounded-full flex items-center justify-center text-green-600 border border-green-100">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-900">{commission.fecha}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex justify-center">
                        <span className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full">
                          {commission.nivel}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-sm font-semibold text-gray-900">
                          {commission.monto.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <AtipayCoin size="xs" className="text-yellow-500" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm text-gray-600">
                        {commission.puntos_generados.toLocaleString('es-ES')} pts
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-6 w-6 bg-purple-50 rounded-full flex items-center justify-center mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-700">{commission.origen}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          commission.estado === 'Procesado' 
                            ? 'bg-green-100 text-green-800' 
                            : commission.estado === 'Bloqueado (Faltan Puntos)'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {commission.estado}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal History Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mt-6">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Historial de Retiros Realizados
          </h2>
        </div>

        {loadingWithdrawalHistory ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : withdrawalHistoryError ? (
          <div className="p-6 text-center">
            <div className="text-red-500 bg-red-50 p-4 rounded-lg inline-flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {withdrawalHistoryError}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de Retiro
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {withdrawalHistory.length > 0 ? (
                  withdrawalHistory.map((item) => {
                    const date = new Date(item.withdrawn_at);
                    const formattedDate = date.toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formattedDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-gray-900">
                              {parseFloat(item.amount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <AtipayCoin size="xs" className="text-yellow-500" />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.month}/{item.year}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                      No hay registros de retiros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Commissions;
