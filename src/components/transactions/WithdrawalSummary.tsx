import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/transactionUtils";

interface WithdrawalSummaryProps {
  amount: string;
  availableBalance: number;
  isSubmitting: boolean;
  isValid: boolean;
  onSubmit: () => void;
}

export const WithdrawalSummary = ({
  amount,
  availableBalance,
  isSubmitting,
  isValid,
  onSubmit,
}: WithdrawalSummaryProps) => {
  const formattedAmount = amount ? `S/.${parseFloat(amount).toFixed(2)}` : "S/. 0.00";
  const remainingBalance = amount ? availableBalance - parseFloat(amount) : availableBalance;

  return (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 lg:sticky lg:top-2">
      <h3 className="font-medium text-gray-900 mb-3">
        Resumen del retiro
      </h3>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Monto a retirar</span>
          <span className="font-medium">{formattedAmount}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-600">
            Comisión estimada
          </span>
          <span className="text-sm text-gray-600">S/. 0.00</span>
        </div>

        <div className="h-px bg-gray-200 my-2"></div>

        <div className="flex justify-between">
          <span className="font-medium text-gray-900">Saldo restante</span>
          <span className="font-medium text-green-600">
            {formatCurrency(remainingBalance)}
          </span>
        </div>

        <Button
          className="w-full mt-4 bg-green-600 hover:bg-green-700"
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              <span>Procesando...</span>
            </>
          ) : (
            'Confirmar retiro'
          )}
        </Button>
      </div>
    </div>
  );
};
