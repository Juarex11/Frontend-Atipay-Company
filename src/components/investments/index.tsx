import { useState, useEffect, useCallback } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { AtipayCoin } from '@/components/ui/AtipayCoin';
import { getPromotions } from '@/services/promotion.service';
import { useUserBalance } from '@/hooks/useUserBalance';
import { withdrawEarnings, getInvestments, getActiveInvestments, getPendingInvestments, createInvestment, getInvestmentDailyGains, type DailyGain } from '@/services/investmentService';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/transactionUtils';
import type { Investment, InvestmentPlan, InvestmentStatus } from './types';
import { InvestmentStats } from './components/InvestmentStats';
import { InvestmentsTable } from './components/InvestmentsTable';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ApiInvestment {
  id: number;
  user_id: number;
  promotion_id: number;
  status: InvestmentStatus;
  admin_message: string | null;
  daily_earning: number;
  total_earning: number;
  already_earned: number;
  last_earned_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  start_date: string | null;
  end_date: string | null;
  promotion: {
    id: number;
    name: string;
    percentaje: number;
    atipay_price_promotion: number;
    duration_months: number;
    status: 'active' | 'inactive';
  };
  withdrawals?: Array<{
    id: number;
    investment_id: number;
    amount: number;
    transferred_at: string;
  }>;
  [key: string]: unknown;
}

const safeParseDate = (dateString: string | null | undefined): Date => {
  if (!dateString) return new Date();
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? new Date() : date;
};

const transformInvestment = (apiInvestment: ApiInvestment): Investment => {
  const now = new Date().toISOString();
  const startDate = safeParseDate(apiInvestment.start_date || now);
  const endDate = safeParseDate(apiInvestment.end_date || now);

  const investment: Investment = {
    id: apiInvestment.id,
    user_id: apiInvestment.user_id,
    promotion_id: apiInvestment.promotion_id,
    status: apiInvestment.status,
    amount: 0,
    created_at: now,
    updated_at: now,
    user: {
      id: apiInvestment.user_id,
      name: '',
      email: ''
    },
    admin_message: apiInvestment.admin_message || null,
    daily_earning: apiInvestment.daily_earning || 0,
    total_earning: apiInvestment.total_earning || 0,
    already_earned: apiInvestment.already_earned || 0,
    last_earned_at: apiInvestment.last_earned_at || null,
    approved_at: apiInvestment.approved_at || null,
    rejected_at: apiInvestment.rejected_at || null,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    promotion: {
      id: apiInvestment.promotion?.id || 0,
      name: apiInvestment.promotion?.name || '',
      percentaje: apiInvestment.promotion?.percentaje || 0,
      atipay_price_promotion: apiInvestment.promotion?.atipay_price_promotion || 0,
      duration_months: apiInvestment.promotion?.duration_months || 1,
      status: apiInvestment.promotion?.status || 'inactive',
      minAmount: 0,
      maxAmount: 10000,
      duration: (apiInvestment.promotion?.duration_months || 1) * 30,
      durationDays: (apiInvestment.promotion?.duration_months || 1) * 30,
      returnRate: apiInvestment.promotion?.percentaje || 0,
      dailyInterest: parseFloat(((apiInvestment.promotion?.percentaje || 0) / ((apiInvestment.promotion?.duration_months || 1) * 30)).toFixed(3)),
      features: [],
      color: '',
      highlightColor: '',
      promotionEligible: true,
      popular: false
    },
    withdrawals: (apiInvestment.withdrawals || []).map(w => ({
      id: w.id,
      investment_id: w.investment_id,
      amount: w.amount,
      transferred_at: w.transferred_at
    }))
  };

  return investment;
};

