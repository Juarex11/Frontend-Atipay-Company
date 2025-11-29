import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { CommissionSetting } from '@/services/commissionService';

interface CommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (setting: Omit<CommissionSetting, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  initialData: Omit<CommissionSetting, 'id' | 'created_at' | 'updated_at'> | null;
  isSubmitting: boolean;
}

export default function CommissionModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData,
  isSubmitting 
}: CommissionModalProps) {
  const defaultFormData = React.useMemo(() => ({
    level: 1,
    percentage: 0
  }), []);
  
  const [formData, setFormData] = React.useState(defaultFormData);

  React.useEffect(() => {
    setFormData(initialData || defaultFormData);
  }, [initialData, defaultFormData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'percentage') {
      const numValue = value === '' ? 0 : Math.max(0, Math.min(100, Number(value)));
      setFormData(prev => ({
        ...prev,
        percentage: parseFloat(numValue.toFixed(2))
      }));
    } else if (name === 'level') {
      const numValue = value === '' ? 1 : Math.max(1, Math.floor(Number(value)));
      setFormData(prev => ({
        ...prev,
        level: numValue
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.percentage <= 0 || formData.percentage > 100) {
      toast.error('El porcentaje debe estar entre 0 y 100');
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error al guardar la configuración:', error);
      toast.error('Error al guardar la configuración');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md relative border border-gray-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {initialData ? 'Editar Nivel' : 'Agregar Nuevo Nivel'}
              </h2>
              <p className="text-sm text-gray-500">
                {initialData ? 'Modifica los datos del nivel' : 'Ingresa los datos del nuevo nivel'}
              </p>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:bg-gray-100 p-1 rounded-full transition-colors"
              disabled={isSubmitting}
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="level">Nivel</Label>
              <Input
                id="level"
                name="level"
                type="number"
                min="1"
                value={formData.level}
                onChange={handleInputChange}
                className="mt-1"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="percentage">Porcentaje de Comisión (%)</Label>
              <Input
                id="percentage"
                name="percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.percentage}
                onChange={handleInputChange}
                className="mt-1"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-[#0a7e3e] hover:bg-[#0c4a2a] text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {initialData ? 'Actualizando...' : 'Creando...'}
                  </>
                ) : initialData ? 'Guardar Cambios' : 'Crear Nivel'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
