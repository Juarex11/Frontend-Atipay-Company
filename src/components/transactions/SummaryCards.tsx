import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, ArrowDownRight } from "lucide-react";
import { formatCurrency } from "@/utils/transactionUtils";
import { AtipayCoin } from "@/components/ui/AtipayCoin";

interface SummaryCardsProps {
  availableBalance: number;
  totalEarnings: number;
  totalWithdrawalsCount?: number; // cantidad de retiros realizados
  accumulatedPoints?: number;
  atipayMoney?: number; // saldo real a mostrar
}

export const SummaryCards = ({
  availableBalance,
  totalWithdrawalsCount,
  accumulatedPoints,
  atipayMoney,
}: SummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-0 bg-gradient-to-br from-[#0c4a2a] to-[#0a7e3e] text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
          <CardTitle className="text-sm font-medium text-white/90">
            Saldo Disponible
          </CardTitle>
          <Wallet className="w-4 h-4 text-white" />
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex items-center gap-2">
            <AtipayCoin size="sm" className="w-5 h-5 text-white" />
            <span className="text-2xl font-bold text-white">
              {formatCurrency(
                typeof atipayMoney === "number" ? atipayMoney : availableBalance
              )}
            </span>
          </div>
          <p className="text-xs text-white/80 mt-2">Balance Atipay</p>
        </CardContent>
      </Card>


      <Card className="border-0 bg-gradient-to-br from-lime-700 to-lime-900 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
          <CardTitle className="text-sm font-medium text-white/90">
            Retiros Completados
          </CardTitle>
          <ArrowDownRight className="w-4 h-4 text-white" />
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">
              {typeof totalWithdrawalsCount === "number" ? totalWithdrawalsCount : 0}
            </span>
            <span className="text-sm text-white/80 mt-1">retiros</span>
          </div>
          <p className="text-xs text-white/80 mt-2">
            Cantidad de retiros realizados
          </p>
        </CardContent>
      </Card>

      {typeof accumulatedPoints === "number" && (
        <Card className="border-0 bg-gradient-to-br from-teal-700 to-teal-900 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
            <CardTitle className="text-sm font-medium text-white/90">
              Puntos Acumulados
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-white" />
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{accumulatedPoints}</span>
            </div>
            <p className="text-xs text-white/80 mt-2">
              Compras, cursos e inversiones
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
