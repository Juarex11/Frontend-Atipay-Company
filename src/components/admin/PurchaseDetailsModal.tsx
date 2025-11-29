import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PurchaseRequest } from './PurchaseRequestsTable';
import { AtipayCoin } from "@/components/ui/AtipayCoin";

interface PurchaseDetailsModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly request: PurchaseRequest | null;
}

export function PurchaseDetailsModal({ isOpen, onClose, request }: PurchaseDetailsModalProps) {
  if (!request) return null;

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

  const getPaymentMethodText = (method?: string) => {
    if (!method) return 'No especificado';
    if (method.toLowerCase() === 'atipay') return 'Atipay';
    if (method.toLowerCase() === 'points') return 'Puntos';
    return method;
  };

  const getStatusText = (status: string) => {
    if (status === 'pending') return 'Pendiente';
    if (status === 'approved') return 'Aprobado';
    return 'Rechazado';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Detalles de la Solicitud
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Información del Producto</h3>
            <div className="flex space-x-4">
              {request.product?.image && typeof request.product.image === 'string' && (
                <img 
                  src={request.product.image} 
                  alt={request.product.name || 'Producto'}
                  className="h-32 w-32 object-cover rounded-lg border"
                />
              )}
              <div className="space-y-1">
                <h4 className="font-medium text-gray-900">{request.product?.name}</h4>
                <p className="text-sm text-gray-600">{request.product?.description}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="font-medium">Precio:</span>
                  <span>S/ {request.product?.price?.toFixed(2)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Cantidad:</span>
                  <span>{request.quantity}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Total:</span>
                  <span className="font-semibold">S/ {(request.product?.price * request.quantity)?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* User and Request Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Información del Usuario</h3>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Usuario: </span>
                <span>{request.user?.name || request.user?.email?.split('@')[0] || 'Usuario'}</span>
              </div>
              <div>
                <span className="font-medium">Email: </span>
                <span>{request.user?.email}</span>
              </div>
              <div>
                <span className="font-medium">Saldo Atipay: </span>
                <div className="flex items-center gap-1">
                  <AtipayCoin size="xs" className="w-3.5 h-3.5" />
                  <span>{request.product?.price?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
              <div>
                <span className="font-medium">Puntos Disponibles: </span>
                <span>{request.product?.points_earned || '0'}</span>
              </div>
              <div>
                <span className="font-medium">Método de Pago: </span>
                <Badge variant="outline" className="ml-1">
                  {getPaymentMethodText(request.payment_method)}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Estado: </span>
                <Badge variant={getStatusVariant(request.status)} className="ml-1">
                  {getStatusText(request.status)}
                </Badge>
              </div>
              {request.admin_message && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p className="font-medium text-sm text-gray-700">Mensaje del Administrador:</p>
                  <p className="text-sm text-gray-600 mt-1">{request.admin_message}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t mt-4">
          <Button onClick={onClose} variant="outline">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
