import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router";
import AppLayout from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// Línea 10 aprox:
import {
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  Trophy,
  TrendingUp,
  Target,
  CheckCircle2,
} from "lucide-react";
import { AtipayCoin } from "@/components/ui/AtipayCoin";
import { getTransferHistory } from "@/services/walletService";
import {
  getActiveInvestments,
  type Investment as ServiceInvestment,
} from "@/services/investmentService";
import { getUserProfile, type UserProfile } from "@/services/userService";
import { API_BASE_URL } from "@/config";

import AnnualPerformanceChart from "@/components/dashboard/AnnualPerformanceChart";
import InvestmentGainsCharts from "@/components/investments/InvestmentGainsCharts";
import { getMinPointsRequired } from "../../services/commissionService";

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

  interface Investment extends Omit<ServiceInvestment, "promotion"> {
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
    recentTransactions: [],
    investments: [],
  });
  const [targetPoints, setTargetPoints] = useState(0); // Nuevo estado para la meta

  // Nuevo useEffect para cargar la meta dinámica
  useEffect(() => {
    const loadGoal = async () => {
      const points = await getMinPointsRequired();
      setTargetPoints(points);
    };
    loadGoal();
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/user`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar los datos del usuario");
      }

      const userData = await response.json();
      setError(null);

      let walletBalance = { balance: 0, currency: "PEN" };
      let investments: Investment[] = [];
      let transfersResponse: Transfer[] = [];

      try {
        walletBalance = {
          balance: userData.atipay_money || 0,
          currency: "PEN",
        };
      } catch (err) {
        console.error("Error fetching user data:", err);
      }

      try {
        const investmentsResponse = await getActiveInvestments();
        const investmentsData = Array.isArray(investmentsResponse)
          ? investmentsResponse
          : investmentsResponse?.investments || [];

        investments = investmentsData.map((inv) => ({
          ...inv,
          promotion: inv.promotion
            ? {
                name: inv.promotion.name,
                daily_interest: inv.promotion.percentaje / 100,
              }
            : undefined,
        }));
      } catch (err) {
        console.error("Error fetching investments:", err);
      }

      const totalEarnings = investments.reduce(
        (sum, inv) => sum + (inv.total_earning || 0),
        0
      );

      try {
        transfersResponse = (await getTransferHistory("sent")) as Transfer[];
      } catch (err) {
        console.error("Error fetching transfer history:", err);
      }

      const transactions = transfersResponse.map((transfer) => ({
        id: transfer.id,
        type: "transfer",
        amount: transfer.amount,
        status: transfer.status,
        created_at: transfer.created_at,
        description: `Transferencia a ${transfer.receiver_name || "usuario"}`,
      }));

      setDashboardData({
        balance: walletBalance.balance,
        activeInvestments: investments.length,
        totalEarnings,
        points: userData.accumulated_points || 0,
        points_history: userData.points_history || [],
        recentTransactions: transactions,
        investments: investments.map((inv) => ({
          id: inv.id,
          amount: inv.amount,
          status: inv.status,
          promotion: {
            name: inv.promotion?.name || "Plan de inversión",
            daily_interest: inv.promotion?.daily_interest || 0,
          },
          created_at: inv.created_at,
        })),
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(
        "No se pudo cargar la información del dashboard. Por favor, intenta de nuevo más tarde."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin/dashboard");
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
        console.error("Error fetching user profile:", err);
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
      maximumFractionDigits: 2,
    }).format(amount);

    return (
      <div className="flex items-center gap-1">
        {showCoin && (
          <span className="inline-flex">
            <AtipayCoin size="xs" className="w-4 h-4" />
          </span>
        )}
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
              {`Hola, ${userProfile?.username || user.firstName || user.email?.split("@")[0] || "Usuario"}`}
            </h1>
            <p className="text-gray-600">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
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
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {transaction.type === "deposit"
                            ? "Depósito"
                            : "Retiro"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.created_at &&
                          !isNaN(new Date(transaction.created_at).getTime())
                            ? new Date(
                                transaction.created_at
                              ).toLocaleDateString()
                            : "Fecha no disponible"}
                        </p>
                      </div>
                      <div
                        className={`font-medium ${transaction.type === "deposit" ? "text-green-600" : "text-red-600"}`}
                      >
                        {transaction.type === "deposit" ? "+" : "-"}S/{" "}
                        {transaction.amount.toFixed(2)}
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
                  {showCoin ? formatCurrency(dashboardData.balance) : "••••••"}
                  <button
                    onClick={() => setShowCoin(!showCoin)}
                    className="ml-2 text-white/70 hover:text-white"
                  >
                    {showCoin ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-white/80">
                  <span className="text-white font-medium">
                    +
                    {
                      dashboardData.recentTransactions.filter(
                        (t) => t.type === "credit"
                      ).length
                    }{" "}
                    operaciones
                  </span>{" "}
                  este mes
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
                  {showCoin
                    ? formatCurrency(dashboardData.totalEarnings)
                    : "••••"}
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
                  {dashboardData.investments.length > 0
                    ? `Última: ${dashboardData.investments[0].promotion?.name || "Sin nombre"}`
                    : "Sin inversiones activas"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        {/* ================= SECCIÓN PRO: RENDIMIENTO INTEGRAL ================= */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Rendimiento del Ciclo
            </h2>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {new Date().toLocaleDateString("es-ES", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
              {/* COLUMNA IZQUIERDA: ESTADO Y METAS (40% ancho) */}
              <div className="lg:col-span-5 p-6 flex flex-col justify-center bg-gray-50/50">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                      Estado de Calificación
                    </h3>
                    <p className="text-xs text-gray-500">
                      Meta mensual establecida
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                      {dashboardData.points.toLocaleString()}
                    </span>
                    <span className="text-sm font-medium text-gray-500">
                      pts actuales
                    </span>
                  </div>

                  {/* Mensaje dinámico */}
                  {dashboardData.points < targetPoints ? (
                    <p className="text-sm text-amber-600 font-medium mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Te faltan {targetPoints - dashboardData.points} pts para
                      calificar
                    </p>
                  ) : (
                    <p className="text-sm text-green-600 font-medium mt-1 flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      ¡Has superado la meta por{" "}
                      {dashboardData.points - targetPoints} pts!
                    </p>
                  )}
                </div>

                {/* Barra de Progreso */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                    <span>Progreso</span>
                    <span>
                      {Math.min(
                        (dashboardData.points / (targetPoints || 1)) * 100,
                        100
                      ).toFixed(0)}
                      %
                    </span>
                  </div>
                  <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        dashboardData.points >= targetPoints
                          ? "bg-gradient-to-r from-green-500 to-emerald-600"
                          : "bg-gradient-to-r from-amber-400 to-orange-500"
                      }`}
                      style={{
                        width: `${Math.min((dashboardData.points / (targetPoints || 1)) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-end mt-1">
                    <span className="text-xs font-medium text-gray-400">
                      Meta: {targetPoints} pts
                    </span>
                  </div>
                </div>

                {/* Badge Final */}
                <div className="mt-6">
                  {dashboardData.points >= targetPoints ? (
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg text-green-800">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold">¡Calificado!</p>
                        <p className="text-xs opacity-90">
                          Ya puedes solicitar retiros este mes.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-600">
                      <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold">En progreso</p>
                        <p className="text-xs opacity-90">
                          Sigue acumulando puntos para desbloquear retiros.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* COLUMNA DERECHA: GRÁFICO (60% ancho) */}
              <div className="lg:col-span-7 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    Historial de Rendimiento
                  </h3>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Total Año: {dashboardData.points} pts
                  </span>
                </div>

                <div className="h-[300px] w-full min-h-[300px] overflow-hidden">
                  <AnnualPerformanceChart
                    data={dashboardData.points_history || []}
                    totalAnual={dashboardData.points}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LÓGICA FINAL: Si invierte -> Gráficos. Si no -> Calificación */}
        {/* ================================================================================== */}
        {/* SECCIÓN INFERIOR: CÓMO CRECEN TUS INVERSIONES (Lógica recuperada)                  */}
        {/* ================================================================================== */}

        <div className="mt-8">
          {/* TÍTULO DE LA SECCIÓN */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Cómo crecen tus inversiones
            </h2>
            <p className="text-sm text-gray-500">
              Visualiza tus ganancias diarias y el progreso mensual de una
              inversión específica.
            </p>
          </div>

          {dashboardData.investments.length > 0 ? (
            // OPCIÓN A: SI TIENE INVERSIONES -> MUESTRA EL GRÁFICO REAL
            <Card>
              <CardContent className="pt-6">
                <InvestmentGainsCharts
                  investmentId={dashboardData.investments[0].id}
                />
              </CardContent>
            </Card>
          ) : (
            // OPCIÓN B: NO TIENE INVERSIONES -> MUESTRA EL DISEÑO DE "ESTADO VACÍO" (FOTO 2)
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tarjeta 1: Ganancias Diarias Vacía */}
              <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center h-64 justify-center">
                <div className="w-full text-left mb-auto">
                  <h3 className="text-lg font-bold text-orange-500">
                    Ganancias diarias
                  </h3>
                  <p className="text-xs text-orange-300">
                    No hay inversiones registradas
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="mb-4 bg-orange-50 p-3 rounded-full">
                    <AtipayCoin size="lg" className="w-10 h-10" />
                  </div>
                  <h4 className="text-gray-600 font-medium text-sm mb-1">
                    Aún no tienes inversiones activas.
                  </h4>
                  <p className="text-xs text-gray-400 max-w-[250px]">
                    Comienza invirtiendo en alguno de nuestros planes para ver
                    tus ganancias aquí.
                  </p>
                </div>
              </div>

              {/* Tarjeta 2: Ganancias Mensuales Vacía */}
              <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center h-64 justify-center">
                <div className="w-full text-left mb-auto">
                  <h3 className="text-lg font-bold text-orange-500">
                    Ganancias mensuales
                  </h3>
                  <p className="text-xs text-orange-300">
                    No hay inversiones registradas
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="mb-4 bg-orange-50 p-3 rounded-full">
                    <AtipayCoin size="lg" className="w-10 h-10" />
                  </div>
                  <h4 className="text-gray-600 font-medium text-sm mb-1">
                    Las ganancias mensuales aparecerán aquí.
                  </h4>
                  <p className="text-xs text-gray-400 max-w-[250px]">
                    Realiza tu primera inversión para comenzar a generar
                    ganancias.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>{" "}
      {/* Este cierra el div className="p-6 space-y-6" */}
    </AppLayout>
  );
}
