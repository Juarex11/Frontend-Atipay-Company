import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import Stepper, { Step } from "@/components/ui/stepper";
import { toast } from "sonner";
import { createRecharge } from "@/services/atipayRechargeService";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/utils/transactionUtils";
import type { UserPaymentMethod } from "@/services/userPaymentMethodService";
import { getUserPaymentMethods } from "@/services/userPaymentMethodService";
import { Loader2, CreditCard } from "lucide-react";
import { FieldCopy } from "./FieldCopy";

interface SelectedMethod {
  id: number;
  user_id: number;
  payment_method_id: number;
  data: Record<string, string>;
  method: {
    id: number;
    name: string;
    fields: string[];
  };
  display_name: string;
  instructions_title: string;
  instructions_note: string;
}

interface DepositStepperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  onDepositSuccess?: (recharge?: unknown) => void;
}

// Payment method configuration
const methodColors: Record<string, string> = {
  // Default color for unknown methods
  default: "#3B82F6",
  // Common payment method colors
  yape: "#8A2BE2",
  plin: "#FF6B00",
  bcp: "#E31937",
  bbva: "#0D2D62",
  interbank: "#FFD100",
  scotiabank: "#ED1C24",
  'banco de la nacion': "#00843D",
  'banco pichincha': "#FFD700",
  'banbif': "#00A0E3",
  'banco falabella': "#E31937",
  'banco rio': "#00A0E3",
  'banco santander': "#ED1C24",
  'banco gyt': "#00A651"
};

interface InstructionData {
  title: string;
  fields: { label: string; value: string; hint?: string }[];
  note?: string;
}


function buildInstructions(method: SelectedMethod | null, amount: number): InstructionData {
  if (!method) return { title: "Selecciona método", fields: [] };
  
  const fields = [];
  
  // Add payment method fields from method data
  if (method.data && Object.keys(method.data).length > 0) {
    // Process each field in the data object
    Object.entries(method.data).forEach(([key, value]) => {
      if (value) {
        fields.push({
          label: key,
          value: String(value)
        });
      }
    });
  }
  
  // Add amount field
  fields.push({
    label: "Monto exacto",
    value: `S/. ${parseFloat(amount.toString()).toFixed(2)}`,
    highlight: true
  });
  
  return {
    title: method.instructions_title || `Instrucciones de ${method.method?.name || 'pago'}`,
    fields,
    note: method.instructions_note || 'Por favor, realiza el pago exacto y sube el comprobante.'
  };
}

