import { useState, useEffect } from 'react';
import { adminWithdrawalService, type AdminWithdrawal } from '@/services/adminWithdrawalService';
import { WithdrawalList, type Withdrawal } from './WithdrawalList';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export const AdminWithdrawalsPage = () => {
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadWithdrawals = async () => {
    try {
      setIsLoading(true);
      const data = await adminWithdrawalService.getAllWithdrawals();
      setWithdrawals(data);
    } catch (error) {
      console.error('Error loading withdrawals:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las solicitudes de retiro',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await adminWithdrawalService.updateWithdrawalStatus(id, 'approved');
      await loadWithdrawals();
      toast({
        title: 'Éxito',
        description: 'La solicitud de retiro ha sido aprobada',
      });
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      toast({
        title: 'Error',
        description: 'No se pudo aprobar la solicitud de retiro',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await adminWithdrawalService.updateWithdrawalStatus(id, 'rejected', 'Solicitud rechazada por el administrador');
      await loadWithdrawals();
      toast({
        title: 'Éxito',
        description: 'La solicitud de retiro ha sido rechazada',
      });
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      toast({
        title: 'Error',
        description: 'No se pudo rechazar la solicitud de retiro',
        variant: 'destructive',
      });
    }
  };

  // Transform data to match the WithdrawalList component's expected format
  const formattedWithdrawals: Withdrawal[] = withdrawals.map(withdrawal => {
    console.log('Processing withdrawal:', withdrawal); // Debug log
    return {
      id: withdrawal.id,
      user: withdrawal.user 
        ? `${withdrawal.user.first_name || ''} ${withdrawal.user.last_name || ''}`.trim() 
        : 'Usuario',
      amount: withdrawal.amount,
      method: withdrawal.method,
      status: withdrawal.status,
      reference_code: withdrawal.reference_code,
      created_at: withdrawal.created_at,
      updated_at: withdrawal.updated_at
    };
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Solicitudes de Retiro</h2>
        <Button
          variant="outline"
          onClick={loadWithdrawals}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <WithdrawalList
          withdrawals={formattedWithdrawals}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};
