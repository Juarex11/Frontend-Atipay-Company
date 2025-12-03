import  { useState, useEffect } from 'react';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  ExternalLink, 
  Calendar, 
  CreditCard,
  FileText,
  Clock
} from 'lucide-react';

interface ProofViewerProps {
  open: boolean;
  onClose: () => void;
  data: {
    src: string | null;
    id?: string | number;
    productName?: string;
    date?: string;
    status?: string;
  } | null;
}

export default function ProofViewer({ open, onClose, data }: ProofViewerProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) setIsZoomed(false);
  }, [open, data]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isZoomed) setIsZoomed(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, isZoomed]);

  if (!open || !data || !data.src) return null;

  const formattedDate = data.date 
    ? new Date(data.date).toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }) 
    : 'Fecha no disponible';

  const handleCopyLink = async () => {
    if (!data?.src) return;
    try {
      await navigator.clipboard.writeText(data.src);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback si clipboard falla (ej: https), usamos prompt para que el usuario copie manualmente
      // eslint-disable-next-line no-alert
      alert('No fue posible copiar automáticamente. Copia manualmente: ' + data.src);
    }
  };

  // MODO ZOOM (pantalla completa)
  if (isZoomed) {
    return (
      <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-200">
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
          <span className="text-white/80 text-sm font-medium ml-2">Vista detallada</span>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsZoomed(false)}
              className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
              title="Reducir"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 bg-white/10 text-white rounded-full hover:bg-red-500/80 transition-colors"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="w-full h-full p-4 flex items-center justify-center overflow-auto">
          <img 
            src={data.src} 
            alt="Comprobante Full" 
            className="max-w-none md:max-w-full md:max-h-full object-contain shadow-2xl"
          />
        </div>
      </div>
    );
  }

  // MODO TARJETA NORMAL
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[85vh] md:h-[500px]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* IZQUIERDA - IMAGEN */}
        <div className="w-full md:w-1/2 bg-gray-100 relative group h-64 md:h-full flex-shrink-0">
          <img 
            src={data.src} 
            alt="Comprobante Preview" 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <button 
              onClick={() => setIsZoomed(true)}
              className="bg-white text-gray-800 px-4 py-2 rounded-full font-medium shadow-lg transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2"
            >
              <Maximize2 className="w-4 h-4" />
              Ampliar imagen
            </button>
          </div>
        </div>

        {/* DERECHA - INFO */}
        <div className="w-full md:w-1/2 flex flex-col p-6 md:p-8 overflow-y-auto">
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Detalle del Depósito
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                ID Transacción: #{data.id || '---'}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4 flex-1">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Producto</span>
              <p className="font-semibold text-blue-900 text-lg flex items-center gap-2 mt-1">
                <CreditCard className="w-4 h-4" />
                {data.productName || 'Producto desconocido'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Estado actual
                </span>
                <div>
                  <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${data.status === 'approved' ? 'bg-green-100 text-green-800' : 
                      data.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'}
                  `}>
                    {data.status === 'pending' ? 'En revisión' : data.status}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Fecha de subida
                </span>
                <p className="text-sm font-medium text-gray-700">{formattedDate}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Acciones del comprobante</p>
              <div className="flex gap-2">

                {/* ABRIR EN NUEVA PESTAÑA */}
                <a 
                  href={data.src} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Abrir Tab
                </a>

                {/* COPIAR LINK */}
                <button
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  {copied ? '¡Copiado!' : 'Copiar enlace'}
                </button>

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