export const DepositStepper = ({
  open,
  onOpenChange,
  availableBalance,
  onDepositSuccess,
}: DepositStepperProps) => {
  const [amount, setAmount] = useState("");
  const { user } = useAuth();
  const [userPaymentMethods, setUserPaymentMethods] = useState<UserPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Try to pre-fill with known fields without breaking type safety
  const initialFullName = (
    (user as { full_name?: string; name?: string; email?: string })?.full_name ||
    (user as { name?: string; email?: string })?.name ||
    (user as { email?: string })?.email?.split("@")[0] ||
    ""
  );
  
  const [fullNames, setFullNames] = useState(initialFullName);
  const [selectedMethod, setSelectedMethod] = useState<SelectedMethod | null>(null);
  const [instructions, setInstructions] = useState<InstructionData | null>(null);
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle method selection
  const handleMethodChange = useCallback((value: string) => {
    const selectedUserMethod = userPaymentMethods.find(um => um.id?.toString() === value);
    
    if (selectedUserMethod?.method) {
      setSelectedMethod({
        id: selectedUserMethod.id || 0,
        user_id: selectedUserMethod.user_id || 0,
        payment_method_id: selectedUserMethod.payment_method_id || 0,
        data: selectedUserMethod.data || {},
        method: {
          id: selectedUserMethod.method.id || 0,
          name: selectedUserMethod.method.name || 'Método de pago',
          fields: selectedUserMethod.method.fields || []
        },
        display_name: selectedUserMethod.method.name || 'Método de pago',
        instructions_title: `Instrucciones de ${selectedUserMethod.method.name || 'pago'}`,
        instructions_note: 'Por favor, realiza el pago exacto y sube el comprobante.'
      });
    } else {
      setSelectedMethod(null);
    }
  }, [userPaymentMethods]);

  // Load user payment methods
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setIsLoading(true);
        const userMethods = await getUserPaymentMethods();
        
        if (isMounted) {
          setUserPaymentMethods(userMethods);
        }
      } catch (error) {
        console.error('Error loading payment data:', error);
        toast.error('Error al cargar la información de pagos');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (open) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [open]);

  // Regenerate instructions when method or amount changes
  useEffect(() => {
    if (selectedMethod && amount && parseFloat(amount) > 0) {
      setInstructions(buildInstructions(selectedMethod, parseFloat(amount)));
    } else {
      setInstructions(null);
    }
  }, [selectedMethod, amount]);

  const resetAll = useCallback(() => {
    setAmount("");
    setSelectedMethod(null);
    setInstructions(null);
    setProofImage(null);
    setIsSubmitting(false);
  }, []);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen && isSubmitting) return;
    onOpenChange(isOpen);
    if (!isOpen) resetAll();
  };

  const disabledAmount = !amount || parseFloat(amount) <= 0;
  const invalidFullNames = !fullNames || fullNames.trim().length < 5;
  const disabledMethod = !selectedMethod || disabledAmount || invalidFullNames;
  const disabledUpload = disabledMethod || !instructions;
  const canSubmit =
    !disabledUpload && !!proofImage && !isSubmitting && !invalidFullNames;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    
    try {
      setIsSubmitting(true);
      
      if (!selectedMethod) {
        throw new Error('No se ha seleccionado un método de pago');
      }
      
      if (!fullNames || fullNames.trim().length < 5) {
        throw new Error('Por favor ingresa tu nombre completo (mínimo 5 caracteres)');
      }
      
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error('Por favor ingresa un monto válido mayor a 0');
      }
      
      if (!proofImage) {
        throw new Error('Por favor selecciona una imagen de comprobante');
      }
      
      if (!(proofImage instanceof File)) {
        throw new Error('El archivo de comprobante no es válido');
      }
      
      const rechargeData = {
        full_names: fullNames.trim(),
        amount: amountValue,
        user_payment_method_id: selectedMethod.id.toString(),
        proof_image: proofImage
      };
      
      console.log('Enviando datos de recarga:', {
        ...rechargeData,
        proof_image: proofImage.name,
        proof_image_type: proofImage.type,
        proof_image_size: proofImage.size
      });
      
      const response = await createRecharge(rechargeData);
      
      // Si llegamos aquí, la respuesta fue exitosa
      toast.success('Solicitud de recarga enviada correctamente. En espera de aprobación.');
      
      // Reset form state
      resetAll();
      
      // Call the success callback if provided
      if (onDepositSuccess) {
        onDepositSuccess(response);
      }
      
      // Close the modal by calling onOpenChange with false
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating recharge:', error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('422')) {
          // Handle validation errors
          toast.error('Error de validación. Por favor verifica los datos ingresados.');
        } else {
          toast.error(error.message || 'Error al procesar la recarga');
        }
      } else {
        toast.error('Error desconocido al procesar la recarga');
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleCopy = async (value: string, setCopied: (value: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl border-0 shadow-xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-2xl font-bold">
            Depósito Paso a Paso
          </DialogTitle>
          <DialogDescription>
            Ingresa el monto, selecciona el método y sube tu comprobante.
          </DialogDescription>
        </DialogHeader>
        <div className="px-2 pb-4">
          <Stepper
            variant="modal"
            initialStep={1}
            onFinalStepCompleted={() => {}}
            containerClassName=""
            stepCircleContainerClassName="bg-transparent"
            frameClassName=""
            stepContainerClassName="justify-center"
            contentClassName=""
            footerClassName=""
            backButtonText="Atrás"
            nextButtonText="Siguiente"
            finalButtonText={
              isSubmitting ? "Enviando..." : "Confirmar y Enviar"
            }
            onFinalAction={handleSubmit}
            disableStepIndicators={false}
          >
            {/* Step 1: Datos básicos */}
            <Step>
              <div className="space-y-5 py-2">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                  Saldo actual:{" "}
                  <strong>{formatCurrency(availableBalance)}</strong>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Nombre completo</Label>
                  <Input
                    placeholder="Ej: Juan Pérez García"
                    value={fullNames}
                    onChange={(e) => setFullNames(e.target.value)}
                    maxLength={120}
                  />
                  {invalidFullNames && (
                    <p className="text-xs text-red-500">
                      Ingresa tu nombre completo (mínimo 5 caracteres).
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Monto a depositar</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      S/.
                    </span>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-10 h-12 text-lg"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2 mt-1">
                    {[100, 500, 1000, 5000].map((v) => {
                      const isSelected = amount === v.toString();
                      return (
                        <Button
                          key={v}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className={`flex-1 transition-colors ${isSelected ? 'bg-green-600 hover:bg-green-700' : ''}`}
                          onClick={() => setAmount(v.toString())}
                        >
                          S/. {v}
                        </Button>
                      );
                    })}
                  </div>
                  {disabledAmount && (
                    <p className="text-xs text-red-500">
                      Ingresa un monto válido mayor a 0.
                    </p>
                  )}
                </div>
                {/* El avance real lo maneja el botón Next del Stepper */}
              </div>
            </Step>
            {/* Step 2: Método */}
            <Step>
              <div className="space-y-6 py-2">
                <div className="space-y-2">
                  <Label className="font-medium">Método de depósito</Label>
                  <Select 
                  value={selectedMethod?.id?.toString() || ""}
                  onValueChange={handleMethodChange}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={
                      isLoading ? "Cargando métodos..." : "Selecciona un método de pago"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Cargando...
                      </div>
                    ) : userPaymentMethods.length > 0 ? (
                      userPaymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id?.toString() || ""}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
                              style={{
                                backgroundColor: methodColors[method.method.name.toLowerCase()] || methodColors.default,
                              }}
                            >
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium truncate">{method.method.name}</div>
                              <div className="text-xs text-gray-500 truncate">
                                {Object.entries(method.data).map(([key, value]) => (
                                  <span key={key} className="mr-2">
                                    {key}: {value}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500">
                        No hay métodos de pago disponibles. Por favor, agrega un método de pago primero.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                </div>
                {disabledMethod && (
                  <p className="text-xs text-red-500">
                    Selecciona un método (revisa también el monto).
                  </p>
                )}
                <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-xs text-yellow-800">
                  Asegúrate que el monto ingresado coincida exactamente con el
                  comprobante que subirás.
                </div>
              </div>
            </Step>
            {/* Step 3: Instrucciones */}
            <Step>
              <div className="space-y-4 py-2">
                {instructions ? (
                  <>
                    <h3 className="font-semibold text-lg">
                      {instructions.title}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {instructions.fields.map((f) => (
                        <FieldCopy
                          key={f.label}
                          label={f.label}
                          value={f.value}
                          hint={f.hint}
                          onCopy={handleCopy}
                        />
                      ))}
                    </div>
                    {instructions.note && (
                      <p className="text-xs text-gray-600 bg-gray-50 border rounded p-2">
                        {instructions.note}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">
                    Selecciona método y monto válidos para ver instrucciones.
                  </p>
                )}
                {(!instructions || disabledMethod) && (
                  <p className="text-xs text-red-500">
                    Faltan datos para mostrar instrucciones.
                  </p>
                )}
              </div>
            </Step>
            {/* Step 4: Comprobante y confirmación */}
            <Step>
              <div className="space-y-5 py-2">
                <div className="space-y-1">
                  <Label>Comprobante de pago</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (!f.type.startsWith("image/")) {
                        toast.error("Archivo inválido", {
                          description: "Debe ser una imagen",
                        });
                        return;
                      }
                      if (f.size > 5 * 1024 * 1024) {
                        toast.error("Archivo muy grande", {
                          description: "Máx 5MB",
                        });
                        return;
                      }
                      setProofImage(f);
                    }}
                  />
                  <p className="text-[11px] text-gray-500">
                    Formatos permitidos: JPG, PNG (máx 5MB)
                  </p>
                  {proofImage && (
                    <p className="text-xs text-green-600">
                      {proofImage.name} listo para enviar
                    </p>
                  )}
                </div>
                <div className="border rounded-md p-3 bg-gray-50 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Monto</span>
                    <strong>
                      {amount ? `S/. ${parseFloat(amount).toFixed(2)}` : "--"}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Método</span>
                    <strong className="capitalize">
                      {selectedMethod?.method?.name || "--"}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Nombre completo</span>
                    <strong
                      className="truncate max-w-[160px]"
                      title={fullNames || "--"}
                    >
                      {fullNames || "--"}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Comisión</span>
                    <strong>Gratis</strong>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span>Total</span>
                    <strong>
                      {amount ? `S/. ${parseFloat(amount).toFixed(2)}` : "--"}
                    </strong>
                  </div>
                </div>
                <Button
                  variant="outline"
                  disabled={isSubmitting}
                  className="w-full"
                  onClick={() => handleClose(false)}
                >
                  Cancelar
                </Button>
              </div>
            </Step>
          </Stepper>
        </div>
      </DialogContent>
    </Dialog>
  );
};
