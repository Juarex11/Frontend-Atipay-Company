import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, Gift } from 'lucide-react';
import { useState } from 'react';

interface RequestStatus {
  status?: 'pending' | 'approved' | 'rejected';
  message?: string;
}

interface GiftDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRedeem?: () => Promise<void>;
  requestStatus?: RequestStatus | null;
  gift: {
    id: number;
    name: string;
    description: string;
    redeem_points: number;
    stock: number;
    image_url: string;
    created_at?: string;
    updated_at?: string;
  } | null;
}

export function GiftDetailsModal({ 
  isOpen, 
  onClose, 
  gift, 
  onRedeem,
  requestStatus 
}: GiftDetailsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!gift) return null;

  const handleRedeem = async () => {
    if (!onRedeem) return;
    
    try {
      setIsSubmitting(true);
      await onRedeem();
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusBadge = (status?: string) => {
    if (!status) return null;
    
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4 mr-1" />
            Pendiente de aprobación
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Aprobado
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="w-4 h-4 mr-1" />
            Rechazado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        aria-describedby="gift-details-description"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Detalles del Regalo</DialogTitle>
          <p id="gift-details-description" className="sr-only">
            Información detallada sobre el regalo {gift.name}
          </p>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <div className="rounded-lg overflow-hidden bg-gray-100 aspect-square flex items-center justify-center">
                {gift.image_url ? (
                  <img
                    src={gift.image_url}
                    alt={gift.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 p-4 text-center">
                    <span className="text-sm">Sin imagen</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="md:w-2/3 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{gift.name}</h3>
                <p className="mt-1 text-gray-600">{gift.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Puntos requeridos</p>
                  <p className="text-lg font-semibold text-indigo-600">{gift.redeem_points}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Disponibilidad</p>
                  <p className={`text-lg font-semibold ${
                    gift.stock > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {gift.stock > 0 ? `En stock (${gift.stock})` : 'Agotado'}
                  </p>
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  {gift.created_at && `Creado el: ${new Date(gift.created_at).toLocaleDateString()}`}
                </p>
                {gift.updated_at && gift.updated_at !== gift.created_at && (
                  <p className="text-sm text-gray-500">
                    Actualizado: {new Date(gift.updated_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
      <DialogFooter className="mt-6">
        {requestStatus?.status ? (
          <div className="w-full">
            <div className="mb-4">
              {renderStatusBadge(requestStatus.status)}
              {requestStatus.message && (
                <p className="mt-2 text-sm text-gray-600">
                  {requestStatus.message}
                </p>
              )}
            </div>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full"
            >
              Cerrar
            </Button>
          </div>
        ) : (
          <div className="w-full space-y-4">
            <div className="flex items-center text-sm text-gray-500">
              <Gift className="w-4 h-4 mr-2 text-gray-400" />
              <span>{gift.redeem_points} puntos necesarios</span>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleRedeem}
                disabled={gift.stock === 0 || isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                    Procesando...
                  </>
                ) : 'Solicitar Canje'}
              </Button>
            </div>
          </div>
        )}
      </DialogFooter>
    </Dialog>
  );
}
