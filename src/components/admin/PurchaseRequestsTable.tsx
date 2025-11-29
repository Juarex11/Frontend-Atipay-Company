import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { AtipayCoin } from '@/components/ui/AtipayCoin';
import { useToast } from '@/components/ui/use-toast';
import { ProductService } from '@/services/product.service';

interface ApiPurchaseRequest {
  id: string | number;
  product_id: string | number;
  quantity: number;
  status: string;
  created_at: string;
  updated_at: string;
  request_date: string;
  request_time: string;
  user: {
    id: string | number;
    name: string;
    username: string;
    email: string;
    phone_number?: string;
  };
  product: {
    id: string | number;
    name: string;
    description: string;
    price: number;
    points_earned: number;
    image_url?: string;
    type?: string;
    status?: string;
  };
  payment_method: string;
  admin_message?: string | null;
  user_id?: string | number;
}

import { PurchaseDetailsModal } from './PurchaseDetailsModal';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface PurchaseRequest {
  id: string | number;
  product_id: string | number;
  quantity: number;
  status: 'pending' | 'approved' | 'rejected' | string;
  created_at: string;
  updated_at: string;
  request_date?: string;
  request_time?: string;
  user: {
    id: string | number;
    name: string;
    email: string;
    username?: string;
    phone_number?: string;
  };
  product: {
    id: string | number;
    name: string;
    description: string;
    price: number;
    points_earned: number;
    image: string;
    type: string;
    status: string;
    stock: number;
    unit_type: string;
    points_to_redeem: number;
  };
  // Optional fields that might come from the API
  user_id?: string | number;
  payment_method: string;
  admin_message?: string | null;
}

export function PurchaseRequestsTable() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Obteniendo solicitudes de compra...');
      const data = await ProductService.getPurchaseRequests();
      console.log('Datos de solicitudes recibidos:', data);

      // Map the data to match our PurchaseRequest interface
      const formattedData = (data as unknown as ApiPurchaseRequest[]).map(item => {
        const productId = item.product?.id ? Number(item.product.id) : 0;
        const productImage = item.product?.image_url || '';
        
        return {
          ...item,
          created_at: item.request_date ? `${item.request_date} ${item.request_time}` : item.created_at,
          // Ensure product has all required fields with defaults
          product: {
            id: productId,
            name: item.product?.name || 'Producto desconocido',
            description: item.product?.description || '',
            price: item.product?.price || 0,
            points_earned: item.product?.points_earned || 0,
            image: productImage,
            type: item.product?.type || 'product',
            status: item.product?.status || 'active',
            stock: 0, // Default values for required fields
            unit_type: 'unit',
            points_to_redeem: 0
          },
          // Ensure user has all required fields
          user: {
            id: item.user?.id || item.user_id || 0,
            name: item.user?.name || item.user?.username || 'Usuario',
            email: item.user?.email || ''
          }
        } as PurchaseRequest;
      });

      setRequests(formattedData);
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las solicitudes de compra',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id: string | number) => {
    try {
      setProcessingId(id);
      await ProductService.approvePurchaseRequest(id);
      await fetchRequests();
      toast({
        title: 'Solicitud aprobada',
        description: 'La solicitud ha sido aprobada exitosamente',
      });
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: 'Error',
        description: 'No se pudo aprobar la solicitud',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string | number) => {
    try {
      setProcessingId(id);
      await ProductService.rejectPurchaseRequest(id, { admin_message: 'Solicitud rechazada por el administrador' });
      await fetchRequests();
      toast({
        title: 'Solicitud rechazada',
        description: 'La solicitud ha sido rechazada exitosamente',
      });
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'Error',
        description: 'No se pudo rechazar la solicitud',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'approved':
        return 'Aprobado';
      case 'rejected':
        return 'Rechazado';
      default:
        return status;
    }
  };

  const getPaymentMethodBadgeClass = (paymentMethod: string) => {
    switch (paymentMethod) {
      case 'atipay':
        return 'border-green-200 bg-green-50 text-green-700';
      case 'points':
        return 'border-blue-200 bg-blue-50 text-blue-700';
      default:
        return 'bg-gray-50';
    }
  };

  const getPaymentMethodText = (paymentMethod: string | undefined) => {
    return paymentMethod || 'Desconocido'; // Return 'Desconocido' if paymentMethod is undefined
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableCaption className="text-lg font-semibold">Lista de solicitudes de compra con Atipay</TableCaption>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-[25%] min-w-[200px]">Producto</TableHead>
            <TableHead className="w-[15%] min-w-[120px]">Usuario</TableHead>
            <TableHead className="w-[8%] text-center">Cantidad</TableHead>
            <TableHead className="w-[12%] text-center">Método de Pago</TableHead>
            <TableHead className="w-[10%] text-right">Total</TableHead>
            <TableHead className="w-[10%] text-center">Estado</TableHead>
            <TableHead className="w-[12%] text-center">Fecha</TableHead>
            <TableHead className="w-[8%] text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No hay solicitudes de compra pendientes
              </TableCell>
            </TableRow>
          ) : (
            requests.map((request) => (
              <TableRow 
                key={request.id} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSelectedRequest(request);
                  setIsModalOpen(true);
                }}
              >
                <TableCell className="py-3">
                  <div className="flex items-center space-x-3">
                    {request.product?.image && typeof request.product.image === 'string' && (
                      <img
                        src={request.product.image}
                        alt={request.product.name}
                        className="h-10 w-10 object-cover rounded-md border"
                      />
                    )}
                    <span className="font-medium text-gray-900 line-clamp-2">
                      {request.product?.name || 'Producto'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <span className="font-medium text-gray-900">
                    {request.user.name || request.user.email.split('@')[0]}
                  </span>
                </TableCell>
                <TableCell className="text-center py-3">
                  <span className="font-medium">{request.quantity}</span>
                </TableCell>
                <TableCell className="text-center py-3">
                  <Badge
                    variant="outline"
                    className={getPaymentMethodBadgeClass(request.payment_method || '')}
                  >
                    {getPaymentMethodText(request.payment_method)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right py-3">
                  <div className="flex items-center justify-end gap-1">
                    <AtipayCoin size="xs" className="w-3.5 h-3.5" />
                    <span className="font-medium text-gray-900">
                      {(request.product?.price * request.quantity)?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center py-3">
                  <div className="flex justify-center">
                    <Badge
                      variant={getStatusVariant(request.status)}
                      className="min-w-[80px] justify-center"
                    >
                      {getStatusText(request.status)}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-center py-3">
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-medium text-gray-900">
                      {request.request_date || new Date(request.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {request.request_time || new Date(request.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-center space-x-1">
                    {request.status === 'pending' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-green-200 hover:text-green-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(request.id);
                          }}
                          disabled={processingId === request.id}
                          title="Aprobar"
                        >
                          {processingId === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-200 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(request.id);
                          }}
                          disabled={processingId === request.id}
                          title="Rechazar"
                        >
                          {processingId === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">
                        {request.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {/* Purchase Details Modal */}
      <PurchaseDetailsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        request={selectedRequest}
      />
    </div>
  );
};

export default PurchaseRequestsTable;
