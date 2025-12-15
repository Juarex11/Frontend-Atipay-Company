import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Importante para la navegación
import { DepositService } from '@/services/depositService';
import { Copy, CheckCircle2, Building2, AlertCircle, ArrowRight, Wallet, ShieldCheck } from 'lucide-react';
import { Button } from "@/components/ui/button"; // Usamos tus botones UI del sistema

export const DepositBankInfo = () => {
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadBankInfo = async () => {
      try {
        const result = await DepositService.getBankInfo();
        if (result.success && result.data) {
          setInfo(result.data);
        }
      } catch (error) {
        console.error("Error cargando info banco", error);
      } finally {
        setLoading(false);
      }
    };
    loadBankInfo();
  }, []);

  const handleCopy = () => {
    if (info) {
      navigator.clipboard.writeText(info);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return (
    <div className="h-48 bg-slate-50 animate-pulse rounded-xl border border-slate-200 mb-4 flex items-center justify-center">
      <span className="text-xs text-slate-400 font-medium">Cargando datos bancarios seguros...</span>
    </div>
  );
  
  if (!info) return null;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500 my-4">
      
      {/* 1. DISEÑO PREMIUM DE LA TARJETA BANCARIA */}
      <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white group hover:shadow-md transition-shadow duration-300">
        
        {/* Cabecera oscura "Corporativa" */}
        <div className="bg-slate-900 px-4 py-3 flex items-center justify-between relative overflow-hidden">
          {/* Efecto de fondo sutil */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
          
          <div className="flex items-center gap-2 text-white relative z-10">
            <div className="p-1.5 bg-blue-600 rounded-md shadow-lg shadow-blue-900/50">
               <Building2 size={16} className="text-white" />
            </div>
            <span className="font-semibold text-sm tracking-wide text-slate-100">Cuenta Recaudadora</span>
          </div>
          
          <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-400 uppercase tracking-wider relative z-10">
            <ShieldCheck size={10} />
            <span>Verificada</span>
          </div>
        </div>

        {/* Cuerpo de la Información */}
        <div className="p-5 bg-gradient-to-b from-white to-slate-50/50">
          
          <div className="mb-4">
             <div className="flex justify-between items-end mb-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Datos para transferencia
                </label>
                {copied && <span className="text-[10px] text-green-600 font-medium animate-pulse">¡Copiado al portapapeles!</span>}
             </div>
             
             <div className="relative">
                {/* Caja de texto estilo "Ticket" */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-inner">
                  {info}
                </div>
                
                {/* Botón de copiar flotante */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="absolute top-2 right-2 p-2 bg-white rounded-md border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:shadow-sm transition-all"
                  title="Copiar datos"
                >
                  {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
             </div>
          </div>

          {/* Nota informativa más elegante */}
          <div className="flex gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100/60">
             <div className="mt-0.5 text-blue-500 shrink-0">
               <AlertCircle size={16} />
             </div>
             <div className="space-y-1">
               <p className="text-xs font-semibold text-blue-800">Instrucciones:</p>
               <p className="text-[11px] text-slate-600 leading-snug">
                 Realiza el depósito y guarda la captura del comprobante. Luego adjúntalo abajo para validar tu recarga.
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* 2. TU PETICIÓN: Botón para ir al historial */}
      <div className="flex flex-col items-center pt-2 gap-2">
        <p className="text-[11px] text-slate-400 text-center">
          ¿Necesitas verificar una transacción anterior?
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          type="button" // ¡MUY IMPORTANTE! type="button" evita que se envíe el formulario al hacer clic
          onClick={() => navigate('/transactions')} // Ajusta la ruta si es diferente, ej: '/user/transactions'
          className="w-full border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50 transition-all h-9 text-xs"
        >
          <Wallet size={14} className="mr-2 text-slate-400" />
          Ver mi Historial de Transacciones
          <ArrowRight size={12} className="ml-2 opacity-50" />
        </Button>
      </div>

    </div>
  );
};