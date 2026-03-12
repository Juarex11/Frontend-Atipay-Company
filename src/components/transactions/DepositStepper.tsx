/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { Loader2, CreditCard, Smartphone, Building2 } from "lucide-react";
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

const methodColors: Record<string, string> = {
  default: "#3B82F6",
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

// Métodos internos que NO deben aparecer en el selector de depósito
const EXCLUDED_METHOD_NAMES = ['bonificacion', 'bonificación', 'bonus', 'premio', 'reward'];

interface InstructionData {
  title: string;
  fields: { label: string; value: string; hint?: string }[];
  note?: string;
}

function buildInstructions(method: SelectedMethod | null, amount: number): InstructionData {
  if (!method) return { title: "Selecciona método", fields: [] };

  const fields: { label: string; value: string; hint?: string }[] = [];

  if (method.data && Object.keys(method.data).length > 0) {
    Object.entries(method.data).forEach(([key, value]) => {
      if (value) {
        fields.push({ label: key, value: String(value) });
      }
    });
  }

  fields.push({
    label: "Monto exacto",
    value: `S/. ${parseFloat(amount.toString()).toFixed(2)}`,
  });

  return {
    title: method.instructions_title || `Instrucciones de ${method.method?.name || 'pago'}`,
    fields,
    note: method.instructions_note || 'Por favor, realiza el pago exacto y sube el comprobante.'
  };
}

// Icono simple según nombre del método
function MethodIcon({ name, size = 16 }: { name: string; size?: number }) {
  const lower = name.toLowerCase();
  if (lower.includes('yape') || lower.includes('plin')) return <Smartphone size={size} />;
  if (lower.includes('bcp') || lower.includes('transferencia') || lower.includes('banco')) return <Building2 size={size} />;
  return <CreditCard size={size} />;
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

  const handleMethodChange = useCallback((value: string) => {
    const officialData: Record<string, SelectedMethod> = {
      "official_1": {
        id: -1,
        user_id: 0,
        payment_method_id: 1,
        display_name: "Yape Oficial",
        data: { "Numero": "906289965", "Titular": "Milenco Carhuamaca Quispe" },
        method: { id: 1, name: "Yape", fields: ["Numero", "Titular"] },
        instructions_title: "Instrucciones de Yape Oficial",
        instructions_note: "Escanea el QR o yapea al numero indicado."
      },
      "official_3": {
        id: -3,
        user_id: 0,
        payment_method_id: 3,
        display_name: "Plin Oficial",
        data: { "Numero": "906289965", "Titular": "Milenco Carhuamaca Quispe" },
        method: { id: 3, name: "Plin", fields: ["Numero", "Titular"] },
        instructions_title: "Instrucciones de Plin Oficial",
        instructions_note: "Realiza el plin al numero indicado."
      },
      "official_4": {
        id: -4,
        user_id: 0,
        payment_method_id: 4,
        display_name: "Cuenta Recaudadora (BCP)",
        data: { "Banco": "BCP EMPRESARIAL", "Cuenta": "999-888888-0-11" },
        method: { id: 4, name: "Transferencia", fields: ["Banco", "Cuenta"] },
        instructions_title: "Instrucciones de BCP Oficial",
        instructions_note: "Realiza la transferencia y adjunta el comprobante."
      }
    };

    if (officialData[value]) {
      setSelectedMethod(officialData[value]);
      return;
    }

    const selectedUserMethod = userPaymentMethods.find(um => `user_${um.id}` === value);
    if (selectedUserMethod?.method) {
      setSelectedMethod({
        id: selectedUserMethod.id || 0,
        user_id: selectedUserMethod.user_id || 0,
        payment_method_id: selectedUserMethod.payment_method_id || 0,
        data: selectedUserMethod.data as Record<string, string> || {},
        method: {
          id: selectedUserMethod.method.id || 0,
          name: selectedUserMethod.method.name || 'Metodo de pago',
          fields: selectedUserMethod.method.fields || []
        },
        display_name: selectedUserMethod.method.name || 'Metodo de pago',
        instructions_title: `Instrucciones de ${selectedUserMethod.method.name || 'pago'}`,
        instructions_note: 'Por favor, realiza el pago exacto y sube el comprobante.'
      });
    } else {
      setSelectedMethod(null);
    }
  }, [userPaymentMethods]);

  // Valor del select basado en el método seleccionado
  const selectValue = selectedMethod
    ? selectedMethod.id < 0
      ? `official_${Math.abs(selectedMethod.id)}`
      : `user_${selectedMethod.id}`
    : "";

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setIsLoading(true);
        const userMethods = await getUserPaymentMethods();
        if (isMounted) setUserPaymentMethods(userMethods);
      } catch (error) {
        console.error('Error loading payment data:', error);
        toast.error('Error al cargar la informacion de pagos');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    if (open) loadData();
    return () => { isMounted = false; };
  }, [open]);

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
  const canSubmit = !disabledUpload && !!proofImage && !isSubmitting && !invalidFullNames;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      setIsSubmitting(true);
      const rechargeData = {
        full_names: fullNames.trim(),
        amount: parseFloat(amount),
        user_payment_method_id: selectedMethod?.id.toString() || "",
        proof_image: proofImage as File
      };

      const response = await createRecharge(rechargeData);

      toast.success('Solicitud de recarga enviada correctamente.');

      if (onDepositSuccess) {
        const optimisticTransaction = {
          id: response.id || Date.now(),
          description: "Recarga de saldo",
          amount: parseFloat(amount),
          fee: 0,
          type: 'recharge',
          status: 'pending',
          date: new Date().toISOString(),
          method: selectedMethod?.display_name,
          user_payment_method_id: selectedMethod?.id,
          payment_method_name: selectedMethod?.display_name
        };
        onDepositSuccess(optimisticTransaction);
      }

      resetAll();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al procesar la recarga');
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

  // Filtrar métodos de usuario excluyendo los internos
  const filteredUserMethods = userPaymentMethods.filter(
    m => !EXCLUDED_METHOD_NAMES.includes(m.method?.name?.toLowerCase() || '')
  );

  // Obtener color del método
  const getMethodColor = (name: string) =>
    methodColors[name.toLowerCase()] || methodColors.default;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl border-0 shadow-xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-2xl font-bold">Deposito Paso a Paso</DialogTitle>
          <DialogDescription>Ingresa el monto, selecciona el metodo y sube tu comprobante.</DialogDescription>
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
            backButtonText="Atras"
            nextButtonText="Siguiente"
            finalButtonText={isSubmitting ? "Enviando..." : "Confirmar y Enviar"}
            onFinalAction={handleSubmit}
            disableStepIndicators={false}
          >
            {/* Step 1: Datos basicos */}
            <Step>
              <div className="space-y-5 py-2 px-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                  Saldo actual: <strong>{formatCurrency(availableBalance)}</strong>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Nombre completo</Label>
                  <Input
                    placeholder="Ej: Juan Perez Garcia"
                    value={fullNames}
                    onChange={(e) => setFullNames(e.target.value)}
                    maxLength={120}
                  />
                  {invalidFullNames && (
                    <p className="text-xs text-red-500">Ingresa tu nombre completo (minimo 5 caracteres).</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Monto a depositar</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">S/.</span>
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
                    {[100, 500, 1000, 5000].map((v) => (
                      <Button
                        key={v}
                        type="button"
                        variant={amount === v.toString() ? "default" : "outline"}
                        size="sm"
                        className={`flex-1 transition-colors ${amount === v.toString() ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        onClick={() => setAmount(v.toString())}
                      >
                        S/. {v}
                      </Button>
                    ))}
                  </div>
                  {disabledAmount && (
                    <p className="text-xs text-red-500">Ingresa un monto valido mayor a 0.</p>
                  )}
                </div>
              </div>
            </Step>

            {/* Step 2: Seleccion de Metodo */}
            <Step>
              <div className="space-y-6 py-2 px-6">
                <div className="space-y-2">
                  <Label className="font-medium">Metodo de deposito</Label>
                  <Select
                    value={selectValue}
                    onValueChange={handleMethodChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder={isLoading ? "Cargando..." : "Selecciona un metodo de pago"} />
                    </SelectTrigger>
                    <SelectContent>

                      {/* METODOS OFICIALES DEL SISTEMA */}
                      {[
                        { value: "official_1", color: "#8A2BE2", label: "Yape Oficial" },
                        { value: "official_3", color: "#FF6B00", label: "Plin Oficial" },
                        { value: "official_4", color: "#1e293b", label: "Cuenta Recaudadora (BCP)" },
                      ].map(item => (
                        <SelectItem key={item.value} value={item.value}>
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-flex items-center justify-center rounded-full text-white flex-shrink-0"
                              style={{ width: 24, height: 24, backgroundColor: item.color }}
                            >
                              <Smartphone size={13} />
                            </span>
                            <span className="font-medium">{item.label}</span>
                          </span>
                        </SelectItem>
                      ))}

                      {/* METODOS DEL USUARIO (filtrados) */}
                      {filteredUserMethods.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">
                            Mis metodos
                          </div>
                          {filteredUserMethods.map((method) => {
                            const color = getMethodColor(method.method?.name || '');
                            const firstField = Object.entries(method.data || {})[0];
                            return (
                              <SelectItem key={method.id} value={`user_${method.id}`}>
                                <span className="flex items-center gap-2">
                                  <span
                                    className="inline-flex items-center justify-center rounded-full text-white flex-shrink-0"
                                    style={{ width: 24, height: 24, backgroundColor: color }}
                                  >
                                    <CreditCard size={13} />
                                  </span>
                                  <span>
                                    <span className="font-medium">{method.method?.name}</span>
                                    {firstField && (
                                      <span className="text-gray-400 text-xs ml-1">
                                        — {firstField[1]}
                                      </span>
                                    )}
                                  </span>
                                </span>
                              </SelectItem>
                            );
                          })}
                        </>
                      )}

                    </SelectContent>
                  </Select>
                </div>

                {disabledMethod && (
                  <p className="text-xs text-red-500">Selecciona un metodo valido para continuar.</p>
                )}

                <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-xs text-yellow-800">
                  Asegurate que el monto ingresado coincida exactamente con el comprobante que subiras.
                </div>
              </div>
            </Step>

            {/* Step 3: Instrucciones Dinamicas */}
            <Step>
              <div className="space-y-4 py-2 px-6">
                {instructions ? (
                  <>
                    <h3 className="font-semibold text-lg">{instructions.title}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {instructions.fields.map((f) => (
                        <FieldCopy key={f.label} label={f.label} value={f.value} hint={f.hint} onCopy={handleCopy} />
                      ))}
                    </div>
                    {instructions.note && (
                      <p className="text-xs text-gray-600 bg-gray-50 border rounded p-2">{instructions.note}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Completa los pasos anteriores para ver las instrucciones.</p>
                )}
              </div>
            </Step>

            {/* Step 4: Comprobante y Resumen */}
            <Step>
              <div className="space-y-5 py-2 px-6">
                <div className="space-y-1">
                  <Label>Comprobante de pago</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (!f.type.startsWith("image/")) { toast.error("Debe ser una imagen"); return; }
                      if (f.size > 10 * 1024 * 1024) { toast.error("Max 10MB"); return; }
                      setProofImage(f);
                    }}
                  />
                  <p className="text-[11px] text-gray-500">Formatos permitidos: JPG, PNG, WEBP (max 10MB)</p>
                  {proofImage && <p className="text-xs text-green-600">{proofImage.name} listo para enviar</p>}
                </div>

                <div className="border rounded-md p-3 bg-gray-50 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Monto</span>
                    <strong>{amount ? `S/. ${parseFloat(amount).toFixed(2)}` : "--"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Metodo</span>
                    <strong className="capitalize">{selectedMethod?.display_name || "--"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Nombre completo</span>
                    <strong className="truncate max-w-[160px]">{fullNames || "--"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Comision</span>
                    <strong>Gratis</strong>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span>Total</span>
                    <strong>{amount ? `S/. ${parseFloat(amount).toFixed(2)}` : "--"}</strong>
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