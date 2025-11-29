import { KPICard } from "../common/KPICard";
import { Users, TrendingUp, DollarSign, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/pages/admin/Dashboard/utils/formatters";
import { AtipayCoin } from "@/components/ui/AtipayCoin";

interface KPISectionProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalInvestments: number;
    pendingWithdrawals: number;
    monthlyRevenue: number;
    averageInvestment: number;
  };
}

export const KPISection = ({ stats }: KPISectionProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <KPICard
      title="Usuarios Totales"
      value={stats.totalUsers.toLocaleString()}
      icon={<Users className="w-4 h-4 text-blue-500" />}
      description={`${stats.activeUsers} activos este mes`}
    />

    <KPICard
      title="Inversiones Totales"
      value={formatCurrency(stats.totalInvestments)}
      icon={<TrendingUp className="w-4 h-4 text-green-500" />}
      description={
        <div className="flex items-center gap-1">
          <span>Promedio:</span>
          <div className="flex items-center gap-0.5">
            <AtipayCoin size="xs" className="w-3.5 h-3.5" />
            <span>{formatCurrency(stats.averageInvestment)}</span>
          </div>
        </div>
      }
      valueColor="text-green-600"
      showCoin
    />

    <KPICard
      title="Ingresos Mensuales"
      value={formatCurrency(stats.monthlyRevenue)}
      icon={<DollarSign className="w-4 h-4 text-purple-500" />}
      description="+15.3% vs mes anterior"
      valueColor="text-purple-600"
      showCoin
    />

    <KPICard
      title="Retiros Pendientes"
      value={stats.pendingWithdrawals.toString()}
      icon={<AlertTriangle className="w-4 h-4 text-orange-500" />}
      description="Requieren atención"
      valueColor="text-orange-600"
    />
  </div>
);
