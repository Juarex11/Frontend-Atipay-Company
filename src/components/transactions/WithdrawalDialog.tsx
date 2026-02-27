import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { type LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { WithdrawalMethod } from "@/types/transactions";
import { formatCurrency } from "@/utils/transactionUtils";
import {
  validateWithdrawalAddress,
  validateWithdrawalAmount,
  getWithdrawalLabel,
  getWithdrawalPlaceholder,
  getWithdrawalDescription
} from "@/utils/withdrawalUtils";
import { WithdrawalMethodSelector } from "./WithdrawalMethodSelector";

interface WithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  withdrawalMethods: Array<WithdrawalMethod & { icon: LucideIcon }>;
}

export const WithdrawalDialog = ({
  open,
  onOpenChange,
  availableBalance,
  withdrawalMethods,
}: WithdrawalDialogProps) => {
  // Colores base por método
  const methodColors: Record<string, string> = {
    yape: "#8628A5",
    plin: "#2AACE9",
    bank: "#0DC055",
    crypto: "#F1BB14",
  };

  // Utilidad para agregar alpha a un color hex
  const addAlpha = useCallback((hex: string, opacity: number) => {
    if (!hex) return "transparent";
    const cleanHex = hex.replace("#", "");
    const fullHex = cleanHex.length === 3
      ? cleanHex.split("").map(c => c + c).join("")
      : cleanHex;

    const num = parseInt(fullHex, 16);
    if (isNaN(num)) return "transparent";

    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }, []);

  const [withdrawalMethod, setWithdrawalMethod] = useState<string>("");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalAddress, setWithdrawalAddress] = useState("");
  const [addressError, setAddressError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  // Memoize selected method config
  const selectedMethodConfig = useMemo(
    () => withdrawalMethods.find(m => m.id === withdrawalMethod),
    [withdrawalMethod, withdrawalMethods]
  );

  // Check if form is valid
  const isFormValid = useMemo(() => {
    if (!withdrawalMethod || !withdrawalAmount || !withdrawalAddress) return false;
    if (addressError || amountError) return false;
    const amount = parseFloat(withdrawalAmount);
    return amount > 0 && amount <= availableBalance;
  }, [withdrawalMethod, withdrawalAmount, withdrawalAddress, addressError, amountError, availableBalance]);

  const handleMethodSelect = (methodId: string) => {
    setWithdrawalMethod(methodId);
    setWithdrawalAddress("");
    setAddressError(null);
  };

  const processAddressInput = useCallback((value: string, method: string): string => {
    if (!method) return value;

    const processMap: Record<string, (val: string) => string> = {
      yape: (val) => val.replace(/\D/g, "").slice(0, 9),
      plin: (val) => val.replace(/\D/g, "").slice(0, 9),
      bank: (val) => val.replace(/\D/g, "").slice(0, 20),
      crypto: (val) => val.replace(/\s/g, "")
    };

    const processor = processMap[method];
    return processor ? processor(value) : value;
  }, []);

  const handleAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const processedValue = processAddressInput(e.target.value, withdrawalMethod);
    setWithdrawalAddress(processedValue);
    setAddressError(validateWithdrawalAddress(withdrawalMethod, processedValue));
  }, [withdrawalMethod, processAddressInput]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setWithdrawalAmount(value);
      if (withdrawalMethod && selectedMethodConfig) {
        setAmountError(
          validateWithdrawalAmount(
            value,
            availableBalance,
            selectedMethodConfig.min,
            selectedMethodConfig.max
          )
        );
      }
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!withdrawalMethod || !withdrawalAmount || !withdrawalAddress) {
      return;
    }

    try {
      setIsSubmitting(true);
      // Here you would typically make an API call to process the withdrawal
      // await processWithdrawal({
      //   method: withdrawalMethod,
      //   amount: parseFloat(withdrawalAmount),
      //   address: withdrawalAddress,
      // });
      // onOpenChange(false);
    } catch (error) {
      console.error('Error processing withdrawal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMaxLengthForMethod = (method: string): number | undefined => {
    const methodLengths: Record<string, number> = {
      yape: 9,
      plin: 9,
      bank: 20,
    };
    return methodLengths[method] || undefined;
  };

  const submitButtonDisabled = !isFormValid || isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[100vw] sm:max-w-3xl bg-gradient-to-br from-white to-gray-50 border-0 shadow-xl p-4 sm:p-6 max-h-[92vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-navy-900">
            Retirar Fondos
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Retira tus ganancias disponibles
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 overflow-y-auto pr-1 custom-scrollbar">
          <Alert className="bg-green-50 border-green-200 mb-4 sm:mb-6">
            <AlertDescription className="text-green-800 text-sm">
              Saldo disponible para retiro:{" "}
              <strong className="font-semibold">
                {formatCurrency(availableBalance)}
              </strong>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-6 lg:gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <WithdrawalMethodSelector
                methods={withdrawalMethods}
                selectedMethod={withdrawalMethod}
                onSelect={handleMethodSelect}
                methodColors={methodColors}
                addAlpha={addAlpha}
              />

              {withdrawalMethod && (
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">
                    {getWithdrawalLabel(withdrawalMethod)}
                  </Label>
                  <Input
                    placeholder={getWithdrawalPlaceholder(withdrawalMethod)}
                    value={withdrawalAddress}
                    onChange={handleAddressChange}
                    onBlur={() => {
                      setAddressError(validateWithdrawalAddress(withdrawalMethod, withdrawalAddress));
                    }}
                    inputMode={withdrawalMethod === "crypto" ? undefined : "numeric"}
                    pattern={withdrawalMethod === "crypto" ? undefined : "\\d*"}
                    maxLength={getMaxLengthForMethod(withdrawalMethod)}
                    className={`min-h-[40px] ${withdrawalAddress && addressError
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-gray-300"
                      }`}
                  />
                  <p className={`text-xs ${withdrawalAddress && addressError ? "text-red-600" : "text-gray-500"}`}>
                    {withdrawalAddress && addressError
                      ? addressError
                      : getWithdrawalDescription(withdrawalMethod)}
                  </p>
                </div>
              )}

              {withdrawalMethod && (
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">
                    Ingresa el monto a retirar
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      S/.
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={withdrawalAmount}
                      onChange={handleAmountChange}
                      onBlur={() => {
                        if (withdrawalAmount) {
                          setWithdrawalAmount(parseFloat(withdrawalAmount).toFixed(2));
                        }
                      }}
                      className={`w-full pl-8 pr-4 py-2 h-12 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${amountError && withdrawalAmount
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300"
                        }`}
                    />
                  </div>
                  {amountError && withdrawalAmount && (
                    <p className="mt-1 text-xs text-red-600">{amountError}</p>
                  )}
                  {withdrawalMethod && selectedMethodConfig && (
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">Mínimo:</span> S/.{selectedMethodConfig.min.toFixed(2)}
                      <span className="mx-2">•</span>
                      <span className="font-medium">Máximo:</span> S/.{selectedMethodConfig.max.toFixed(2)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 lg:sticky lg:top-2">
                <h3 className="font-medium text-gray-900 mb-3">
                  Resumen del retiro
                </h3>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Monto a retirar
                    </span>
                    <span className="font-medium">
                      {withdrawalAmount
                        ? `S/.${parseFloat(withdrawalAmount).toFixed(2)}`
                        : "S/. 0.00"}
                    </span>
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
                      {withdrawalAmount
                        ? formatCurrency(availableBalance - parseFloat(withdrawalAmount))
                        : formatCurrency(availableBalance)}
                    </span>
                  </div>

                  <Button
                    className={`w-full mt-4 py-4 font-medium shadow-md transition-all duration-200 text-base ${submitButtonDisabled
                        ? "bg-gray-300 cursor-not-allowed text-gray-500"
                        : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white hover:shadow-lg hover:shadow-green-100"
                      }`}
                    disabled={submitButtonDisabled}
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="https://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Procesando...
                      </span>
                    ) : 'Solicitar Retiro'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="w-full mt-3 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-navy-400 py-4 font-medium transition-colors text-base"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
