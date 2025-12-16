import { useState, useEffect } from 'react';
import { DepositService } from '@/services/depositService';
import { Copy, CheckCircle2, Info } from 'lucide-react';

export const DepositBankInfo = () => {
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadBankInfo = async () => {
      const result = await DepositService.getBankInfo();
      if (result.success && result.data) {
        setInfo(result.data);
      }
      setLoading(false);
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

  if (loading) return <div className="h-24 bg-gray-50 animate-pulse rounded-lg mb-6"></div>;
  if (!info) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex gap-3 items-start">
        <div className="mt-1 text-blue-600 shrink-0">
            <Info size={20} />
        </div>
        
        <div className="flex-1 w-full">
          <h4 className="text-sm font-bold text-blue-900 mb-2">
            Datos para Transferencia / Depósito
          </h4>
          
          <div className="bg-white p-3 rounded border border-blue-100 font-mono text-sm text-gray-700 whitespace-pre-wrap shadow-sm mb-3 break-words">
            {info}
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleCopy}
              className={`text-xs flex items-center gap-1.5 font-medium transition-all px-3 py-1.5 rounded-full border ${
                copied 
                  ? 'bg-green-100 text-green-700 border-green-200' 
                  : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 size={14} />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copiar datos</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-blue-200/50 text-xs text-blue-600/80 italic">
        * Recuerda guardar la captura de tu comprobante para el siguiente paso.
      </div>
    </div>
  );
};