import { useState, useEffect } from 'react';
import { getSentTransfers, type ApiTransferResponse } from '@/services/transferService';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AtipayCoin } from '@/components/ui/AtipayCoin';

// Using the imported ApiTransferResponse type from transferService

interface SentTransfersListProps {
  refreshTrigger?: number;
}

export const SentTransfersList = ({ refreshTrigger = 0 }: SentTransfersListProps) => {
  const [transfers, setTransfers] = useState<ApiTransferResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Función para formatear la fecha y hora de manera segura
  const formatDateTime = (dateStr: string | undefined, timeStr: string | undefined): string => {
    // Si falta alguno de los valores, retornar un mensaje apropiado
    if (!dateStr || !timeStr) {
      return 'Fecha no disponible';
    }

    try {
      // Verificar que los strings tengan el formato esperado
      const dateParts = dateStr.split('-');
      const timeParts = timeStr.split(':');
      
      if (dateParts.length !== 3 || timeParts.length < 2) {
        return `${dateStr} ${timeStr}`; // Devolver los valores originales si el formato no es el esperado
      }

      const [year, month, day] = dateParts.map(Number);
      const [hours, minutes] = timeParts.map(Number);
      
      const date = new Date(year, month - 1, day, hours, minutes);
      
      if (isNaN(date.getTime())) {
        return `${dateStr} ${timeStr}`; // Devolver los valores originales si la fecha no es válida
      }
      
      return format(date, "dd/MM/yyyy 'a las' hh:mm a", { locale: es });
    } catch (error) {
      console.error('Error al formatear fecha y hora:', { dateStr, timeStr, error });
      return `${dateStr} ${timeStr}`; // Devolver los valores originales en caso de error
    }
  };

  useEffect(() => {
    const loadTransfers = async () => {
      try {
        setIsLoading(true);
        const data = await getSentTransfers();
        
        // The data is already properly typed as ApiTransferResponse[] from the service
        const formattedTransfers: ApiTransferResponse[] = Array.isArray(data) 
          ? data.map(transfer => ({
              ...transfer,
              sender_username: transfer.sender_username || `Usuario ${transfer.sender_id}`,
              receiver_username: transfer.receiver_username || `Usuario ${transfer.receiver_id}`,
              amount: transfer.amount || '0.00',
              status: transfer.status || 'pending',
              registration_date: transfer.registration_date || '',
              registration_time: transfer.registration_time || ''
            }))
          : [];
          
        setTransfers(formattedTransfers);
      } catch (error) {
        console.error('Error al cargar transferencias enviadas:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'No se pudieron cargar las transferencias enviadas',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTransfers();
  }, [toast, refreshTrigger]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300 text-xs">Pendiente</Badge>;
      case 'not_evaluated':
        return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300 text-xs">No evaluada</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300 text-xs">Aprobada</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300 text-xs">Rechazada</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        <span className="ml-2">Cargando transferencias...</span>
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg bg-gray-50">
        <p className="text-gray-500">No has realizado transferencias</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Destinatario</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha y hora</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transfers.map((transfer) => (
            <TableRow key={transfer.id}>
              <TableCell>{transfer.receiver_username || `Usuario ${transfer.receiver_id}`}</TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-1">
                  <AtipayCoin size="xs" className="w-3 h-3" />
                  {Number(transfer.amount).toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(transfer.status)}</TableCell>
              <TableCell>{formatDateTime(transfer.registration_date, transfer.registration_time)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
