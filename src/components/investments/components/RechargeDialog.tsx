import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { PaymentMethod } from "@/types/transaction.types";

interface RechargeDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly amount: number;
  readonly onSubmit: (paymentMethod: PaymentMethod) => Promise<void>;
  readonly isLoading: boolean;
}

export function RechargeDialog({ open, onOpenChange, amount, onSubmit, isLoading }: RechargeDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('yape');

  const paymentMethods = [
    { value: 'yape', label: 'Yape' },
    { value: 'plin', label: 'Plin' },
    { value: 'tunki', label: 'Tunki' },
    { value: 'bcp', label: 'BCP' },
    { value: 'interbank', label: 'Interbank' },
    { value: 'bbva', label: 'BBVA' },
  ];

  const handleSubmit = async () => {
    await onSubmit(paymentMethod);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirmar recarga</DialogTitle>
          <DialogDescription>
            Estás a punto de solicitar una recarga de S/ {amount.toFixed(2)}. Por favor selecciona el método de pago.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Método de pago</Label>
            <Select 
              value={paymentMethod} 
              onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un método de pago" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Una vez que envíes la solicitud, tendrás 30 minutos para realizar el pago. 
                  De lo contrario, la solicitud será cancelada automáticamente.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : 'Confirmar recarga'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
