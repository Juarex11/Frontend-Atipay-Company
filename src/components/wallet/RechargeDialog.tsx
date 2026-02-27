import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, Copy, CheckCircle2, Building2, AlertCircle, ArrowRight, Wallet, ShieldCheck, Smartphone } from "lucide-react";
import { createRecharge } from "@/services/atipayRechargeService";
import { DepositService } from "@/services/depositService";
import { useToast } from "@/components/ui/use-toast";

interface RechargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRechargeSuccess?: () => void;
}

const METHOD_STYLES: Record<string, { color: string; label: string; icon: any }> = {
  "1": { color: "bg-purple-700", label: "Yape Oficial", icon: Smartphone },
  "3": { color: "bg-orange-500", label: "Plin Oficial", icon: Smartphone },
  "4": { color: "bg-slate-900", label: "Cuenta Recaudadora", icon: Building2 },
};

const STATIC_INFO: Record<string, string> = {
  "1": "Número: 906289965\nTitular: Milenco Carhuamaca Quispe",
  "3": "Número: 906289965\nTitular: Milenco Carhuamaca Quispe",
};

export function RechargeDialog({
  open,
  onOpenChange,
  onRechargeSuccess,
}: Readonly<RechargeDialogProps>) {
  const [amount, setAmount] = useState<string>("");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [proofImage, setProofImage] = useState<File | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [displayInfo, setDisplayInfo] = useState<string | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [copied, setCopied] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (["1", "3", "4"].includes(paymentMethodId)) {
      if (STATIC_INFO[paymentMethodId]) {
        setDisplayInfo(STATIC_INFO[paymentMethodId]);
        setLoadingInfo(false);
      } 
      else if (paymentMethodId === "4") {
        const fetchBank = async () => {
          setLoadingInfo(true);
          try {
            const res = await DepositService.getBankInfo();
            if (res.success && res.data) {
              setDisplayInfo(res.data);
            } else {
              setDisplayInfo("La cuenta bancaria no está configurada. Contacte a soporte.");
            }
          } catch (e) {
            console.error(e);
            setDisplayInfo("Error de conexión.");
          } finally {
            setLoadingInfo(false);
          }
        };
        fetchBank();
      }
    } else {
      setDisplayInfo(null);
    }
  }, [paymentMethodId]);

  const resetForm = () => {
    setAmount("");
    setPaymentMethodId("");
    setProofImage(null);
    setError(null);
    setDisplayInfo(null);
  };

  const handleCopy = () => {
    if (displayInfo) {
      navigator.clipboard.writeText(displayInfo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        setError("Por favor sube una imagen (JPG, PNG, WEBP) o un PDF");
        return;
      }
      // CAMBIO: Límite aumentado a 10MB para coincidir con el backend
      if (file.size > 10 * 1024 * 1024) {
        setError("El archivo es demasiado grande (Máx 10MB)");
        return;
      }
      setProofImage(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !proofImage || !paymentMethodId) {
      setError("Completa todos los campos");
      return;
    }

    setIsLoading(true);
    try {
      await createRecharge({
        amount: parseFloat(amount),
        user_payment_method_id: paymentMethodId,
        full_names: "Usuario", 
        proof_image: proofImage,
      });

      toast({ title: "Solicitud enviada", description: "Tu recarga será validada pronto." });
      resetForm();
      onOpenChange(false);
      onRechargeSuccess?.();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String(err.message) : "Error al procesar.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const currentStyle = METHOD_STYLES[paymentMethodId] || { color: "bg-slate-900", label: "Información", icon: Wallet };
  const HeaderIcon = currentStyle.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Recargar Saldo</DialogTitle>
          <DialogDescription>Ingresa el monto y sube tu voucher.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label htmlFor="amount">Monto (S/.)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">S/</span>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-9 text-lg font-medium"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Método de pago</Label>
            <Select value={paymentMethodId} onValueChange={setPaymentMethodId} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Yape</SelectItem>
                <SelectItem value="3">Plin</SelectItem>
                <SelectItem value="4">Transferencia bancaria</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {["1", "3", "4"].includes(paymentMethodId) && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              {loadingInfo ? (
                <div className="h-32 bg-slate-50 animate-pulse rounded-xl border border-slate-200 flex items-center justify-center text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Obteniendo datos...
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className={`${currentStyle.color} px-4 py-3 flex items-center justify-between transition-colors duration-300`}>
                    <div className="flex items-center gap-2 text-white">
                      <div className="p-1.5 bg-white/20 rounded shadow-lg backdrop-blur-sm">
                        <HeaderIcon size={16} className="text-white"/>
                      </div>
                      <span className="text-sm font-semibold tracking-wide text-white/90">{currentStyle.label}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                      <ShieldCheck size={10}/> <span>Verificado</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-b from-white to-slate-50/50">
                    <div className="relative mb-3 group">
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-mono text-xs leading-relaxed whitespace-pre-wrap shadow-inner min-h-[60px]">
                        {displayInfo}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="absolute top-2 right-2 p-1.5 bg-white rounded border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-400 shadow-sm transition-all"
                        title="Copiar texto"
                      >
                        {copied ? <CheckCircle2 size={14} className="text-green-600"/> : <Copy size={14}/>}
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-100 mt-2">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate('/transactions')} 
                          className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 text-xs font-medium border border-dashed border-blue-200"
                        >
                          <Wallet size={12} className="mr-2"/>
                          Ver Historial de Transacciones
                          <ArrowRight size={12} className="ml-1 opacity-50"/>
                        </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="proof">Comprobante</Label>
            <Label
              htmlFor="proof"
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-all ${
                proofImage ? "border-green-500 bg-green-50" : "border-slate-300 hover:border-blue-500 hover:bg-blue-50"
              }`}
            >
              {proofImage ? <CheckCircle2 className="mb-2 h-8 w-8 text-green-500"/> : <Upload className="mb-2 h-8 w-8 text-slate-400"/>}
              <span className="text-sm font-medium text-slate-700">{proofImage ? proofImage.name : "Clic para subir imagen"}</span>
              {/* CAMBIO: Texto visual actualizado a 10MB */}
              <span className="text-xs text-slate-400 mt-1">{proofImage ? "Listo para enviar" : "JPG, PNG (Máx. 10MB)"}</span>
              <Input id="proof" type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isLoading} />
            </Label>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200 flex items-center gap-2">
              <AlertCircle size={16}/> {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" disabled={isLoading || !amount || !proofImage || !paymentMethodId} className="bg-green-600 hover:bg-green-700 text-white">
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Procesando...</> : "Solicitar recarga"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 