import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload } from "lucide-react";
import { createRecharge } from "@/services/atipayRechargeService";
import { useToast } from "@/components/ui/use-toast";
import { DepositBankInfo } from './DepositBankInfo';

interface RechargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRechargeSuccess?: () => void;
}

export function RechargeDialog({ open, onOpenChange, onRechargeSuccess }: Readonly<RechargeDialogProps>) {
  const [amount, setAmount] = useState<string>('');
  const [paymentMethodId, setPaymentMethodId] = useState<string>('');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const resetForm = () => {
    setAmount('');
    setPaymentMethodId('');
    setProofImage(null);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError('Por favor sube una imagen (JPEG, PNG) o un PDF');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo es demasiado grande. El tamaño máximo es 5MB');
        return;
      }
      
      setProofImage(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !proofImage || !paymentMethodId) {
      setError('Por favor completa todos los campos y selecciona un método de pago');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await createRecharge({
        amount: parseFloat(amount),
        user_payment_method_id: paymentMethodId,
        full_names: 'Usuario', // You might want to get this from user context
        proof_image: proofImage,
      });
      
      toast({
        title: 'Solicitud de recarga enviada',
        description: 'Tu solicitud de recarga ha sido enviada y está siendo revisada.',
      });
      
      resetForm();
      onOpenChange(false);
      onRechargeSuccess?.();
      
    } catch (err: unknown) {
      console.error('Error al crear la recarga:', err);
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? String(err.message)
        : 'Ocurrió un error al procesar la recarga. Por favor, inténtalo de nuevo.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Recargar Saldo</DialogTitle>
          <DialogDescription>
            Completa los siguientes campos para solicitar una recarga de saldo.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Monto a recargar (S/.)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ej: 100.00"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="method">Método de pago</Label>
            <Select
              value={paymentMethodId}
              onValueChange={setPaymentMethodId}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yape">Yape</SelectItem>
                <SelectItem value="plin">Plin</SelectItem>
                <SelectItem value="transfer">Transferencia bancaria</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* ... Bloque del Select (Método de pago) ... */}
          <div className="space-y-2">
            <Label htmlFor="method">Método de pago</Label>
            <Select
              value={paymentMethodId}
              onValueChange={setPaymentMethodId}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yape">Yape</SelectItem>
                <SelectItem value="plin">Plin</SelectItem>
                <SelectItem value="transfer">Transferencia bancaria</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ======================================================= */}
          {/* ===> PEGAR AQUÍ: Mostrar Banco solo si es Transferencia <=== */}
          {paymentMethodId === 'transfer' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
               <DepositBankInfo />
            </div>
          )}
          {/* ======================================================= */}
          
          <div className="space-y-2">
            <Label htmlFor="proof">Comprobante de pago</Label>
            <div className="flex items-center gap-2">
              <Label 
                htmlFor="proof" 
                className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 p-4 text-center hover:border-primary hover:bg-accent hover:text-accent-foreground"
              >
                <Upload className="mb-2 h-6 w-6" />
                <span className="text-sm">
                  {proofImage ? proofImage.name : 'Haz clic para subir un archivo'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {proofImage ? 'Haz clic para cambiar' : 'Formatos: JPG, PNG o PDF (máx. 5MB)'}
                </span>
                <Input
                  id="proof"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
              </Label>
            </div>
          </div>
          
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !amount || !proofImage}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : 'Solicitar recarga'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
