import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { withdrawalService, type Withdrawal, type UpdateWithdrawalStatusData } from '@/services/withdrawalService';

// Extended type for the component props
interface WithdrawalWithUser extends Omit<Withdrawal, 'user'> {
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  } | string | null;
  reference_code?: string;
}

interface UpdateWithdrawalStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  withdrawal: WithdrawalWithUser;
  onSuccess: (updatedWithdrawal: Withdrawal) => void;
}

export function UpdateWithdrawalStatusDialog({ 
  open, 
  onOpenChange, 
  withdrawal, 
  onSuccess 
}: Readonly<UpdateWithdrawalStatusDialogProps>) {
  const [status, setStatus] = useState<UpdateWithdrawalStatusData['status']>('approved');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const getUserDisplayName = (user: WithdrawalWithUser['user']) => {
    if (typeof user === 'object' && user) {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      return fullName || 'Usuario sin nombre';
    }
    if (typeof user === 'string') {
      return user;
    }
    return 'Usuario no disponible';
  };

  const handleSubmit = async () => {
    if (status === 'rejected' && !rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa una razón para el rechazo',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const data: UpdateWithdrawalStatusData = { status };
      
      if (status === 'rejected') {
        data.rejection_reason = rejectionReason;
      }

      const updatedWithdrawal = await withdrawalService.updateWithdrawalStatus(withdrawal.id.toString(), data);
      onSuccess(updatedWithdrawal);
      
      // Reset form
      setStatus('approved');
      setRejectionReason('');
    } catch (error: any) {
      console.error('Error updating withdrawal status:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el estado del retiro',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Actualizar Estado de Retiro</DialogTitle>
          <DialogDescription>
            Actualiza el estado de la solicitud de retiro del usuario.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">Nuevo Estado</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as 'approved' | 'rejected')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Aprobar</SelectItem>
                <SelectItem value="rejected">Rechazar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {status === 'rejected' && (
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Razón del Rechazo</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ingresa la razón del rechazo..."
                rows={3}
              />
            </div>
          )}
          
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-md">
            <h4 className="font-medium mb-2">Detalles del Retiro</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-slate-500 dark:text-slate-400">Usuario:</div>
              <div>
                {getUserDisplayName(withdrawal.user)}
              </div>
              
              <div className="text-slate-500 dark:text-slate-400">Monto:</div>
              <div>S/ {withdrawal.amount.toFixed(2)}</div>
              
              <div className="text-slate-500 dark:text-slate-400">Método:</div>
              <div className="capitalize">{withdrawal.method}</div>
              
              {withdrawal.reference_code ? (
                <>
                  <div className="text-slate-500 dark:text-slate-400">Referencia:</div>
                  <div>{withdrawal.reference_code}</div>
                </>
              ) : null}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              'Actualizar Estado'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
