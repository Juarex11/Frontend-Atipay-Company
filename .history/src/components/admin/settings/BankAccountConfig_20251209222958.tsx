import { useState, useEffect } from 'react';
import { AdminSystemService } from '@/services/adminSystemService';
import { DepositService } from '@/services/depositService'; // Usamos este para leer el dato inicial
import { Save, Building2, Loader2 } from 'lucide-react'; // Asegúrate de tener lucide-react o usa tus iconos

export const BankAccountConfig = () => {
  const [bankInfo, setBankInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar info al montar
  useEffect(() => {
    const loadInfo = async () => {
      setIsLoading(true);
      const result = await DepositService.getBankInfo();
      if (result.success && result.data) {
        setBankInfo(result.data);
      }
      setIsLoading(false);
    };
    loadInfo();
  }, []);

  const handleSave = async () => {
    if (!bankInfo.trim()) return;
    setIsSaving(true);
    
    const result = await AdminSystemService.updateBankInfo(bankInfo);
    
    if (result.success) {
      // Aquí puedes usar tu sistema de notificaciones/toast si tienes uno
      alert('Guardado: ' + result.message);
    } else {
      alert('Error: ' + result.message);
    }
    
    setIsSaving(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          <Building2 size={24} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Cuenta Bancaria de Recaudación</h3>
          <p className="text-sm text-gray-500">Configura los datos que verán los usuarios al depositar.</p>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="h-32 bg-gray-50 animate-pulse rounded-md border border-gray-100"></div>
        ) : (
          <textarea
            value={bankInfo}
            onChange={(e) => setBankInfo(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 min-h-[120px] text-sm font-mono"
            placeholder="Ej: BCP Soles: 191-xxxxxxxx-xx&#10;CCI: 002-xxxxxxxx-xx&#10;Titular: Tu Empresa SAC"
          />
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium text-sm"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};