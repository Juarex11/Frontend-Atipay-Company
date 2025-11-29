import type { Investment } from '../types';
import type { DailyGain } from '@/services/investmentService';
import { AtipayCoin } from '@/components/ui/AtipayCoin';
import { DollarSign, Activity, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface InvestmentStatsProps {
  investments: Investment[];
  userBalance?: number;
  dailyGains?: DailyGain[];
}

export const InvestmentStats: React.FC<InvestmentStatsProps> = ({ investments, userBalance = 0, dailyGains = [] }) => {
  // Usar atipay_price_promotion para calcular el total invertido
  const totalInvested = investments.reduce((sum, inv) => {
    return sum + (inv.promotion?.atipay_price_promotion || 0);
  }, 0);
  
  // Calcular ganancias diarias totales de las inversiones activas
  const totalDailyEarnings = investments.reduce((sum, inv) => {
    if (inv.status === 'active') {
      return sum + (inv.daily_earning || 0);
    }
    return sum;
  }, 0);
  
  // Usar las ganancias diarias de la API si están disponibles, de lo contrario calcularlas
  const totalDailyGains = dailyGains.length > 0 
    ? dailyGains.reduce((sum, gain) => sum + gain.amount, 0)
    : totalDailyEarnings;

  const stats = [
    {
      title: "Invertido Total",
      value: (
        <div className="flex items-center gap-1">
          <AtipayCoin size="sm" className="mt-0.5 text-white" />
          <span className="text-white">{totalInvested.toFixed(2)}</span>
        </div>
      ),
      icon: DollarSign,
      color: "text-white",
      cardClass: "bg-gradient-to-br from-[#0c4a2a] to-[#0a7e3e] text-white border-0",
      titleClass: "text-white/90",
    },
    {
      title: "Saldo Disponible",
      value: (
        <div className="flex items-center gap-1">
          <AtipayCoin size="sm" className="mt-0.5 text-white" />
          <span className="text-white">{userBalance.toFixed(2)}</span>
        </div>
      ),
      icon: Activity,
      color: "text-white",
      cardClass: "bg-gradient-to-br from-emerald-700 to-emerald-900 text-white border-0",
      titleClass: "text-white/90",
    },
    {
      title: "Ganancias Diarias",
      value: (
        <div className="flex items-center gap-1">
          <AtipayCoin size="sm" className="mt-0.5 text-white" />
          <span className="text-white">{totalDailyGains.toFixed(2)}</span>
        </div>
      ),
      icon: TrendingUp,
      color: "text-white",
      cardClass: "bg-gradient-to-br from-lime-700 to-lime-900 text-white border-0",
      titleClass: "text-white/90",
    }
  ];

  return (
    <div className="w-full overflow-x-auto">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {stats.map((stat) => (
          <Card key={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`} className={stat.cardClass}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className={`text-sm font-medium ${stat.titleClass || ''}`}>
                  {stat.title}
                </p>
                <div className="h-4 w-4 text-muted-foreground">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <AtipayCoin size="sm" />
                <div className="text-2xl font-bold">
                  {stat.title === 'Invertido Total' && totalInvested.toFixed(2)}
                  {stat.title === 'Saldo Disponible' && userBalance.toFixed(2)}
                  {stat.title === 'Ganancias Diarias' && totalDailyGains.toFixed(2)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stat.title === 'Ganancias Diarias' ? 'Ganancias de hoy' : 'Saldo actual'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
