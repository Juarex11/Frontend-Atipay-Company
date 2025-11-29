import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import type { Recharge } from "@/services/atipayRechargeService";

interface DetailsModalProps {
  detail: Recharge | null;
  open: boolean;
  onClose: () => void;
  statusLabels: Record<string, string>;
  getPaymentMethodName?: (userPaymentMethodId: string) => string;
}

const formatDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

// Estilos de colores para los métodos de pago
const paymentMethodStyles: Record<string, string> = {
  "Yape": "bg-purple-100 text-purple-800 border-purple-200",
  "Plin": "bg-blue-100 text-blue-800 border-blue-200",
  "Transferencia bancaria": "bg-green-100 text-green-800 border-green-200",
  "Transferencia Bancaria": "bg-green-100 text-green-800 border-green-200",
  "BCP": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Interbank": "bg-orange-100 text-orange-800 border-orange-200",
  "BBVA": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Scotiabank": "bg-red-100 text-red-800 border-red-200",
  "Tunki": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Otro": "bg-gray-100 text-gray-800 border-gray-200",
  "Other": "bg-gray-100 text-gray-800 border-gray-200",
};

// Función para obtener los estilos del método de pago
const getPaymentMethodStyles = (methodName: string) => {
  return paymentMethodStyles[methodName] || "bg-gray-100 text-gray-800 border-gray-200";
};

export const DetailsModal = ({
  detail,
  open,
  onClose,
  statusLabels,
  getPaymentMethodName,
}: DetailsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalle Recarga #{detail?.id}</DialogTitle>
        </DialogHeader>
        {detail && (
          <div className="space-y-3 text-sm">
            <Row
              label="Usuario"
              value={detail.user_id.toString()}
            />
            <Row label="Nombre completo" value={detail.full_names} />
            <Row label="Monto" value={`S/. ${detail.amount.toFixed(2)}`} />
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Método:</span>
              {getPaymentMethodName ? (
                <Badge className={`${getPaymentMethodStyles(getPaymentMethodName(detail.user_payment_method_id))} border text-xs font-medium px-2 py-1`}>
                  {getPaymentMethodName(detail.user_payment_method_id)}
                </Badge>
              ) : (
                <span className="text-gray-600">
                  {detail.user_payment_method_id ? `Método ${detail.user_payment_method_id}` : 'No especificado'}
                </span>
              )}
            </div>
            <Row
              label="Estado"
              value={statusLabels[detail.status] || detail.status}
            />
            <Row label="Créditos otorgados" value={detail.amount || 'No aplicable'} />
            {detail.admin_message && (
              <Row label="Mensaje admin" value={detail.admin_message} />
            )}
            <ImagePreview url={detail.proof_image_url} />
            <div className="text-xs text-gray-500">
              Creada: {formatDateTime(detail.request_at)}
            </div>
            {detail.processed_at && (
              <div className="text-xs text-gray-500">
                Procesada: {formatDateTime(detail.processed_at)}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between">
    <span>{label}:</span>
    <strong>{value}</strong>
  </div>
);

import { Button } from "@/components/ui/button";

// Re-implementación de ImagePreview para mantenerlo encapsulado aquí
const ImagePreview = ({ url }: { url: string }) => {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(false);

  if (!url) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="space-y-2">
      <span className="block mb-1">Comprobante:</span>
      <button
        type="button"
        className="relative group w-48 p-0 border-0 bg-transparent text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
        onClick={() => setOpen(true)}
        onKeyDown={(e) => handleKeyDown(e, () => setOpen(true))}
        aria-label="Ver comprobante en tamaño completo"
      >
        <img
          src={url}
          alt=""
          className="rounded-md border object-cover h-32 w-full transition-transform group-hover:scale-[1.02]"
          loading="lazy"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs rounded-md transition-opacity">
          Ver grande
        </div>
      </button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) setZoom(false);
          setOpen(o);
        }}
      >
        <DialogContent className="bg-black/90 border-0 shadow-none max-w-none w-screen h-screen flex items-center justify-center p-4">
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setZoom((z) => !z)}
              onKeyDown={(e) => handleKeyDown(e, () => setZoom(z => !z))}
            >
              {zoom ? "Reducir" : "Ampliar"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="text-white text-xl cursor-pointer"
              onClick={() => setOpen(false)}
            >
              CERRAR
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setZoom((z) => !z)}
            onKeyDown={(e) => handleKeyDown(e, () => setZoom(z => !z))}
            className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
            aria-label={zoom ? "Reducir imagen" : "Ampliar imagen"}
          >
            <img
              src={url}
              alt="Comprobante"
              className={`transition-all duration-300 rounded shadow-lg ${zoom ? "max-h-[95vh] max-w-[95vw]" : "max-h-[70vh] max-w-[70vw]"
                } object-contain`}
            />
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
