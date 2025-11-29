import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Banknote,
  Info,
  Loader2,
  AlertCircle,
  WalletMinimal,
  Wallet,
  Bitcoin,
} from "lucide-react";
import { formatCurrency } from "@/utils/transactionUtils";
import { createRecharge } from "@/services/atipayRechargeService";
import { toast } from "sonner";

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  onDepositSuccess?: () => void;
}

export const DepositDialog = ({
  open,
  onOpenChange,
  availableBalance,
  onDepositSuccess,
}: DepositDialogProps) => {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("");

  type PaymentMethod = "" | "yape" | "plin" | "transfer" | "other";

  const [proofImage, setProofImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const methodColors: Record<string, string> = {
    yape: "#8628A5",
    plin: "#2AACE9",
    transfer: "#0DC055",
    other: "#F1BB14",
  };

  const getButtonContent = () => {
    if (isSubmitting) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Procesando...
        </>
      );
    }
    return amount && parseFloat(amount) > 0
      ? "Continuar con el depósito"
      : "Ingresa un monto";
  };
  const handleSubmit = async () => {
    // Validaciones iniciales
    if (!amount || parseFloat(amount) <= 0) {
      setError("Por favor ingresa un monto válido");
      return;
    }

    if (!method) {
      setError("Por favor selecciona un método de pago");
      return;
    }

    if (!proofImage) {
      setError("Por favor sube el comprobante de pago");
      return;
    }

    // Validar que el archivo sea una imagen
    if (!proofImage.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen (JPEG, PNG, etc.)");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Get user's full name from localStorage or use a default
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const fullNames = userData.fullName || 'Usuario';
      
      // Get the selected payment method ID - this should be set when the user selects a payment method
      const paymentMethodId = ''; // TODO: Get the actual payment method ID from your form state
      
      if (!paymentMethodId) {
        throw new Error('Por favor selecciona un método de pago');
      }

      await createRecharge({
        amount: parseFloat(amount),
        user_payment_method_id: paymentMethodId,
        full_names: fullNames,
        proof_image: proofImage,
      });

      toast.success("Solicitud de depósito enviada", {
        description:
          "Tu depósito está siendo procesado. Te notificaremos cuando sea aprobado.",
      });

      // Cerrar el diálogo y limpiar el formulario
      onOpenChange(false);
      setAmount("");
      setMethod("");
      setProofImage(null);

      // Notificar que la recarga fue exitosa
      if (onDepositSuccess) {
        onDepositSuccess();
      }
    } catch (error) {
      console.error("Error al procesar el depósito:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Error al procesar el depósito. Por favor, inténtalo de nuevo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && isSubmitting) return; // Evitar cerrar mientras se envía
    onOpenChange(isOpen);
    if (!isOpen) {
      // Resetear el formulario al cerrar
      setAmount("");
      setMethod("");
      setProofImage(null);
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-gradient-to-br from-white to-gray-50 border-0 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-navy-900">
            Realizar Depósito
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Agrega fondos a tu cuenta de inversión
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
          {/* Columna izquierda: Formulario */}
          <div className="space-y-6">
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                Saldo actual:{" "}
                <strong className="font-semibold">
                  {formatCurrency(availableBalance)}
                </strong>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">
                  Método de depósito
                </Label>
                <Select
                  value={method}
                  onValueChange={(value: PaymentMethod) => setMethod(value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="bg-white border-gray-300 hover:border-navy-400 focus:ring-2 focus:ring-navy-500 focus:ring-opacity-50 h-12">
                    <SelectValue
                      placeholder="Selecciona método"
                      className="text-gray-700"
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem
                      value="yape"
                      className="hover:bg-gray-50 text-gray-800"
                    >
                      <div className="flex items-center gap-2">
                        <WalletMinimal
                          className="w-4 h-4"
                          style={{ color: methodColors.yape }}
                        />
                        <span>Yape</span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="plin"
                      className="hover:bg-gray-50 text-gray-800"
                    >
                      <div className="flex items-center gap-2">
                        <Wallet
                          className="w-4 h-4"
                          style={{ color: methodColors.plin }}
                        />
                        <span>Plin</span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="transfer"
                      className="hover:bg-gray-50 text-gray-800"
                    >
                      <div className="flex items-center gap-2">
                        <Banknote
                          className="w-4 h-4"
                          style={{ color: methodColors.transfer }}
                        />
                        <span>Transferencia Bancaria</span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="other"
                      className="hover:bg-gray-50 text-gray-800"
                    >
                      <div className="flex items-center gap-2">
                        <Bitcoin
                          className="w-4 h-4"
                          style={{ color: methodColors.other }}
                        />
                        <span>Transferencia Electrónica</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">
                  Monto a depositar
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    S/.
                  </span>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8 text-lg py-5 bg-white border-gray-300 focus:border-navy-500 focus:ring-2 focus:ring-navy-500 focus:ring-opacity-50 h-14"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[100, 500, 1000, 5000].map((fixedAmount) => (
                    <Button
                      key={fixedAmount}
                      type="button"
                      variant="outline"
                      className="flex-1 py-2 text-sm font-medium border-gray-300 hover:bg-navy-50 hover:border-navy-400 text-navy-700"
                      onClick={() => setAmount(fixedAmount.toString())}
                      disabled={isSubmitting}
                    >
                      S/. {fixedAmount}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">
                  Comprobante de pago <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validar que sea una imagen
                      if (!file.type.startsWith("image/")) {
                        setError(
                          "Por favor, sube un archivo de imagen válido (JPEG, PNG, etc.)"
                        );
                        e.target.value = "";
                        return;
                      }
                      setProofImage(file);
                      setError(null);
                    }
                  }}
                  className="border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-navy-50 file:text-navy-700 hover:file:bg-navy-100"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Sube una imagen del comprobante de pago (JPEG, PNG, etc.)
                </p>
                {proofImage && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{proofImage.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha: Resumen */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4 text-lg">
              Resumen del depósito
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Monto a depositar:</span>
                <span className="font-medium">
                  {amount ? `S/. ${parseFloat(amount).toFixed(2)}` : "S/.0.00"}
                </span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Comisión:</span>
                <span>Gratis</span>
              </div>
              <div className="border-t border-gray-200 my-3"></div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Total a recibir:</span>
                <span className="text-navy-700">
                  {amount ? `S/. ${parseFloat(amount).toFixed(2)}` : "S/. 0.00"}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-yellow-700 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-700">
                    Los fondos estarán disponibles en tu cuenta en 1-2 días
                    hábiles.
                  </p>
                </div>
              </div>

              {error && (
                <Alert
                  variant="destructive"
                  className="border-red-200 bg-red-50"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="button"
                className="w-full py-5 text-base font-medium bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70 text-gray-100"
                disabled={
                  !amount ||
                  parseFloat(amount) <= 0 ||
                  !method ||
                  !proofImage ||
                  isSubmitting
                }
                onClick={handleSubmit}
              >
                {getButtonContent()}
              </Button>

              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full py-5 text-base font-medium border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