export const Investments = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<InvestmentPlan | null>(null);
  const [promotions, setPromotions] = useState<InvestmentPlan[]>([]);
  const [dailyGains, setDailyGains] = useState<DailyGain[]>([]);

  const { balance: userBalance, error: balanceError, refreshBalance } = useUserBalance();

  const mapPromotionToPlan = useCallback((promotion: {
    id: string | number;
    name: string;
    percentaje: number;
    atipay_price_promotion: number;
    duration_months: number;
    status: 'active' | 'inactive';
  }): InvestmentPlan => ({
    id: promotion.id.toString(),
    name: promotion.name,
    percentaje: promotion.percentaje,
    minAmount: 0,
    maxAmount: 10000,
    atipay_price_promotion: promotion.atipay_price_promotion,
    duration_months: promotion.duration_months,
    status: promotion.status,
    duration: promotion.duration_months * 30,
    durationDays: promotion.duration_months * 30,
    returnRate: promotion.percentaje,
    dailyInterest: parseFloat((promotion.percentaje / (promotion.duration_months * 30)).toFixed(3)),
    features: [],
    color: '',
    highlightColor: '',
    promotionEligible: true,
    popular: false
  }), []); // Empty dependency array since it doesn't depend on any props or state

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setIsLoading(true);
        const promotionsData = await getPromotions();
        const mappedPromotions = promotionsData.map((promo) =>
          mapPromotionToPlan({
            id: promo.id,
            name: promo.name,
            percentaje: promo.percentaje,
            atipay_price_promotion: promo.atipay_price_promotion,
            duration_months: promo.duration_months,
            status: promo.status
          })
        );
        setPromotions(mappedPromotions);
      } catch (error) {
        console.error('Error fetching promotions:', error);
        setError('Error al cargar las promociones. Por favor, intente de nuevo más tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromotions();
  }, [mapPromotionToPlan]);

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [activeTab] = useState('active');

  const activeInvestments = investments.filter(inv => inv.status === 'active');

  const fetchDailyGains = useCallback(async (investmentId: number) => {
    try {
      const gains = await getInvestmentDailyGains(investmentId);
      return gains;
    } catch (error) {
      console.error(`Error al obtener ganancias diarias para la inversión ${investmentId}:`, error);
      return [];
    }
  }, []);

  const fetchAllDailyGains = useCallback(async (activeInvestments: Investment[]) => {
    if (!activeInvestments.length) return [];

    try {
      const results = await Promise.allSettled(
        activeInvestments.map(inv => fetchDailyGains(inv.id))
      );

      const allGains = results.reduce<DailyGain[]>((acc, result) => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          return [...acc, ...result.value];
        }
        return acc;
      }, []);

      return allGains;
    } catch (error) {
      console.error('Error general al obtener ganancias diarias:', error);
      return [];
    }
  }, [fetchDailyGains]);

  interface PromotionResponse {
    id: string | number;
    name: string;
    percentaje: number;
    atipay_price_promotion: number;
    duration_months: number;
    status: 'active' | 'inactive';
    [key: string]: unknown;
  }

  interface ActiveInvestmentsResponse {
    investments?: unknown[];
    promotions?: PromotionResponse[];
  }

  const isActiveInvestmentsResponse = useCallback((
    response: unknown
  ): response is ActiveInvestmentsResponse => {
    return (
      typeof response === 'object' &&
      response !== null &&
      ('investments' in response || 'promotions' in response)
    );
  }, []);

  const handleActiveInvestmentsResponse = useCallback(async (
    response: unknown
  ): Promise<unknown[]> => {

    try {
      if (Array.isArray(response)) {
        return response;
      }

      if (isActiveInvestmentsResponse(response) &&
        response.investments &&
        Array.isArray(response.investments)) {

        if (response.promotions?.length && promotions.length === 0) {
          const mappedPromotions = response.promotions.map(mapPromotionToPlan);
          setPromotions(mappedPromotions);
        }
        return response.investments;
      }

      console.error('Unexpected response format for active investments:', response);
      return [];
    } catch (error) {
      console.error('Error processing active investments response:', error);
      return [];
    }
  }, [mapPromotionToPlan, promotions.length, isActiveInvestmentsResponse]);

  const fetchInvestmentsByTab = useCallback(async (tab: string) => {
    try {
      let investments: unknown[] = [];

      if (tab === 'active') {
        const response = await getActiveInvestments();
        const activeInvestments = await handleActiveInvestmentsResponse(response);
        investments = Array.isArray(activeInvestments) ? activeInvestments : [];
      } else if (tab === 'pending') {
        const pendingInvestments = await getPendingInvestments();
        investments = Array.isArray(pendingInvestments) ? pendingInvestments : [];
      } else {
        const allInvestments = await getInvestments();
        investments = Array.isArray(allInvestments) ? allInvestments : [];
      }

      const transformedInvestments = investments
        .filter((inv): inv is ApiInvestment =>
          inv !== null &&
          typeof inv === 'object' &&
          'id' in inv &&
          'user_id' in inv &&
          'promotion_id' in inv
        )
        .map(transformInvestment);

      if (tab === 'active') {
        const gains = await fetchAllDailyGains(transformedInvestments);
        setDailyGains(gains);
      } else {
        setDailyGains([]);
      }

      return transformedInvestments;
    } catch (error) {
      console.error('Error fetching investments:', error);
      setError('Error al cargar las inversiones. Por favor, intente de nuevo.');
      return [];
    }
  }, [handleActiveInvestmentsResponse, fetchAllDailyGains]);

  const handleApiError = useCallback((error: unknown) => {
    console.error('Error fetching investments:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    if (errorMessage.includes('Network error') || errorMessage.includes('Failed to fetch')) {
      setError('Error de conexión. Por favor, verifica tu conexión a internet.');
      toast.error('Error de conexión');
    } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      toast.error('Sesión expirada');
    } else if (errorMessage.includes('403')) {
      setError('No tienes permiso para ver esta información.');
      toast.error('Acceso denegado');
    } else {
      setError('No se pudieron cargar las inversiones. Por favor, intenta de nuevo.');
      toast.error('Error al cargar las inversiones');
    }
  }, [setError]);

  const fetchInvestments = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No authentication token found, redirecting to login...');
      window.location.href = '/auth/login';
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await fetchInvestmentsByTab(activeTab);
      if (!Array.isArray(data)) {
        throw new Error('Formato de respuesta inválido del servidor');
      }

      setInvestments(data);
    } catch (error) {
      handleApiError(error);
      setInvestments([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, fetchInvestmentsByTab, handleApiError]);

  useEffect(() => {
    fetchInvestments();
  }, [activeTab, fetchInvestments]);

  const handleConfirmInvestment = async (plan: InvestmentPlan) => {
    try {
      const investmentAmount = plan.atipay_price_promotion || 0;
      if (investmentAmount <= 0) {
        throw new Error('Monto de inversión no válido');
      }

      toast.loading(`Procesando inversión de S/ ${investmentAmount.toFixed(2)}...`);

      await createInvestment({
        promotion_id: Number(plan.id)
      });

      toast.dismiss();
      toast.success(`¡Inversión en ${plan.name} creada exitosamente!`);
      setShowConfirmation(false);

      await Promise.all([
        refreshBalance(),
        fetchInvestments()
      ]);
    } catch (error: unknown) {
      console.error('Error creating investment:', error);

      let errorMessage = 'Ocurrió un error al crear la inversión. Por favor, inténtalo de nuevo.';

      if (error && typeof error === 'object') {
        const err = error as {
          message?: string;
          response?: {
            status?: number;
          };
          errorData?: {
            errors?: {
              amount?: string[];
            };
          };
        };

        if (err.message) {
          errorMessage = err.message;
        } else if (err.response?.status === 422) {
          if (err.errorData?.errors?.amount?.[0]) {
            errorMessage = err.errorData.errors.amount[0];
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.dismiss();
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-4">
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4 space-y-4">
                <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse mt-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p>{error}</p>
        </div>
      )}
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Mis Inversiones</h1>

        {balanceError?.message && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{balanceError.message}</span>
          </div>
        )}

        <InvestmentStats
          investments={activeInvestments}
          userBalance={userBalance}
          dailyGains={dailyGains}
        />
      </div>

      <div className="mb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Promociones Exclusivas</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-green-500 to-amber-400 mx-auto mb-4 rounded-full"></div>
        </div>

        {(() => {
          if (isLoading) {
            return (
              <div key="loading" className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            );
          }

          if (error) {
            return <div key="error" className="text-center text-red-600 py-8">{error}</div>;
          }

          return (
            <div key="promotions-grid" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {promotions.map((promotion) => (
                <div
                  key={promotion.id}
                  className="relative w-full max-w-sm min-h-[20rem] rounded-xl bg-gradient-to-br from-green-900 to-green-800 border-2 border-green-700/50 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex flex-col"
                >
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="mb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-white truncate">{promotion.name}</h3>
                          <p className="text-sm font-medium text-green-200 mt-1">
                            {promotion.status === 'active' ? 'Disponible' : 'No disponible'}
                          </p>
                        </div>
                        <div className="ml-4 text-right">
                          <span className="text-3xl font-black text-white">{promotion.percentaje}%</span>
                          <p className="text-xs font-medium text-green-200">Ganacia</p>
                        </div>
                      </div>
                    </div>

                    <div className="h-px w-full bg-green-700/50 my-3"></div>

                    <div className="space-y-4 flex-1">
                      <div className="flex items-center text-green-100 bg-green-900/40 p-3 rounded-lg border border-green-800">
                        <div className="bg-green-800/50 p-2 rounded-lg mr-3">
                          <Clock className="w-5 h-5 text-green-300" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-green-300">Duración</p>
                          <p className="font-medium text-white">
                            {promotion.duration_months} {promotion.duration_months === 1 ? 'mes' : 'meses'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center text-green-100 bg-green-900/40 p-3 rounded-lg border border-green-800">
                        <div className="bg-green-800/50 p-2 rounded-lg mr-3">
                          <AtipayCoin size="sm" className="text-green-300" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-green-300">Precio</p>
                          <p className="font-medium text-white">
                            {formatCurrency(promotion.atipay_price_promotion || 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-green-800">
                      <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium ${promotion.status === 'active'
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-green-900/50 text-green-400 border border-green-800/50'
                        }`}>
                        {promotion.status === 'active' ? 'Activo' : 'Inactivo'}
                      </div>
                    </div>

                    <Button
                      className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 hover:border-white/30 transition-colors"
                      onClick={() => {
                        setSelectedPromotion(promotion);
                        setShowConfirmation(true);
                      }}
                      disabled={promotion.status !== 'active'}
                    >
                      {promotion.status === 'active' ? 'Seleccionar' : 'No disponible'}
                      {promotion.status === 'active' && <ArrowRight className="w-4 h-4 ml-2" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Tabla de Inversiones */}
      <InvestmentsTable
        investments={investments}
        isLoading={isLoading}
        isWithdrawing={isWithdrawing}
        onWithdraw={async (investmentId: number) => {
          try {
            setIsWithdrawing(investmentId);
            const result = await withdrawEarnings(investmentId);

            // Mostrar mensaje de éxito
            toast.success(`¡Retiro exitoso! Se han transferido $${result.monto.toFixed(2)} a tu billetera.`);

            // Actualizar el saldo del usuario
            refreshBalance();

            // Recargar las inversiones para actualizar los datos
            await fetchInvestmentsByTab(activeTab);
          } catch (error) {
            console.error('Error al retirar ganancias:', error);

            // Verificar si el error es porque ya se retiró la inversión
            if (error instanceof Error && error.message.includes('400')) {
              toast.error('Ya has retirado las ganancias de esta inversión.');
              // Recargar las inversiones para actualizar el estado
              await fetchInvestmentsByTab(activeTab);
            } else {
              toast.error(error instanceof Error ? error.message : 'Error al procesar el retiro');
            }
          } finally {
            setIsWithdrawing(null);
          }
        }}
      />

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Inversión</DialogTitle>
            <DialogDescription>
              Estás a punto de invertir en la promoción <span className="font-semibold">{selectedPromotion?.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Detalles de la inversión</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Tu saldo disponible:</span>
                  <div className="flex items-center gap-1 font-medium">
                    <AtipayCoin size="sm" />
                    {userBalance?.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Monto a invertir:</span>
                  <div className="flex items-center gap-1 font-medium">
                    <AtipayCoin size="sm" />
                    {selectedPromotion?.atipay_price_promotion?.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Tasa de retorno:</span>
                  <span className="font-medium">{selectedPromotion?.percentaje}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Duración:</span>
                  <span className="font-medium">{selectedPromotion?.duration_months} meses</span>
                </div>
              </div>
            </div>

            {userBalance !== null && selectedPromotion?.atipay_price_promotion && userBalance < selectedPromotion.atipay_price_promotion && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="https://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      No tienes suficiente saldo para realizar esta inversión. Por favor, recarga tu billetera primero.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-amber-50 p-4 rounded-md border border-amber-100">
              <h4 className="text-sm font-medium text-amber-800 mb-2">Instrucciones de pago</h4>
              <p className="text-sm text-amber-700">
                Una vez confirmada la inversión, recibirás las instrucciones de pago en tu correo electrónico.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmation(false);
              }}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              onClick={() => selectedPromotion ? handleConfirmInvestment(selectedPromotion) : null}
              disabled={!selectedPromotion}
            >
              Confirmar Inversión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
