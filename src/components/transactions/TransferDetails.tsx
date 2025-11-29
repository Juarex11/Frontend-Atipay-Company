import { useState, useEffect } from 'react';
import { getTransferDetails } from '@/services/transferService';
import type { Transfer } from '@/services/transferService';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/transactionUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TransferDetailsProps {
  transferId: number;
}

export const TransferDetails = ({ transferId }: TransferDetailsProps) => {
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadTransferDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getTransferDetails(transferId);
        setTransfer(data);
      } catch (error) {
        console.error('Error al cargar detalles de la transferencia:', error);
        setError(error instanceof Error ? error.message : 'No se pudieron cargar los detalles de la transferencia');
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'No se pudieron cargar los detalles de la transferencia',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTransferDetails();
  }, [transferId, toast]);

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">Pendiente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300">Aprobada</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300">Rechazada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        <span className="ml-2">Cargando detalles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 border rounded-lg bg-red-50">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="text-center py-8 border rounded-lg bg-gray-50">
        <p className="text-gray-500">No se encontraron detalles para esta transferencia</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Detalles de la transferencia #{transfer.id}</CardTitle>
          {getStatusBadge(transfer.status)}
        </div>
        <CardDescription>
          Transferencia realizada el {format(new Date(transfer.created_at), 'PPP', { locale: es })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Remitente</p>
            <p className="font-medium">{transfer.sender?.name || `Usuario ID: ${transfer.sender_id}`}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Destinatario</p>
            <p className="font-medium">{transfer.receiver?.name || `Usuario ID: ${transfer.receiver_id}`}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Monto</p>
            <p className="font-medium text-lg text-green-600">{formatCurrency(transfer.amount)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Fecha de actualización</p>
            <p className="font-medium">
              {format(new Date(transfer.updated_at), 'PPP p', { locale: es })}
            </p>
          </div>
        </div>

        {transfer.admin_message && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-500">Mensaje</p>
            <p className="font-medium">{transfer.admin_message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
