import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router";
import AppLayout from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, RefreshCw, AlertCircle } from "lucide-react";
import { AtipayCoin } from "@/components/ui/AtipayCoin";
import { getTransferHistory } from "@/services/walletService";
import { getActiveInvestments, type Investment as ServiceInvestment } from "@/services/investmentService";
import { getUserProfile, type UserProfile } from "@/services/userService";
import { API_BASE_URL } from "@/config";
import QualificationStatus from "@/components/dashboard/QualificationStatus";
import AnnualPerformanceChart from "@/components/dashboard/AnnualPerformanceChart";
import InvestmentGainsCharts from "@/components/investments/InvestmentGainsCharts";
interface Transfer {
  id: number;
  amount: number;
  status: string;
  created_at: string;
  receiver_name?: string;
  description?: string;
}


interface DashboardData {
  balance: number;
  totalEarnings: number;
  activeInvestments: number;
  points: number;
  
  points_history?: Array<{ name: string; puntos: number }>;
  recentTransactions: Array<{
    id: number;
    type: string;
    amount: number;
    status: string;
    created_at: string;
    description: string;
  }>;
  investments: Array<{
    id: number;
    amount: number;
    status: string;
    promotion: {
      name: string;
      daily_interest: number;
    };
    created_at: string;
  }>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCoin, setShowCoin] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  interface Investment extends Omit<ServiceInvestment, 'promotion'> {
    promotion?: {
      name: string;
      daily_interest: number;
    };
  }

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    balance: 0,
    totalEarnings: 0,
    activeInvestments: 0,
    points: 0,
    min_points: 100,
    recentTransactions: [],
    investments: []
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/user`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar los datos del usuario');
      }

      const userData = await response.json();
      setError(null);

      let walletBalance = { balance: 0, currency: 'PEN' };
      let investments: Investment[] = [];
      let transfersResponse: Transfer[] = [];

      try {
        walletBalance = {
          balance: userData.atipay_money || 0,
          currency: 'PEN'
        };
      } catch (err) {
        console.error('Error fetching user data:', err);
      }

      try {
        const investmentsResponse = await getActiveInvestments();
        const investmentsData = Array.isArray(investmentsResponse)
          ? investmentsResponse
          : investmentsResponse?.investments || [];

        investments = investmentsData.map(inv => ({
          ...inv,
          promotion: inv.promotion ? {
            name: inv.promotion.name,
            daily_interest: inv.promotion.percentaje / 100
          } : undefined
        }));
      } catch (err) {
        console.error('Error fetching investments:', err);
      }

      const totalEarnings = investments.reduce((sum, inv) => sum + (inv.total_earning || 0), 0);

      try {
        transfersResponse = await getTransferHistory('sent') as Transfer[];
      } catch (err) {
        console.error('Error fetching transfer history:', err);
      }

      const transactions = transfersResponse.map(transfer => ({
        id: transfer.id,
        type: 'transfer',
        amount: transfer.amount,
        status: transfer.status,
        created_at: transfer.created_at,
        description: `Transferencia a ${transfer.receiver_name || 'usuario'}`
      }));

      setDashboardData({
        balance: walletBalance.balance,
        activeInvestments: investments.length,
        totalEarnings,
        points: userData.accumulated_points || 0,
        min_points: parseInt(userData.min_withdrawal_points) || 100,
        points_history: userData.points_history || [],
        recentTransactions: transactions,
        investments: investments.map(inv => ({
          id: inv.id,
          amount: inv.amount,
          status: inv.status,
          promotion: {
            name: inv.promotion?.name || 'Plan de inversión',
            daily_interest: inv.promotion?.daily_interest || 0
          },
          created_at: inv.created_at
        }))
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('No se pudo cargar la información del dashboard. Por favor, intenta de nuevo más tarde.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard');
      return;
    }

    if (user) {
      fetchDashboardData();
    }
  }, [user, navigate, fetchDashboardData]);

  // Obtener perfil del usuario para mostrar el nombre correcto
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (!user) return null;

  const formatCurrency = (amount: number, showCoin: boolean = true) => {
    const formattedAmount = new Intl.NumberFormat("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);

    return (
      <div className="flex items-center gap-1">
        {showCoin && <span className="inline-flex"><AtipayCoin size="xs" className="w-4 h-4" /></span>}
        <span>{formattedAmount}</span>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-black">
              {`Hola, ${userProfile?.username || user.firstName || user.email?.split('@')[0] || "Usuario"}`}
            </h1>
            <p className="text-gray-600">
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="block sm:inline">{error}</span>
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Transacciones Recientes</CardTitle>
                <CardDescription>Últimas 5 transacciones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {transaction.type === 'deposit' ? 'Depósito' : 'Retiro'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.created_at && !isNaN(new Date(transaction.created_at).getTime())
                            ? new Date(transaction.created_at).toLocaleDateString()
                            : 'Fecha no disponible'}
                        </p>
                      </div>
                      <div className={`font-medium ${transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'deposit' ? '+' : '-'}S/ {transaction.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                  {dashboardData.recentTransactions.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No hay transacciones recientes
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">
                  Saldo Disponible
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <AtipayCoin size="sm" className="text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {showCoin ? formatCurrency(dashboardData.balance) : '••••••'}
                  <button
                    onClick={() => setShowCoin(!showCoin)}
                    className="ml-2 text-white/70 hover:text-white"
                  >
                    {showCoin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-white/80">
                  <span className="text-white font-medium">
                    +{dashboardData.recentTransactions.filter(t => t.type === 'credit').length} operaciones
                  </span> este mes
                </p>
              </CardContent>
            </Card>

            {/* Ganancias Totales Card */}
            <Card className="bg-gradient-to-br from-[#0c4a2a] to-[#0a7e3e] text-white border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">
                  Proyeccion de Ganancias
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <AtipayCoin size="sm" className="text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {showCoin ? formatCurrency(dashboardData.totalEarnings) : "••••"}
                </div>
                <p className="text-xs text-white/80">
                  De {dashboardData.investments.length} inversiones activas
                </p>
              </CardContent>
            </Card>

            {/* Puntos Acumulados Card */}
            <Card className="bg-gradient-to-br from-teal-700 to-teal-900 text-white border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">
                  Puntos de Acumulados
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <AtipayCoin size="sm" className="text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  <div className="flex items-center gap-1">
                    <AtipayCoin size="xs" className="w-4 h-4 text-white" />
                    <span>{dashboardData.points.toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-xs text-white/80">
                  Acumulados por tus transacciones
                </p>
              </CardContent>
            </Card>

            {/* Inversiones Activas Card */}
            <Card className="bg-gradient-to-br from-lime-700 to-lime-900 text-white border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">
                  Mis Inversiones Activas
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <AtipayCoin size="sm" className="text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {dashboardData.investments.length}
                </div>
                <p className="text-xs text-white/80">
                  {dashboardData.investments.length > 0 ? (
                    `Última: ${dashboardData.investments[0].promotion?.name || 'Sin nombre'}`
                  ) : 'Sin inversiones activas'}
                </p>
              </CardContent>
            </Card>

          </div>
        )}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Tu progreso en la red</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Columna Izquierda: Estado de Calificación */}
              <div className="lg:col-span-5">
                  <QualificationStatus 
                      puntosActuales={dashboardData.points} 
                      //calcular puntos minimos desde el backend
                      puntosMeta={dashboardData.min_points}
                      puntosMeta={93} 
                  />
              </div>

              {/* Columna Derecha: Gráfica Anual */}
              <div className="lg:col-span-7"><AnnualPerformanceChart 
       // Pasamos los datos del backend. Si no existen aún, pasamos un array vacío []
        data={dashboardData.points_history || []} 
       totalAnual={dashboardData.points} // O la suma del historial si prefieres
    /></div>
          </div>
      </div>

        {/* LÓGICA FINAL: Si invierte -> Gráficos. Si no -> Calificación */}
        {/* ================================================================================== */}
        {/* SECCIÓN INFERIOR: CÓMO CRECEN TUS INVERSIONES (Lógica recuperada)                  */}
        {/* ================================================================================== */}
        
        <div className="mt-8">
          {/* TÍTULO DE LA SECCIÓN */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-800">Cómo crecen tus inversiones</h2>
            <p className="text-sm text-gray-500">
              Visualiza tus ganancias diarias y el progreso mensual de una inversión específica.
            </p>
          </div>

          {dashboardData.investments.length > 0 ? (
            // OPCIÓN A: SI TIENE INVERSIONES -> MUESTRA EL GRÁFICO REAL
            <Card>
              <CardContent className="pt-6">
                <InvestmentGainsCharts investmentId={dashboardData.investments[0].id} />
              </CardContent>
            </Card>
          ) : (
            // OPCIÓN B: NO TIENE INVERSIONES -> MUESTRA EL DISEÑO DE "ESTADO VACÍO" (FOTO 2)
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Tarjeta 1: Ganancias Diarias Vacía */}
              <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center h-64 justify-center">
                <div className="w-full text-left mb-auto">
                   <h3 className="text-lg font-bold text-orange-500">Ganancias diarias</h3>
                   <p className="text-xs text-orange-300">No hay inversiones registradas</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="mb-4 bg-orange-50 p-3 rounded-full">
                     <AtipayCoin size="lg" className="w-10 h-10" />
                  </div>
                  <h4 className="text-gray-600 font-medium text-sm mb-1">Aún no tienes inversiones activas.</h4>
                  <p className="text-xs text-gray-400 max-w-[250px]">
                    Comienza invirtiendo en alguno de nuestros planes para ver tus ganancias aquí.
                  </p>
                </div>
              </div>

              {/* Tarjeta 2: Ganancias Mensuales Vacía */}
              <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center h-64 justify-center">
                <div className="w-full text-left mb-auto">
                   <h3 className="text-lg font-bold text-orange-500">Ganancias mensuales</h3>
                   <p className="text-xs text-orange-300">No hay inversiones registradas</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="mb-4 bg-orange-50 p-3 rounded-full">
                     <AtipayCoin size="lg" className="w-10 h-10" />
                  </div>
                  <h4 className="text-gray-600 font-medium text-sm mb-1">Las ganancias mensuales aparecerán aquí.</h4>
                  <p className="text-xs text-gray-400 max-w-[250px]">
                    Realiza tu primera inversión para comenzar a generar ganancias.
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>

      </div> {/* Este cierra el div className="p-6 space-y-6" */}
    </AppLayout>
  );
}
