import { useState, useEffect } from 'react';
import { getReceivedTransfers, approveTransfer, rejectTransfer } from '@/services/transferService';
import type { Transfer } from '@/services/transferService';
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
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { AtipayCoin } from '@/components/ui/AtipayCoin';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


interface ReceivedTransfersListProps {
  refreshTrigger?: number;
  onTransferAction?: () => void;
}

export const ReceivedTransfersList = ({ refreshTrigger = 0, onTransferAction }: ReceivedTransfersListProps) => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject' | null>(null);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const getStatusBadge = (status: 'pending' | 'approved' | 'rejected' | 'not_evaluated' | string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aprobada</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazada</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendiente</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  useEffect(() => {
    const loadTransfers = async () => {
      try {
        setIsLoading(true);
        const data = await getReceivedTransfers();
        setTransfers(data);
      } catch (error) {
        console.error('Error loading received transfers:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load received transfers',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTransfers();
  }, [refreshTrigger, toast]);

  const handleApprove = async (transfer: Transfer) => {
    setSelectedTransfer(transfer);
    setDialogAction('approve');
    setIsDialogOpen(true);
  };

  const handleReject = async (transfer: Transfer) => {
    setSelectedTransfer(transfer);
    setDialogAction('reject');
    setIsDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedTransfer) return;

    try {
      setProcessingId(selectedTransfer.id);

      if (dialogAction === 'approve') {
        await approveTransfer(selectedTransfer.id);
        toast({
          title: 'Transferencia aprobada',
          description: `Has aceptado la transferencia de ${Number(selectedTransfer.amount).toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`,
        });
      } else if (dialogAction === 'reject') {
        await rejectTransfer(selectedTransfer.id);
        toast({
          title: 'Transferencia rechazada',
          description: `Has rechazado la transferencia de ${Number(selectedTransfer.amount).toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`,
        });
      }

      setTransfers(prevTransfers =>
        prevTransfers.map(t =>
          t.id === selectedTransfer.id
            ? { ...t, status: dialogAction === 'approve' ? 'approved' : 'rejected' }
            : t
        )
      );

      if (onTransferAction) {
        onTransferAction();
      }
      if (dialogAction === 'approve') {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }

    } catch (error) {
      const actionText = dialogAction === 'approve' ? 'aprobar' : 'rechazar';
      console.error(`Error al ${actionText} la transferencia:`, error);

      const errorMessage = error instanceof Error
        ? error.message
        : `No se pudo ${actionText} la transferencia`;

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
      setIsDialogOpen(false);
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
        <p className="text-gray-500">No has recibido transferencias</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Remitente</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.map((transfer) => (
              <TableRow key={transfer.id}>
                <TableCell>{transfer.sender?.name || `Usuario ${transfer.sender_id}`}</TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-1">
                    <AtipayCoin size="xs" className="w-3 h-3" />
                    {typeof transfer.amount === 'number' 
                      ? transfer.amount.toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })
                      : transfer.amount || '0.00'}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                <TableCell>
                  {transfer.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                        onClick={() => handleApprove(transfer)}
                        disabled={!!processingId}
                      >
                        {processingId === transfer.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                        onClick={() => handleReject(transfer)}
                        disabled={!!processingId}
                      >
                        {processingId === transfer.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        Rechazar
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Acción completada</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogAction === 'approve'
                ? 'Aprobar transferencia'
                : 'Rechazar transferencia'
              }
            </AlertDialogTitle>
            <div className="space-y-2">
              <AlertDialogDescription>
                {(() => {
                  const amount = selectedTransfer ? Number(selectedTransfer.amount).toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) : '';
                  if (dialogAction === 'approve') {
                    return `¿Estás seguro de que deseas aprobar la transferencia de ${amount}?`;
                  }
                  return `¿Estás seguro de que deseas rechazar la transferencia de ${amount}?`;
                })()}
              </AlertDialogDescription>
              {dialogAction === 'approve' && (
                <AlertDialogDescription className="font-medium">
                  Este monto se añadirá a tu saldo disponible.
                </AlertDialogDescription>
              )}
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!processingId}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmAction();
              }}
              className={dialogAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              disabled={!!processingId}
            >
              {!!processingId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialogAction === 'approve' ? 'Aprobar' : 'Rechazar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
