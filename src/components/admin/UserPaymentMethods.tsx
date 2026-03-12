/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Smartphone, CreditCard, Banknote, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { getAuthHeaders } from '@/utils/auth';
import { deleteUserPaymentMethod, updateUserPaymentMethod, type UpdateUserPaymentMethodDto } from '@/services/userPaymentMethodService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

// --- NUEVO: CONFIGURACIÓN DE DISEÑO DIFUMINADO ---
const METHOD_THEMES: Record<string, { main: string, light: string, icon: any }> = {
  'yape': { 
    main: '#742284', 
    light: 'rgba(116, 34, 132, 0.06)', 
    icon: <Smartphone className="w-5 h-5" /> 
  },
  'plin': { 
    main: '#00bfa5', 
    light: 'rgba(0, 191, 165, 0.06)', 
    icon: <Smartphone className="w-5 h-5" /> 
  },
  'transferencia bancaria': { 
    main: '#004b98', 
    light: 'rgba(0, 75, 152, 0.06)', 
    icon: <CreditCard className="w-5 h-5" /> 
  },
  'bonificación': { 
    main: '#f59e0b', 
    light: 'rgba(245, 158, 11, 0.06)', 
    icon: <Gift className="w-5 h-5" /> 
  }
};

declare global {
  interface Window {
    refreshPaymentMethods?: () => void;
  }
}

interface PaymentMethodData {
  [key: string]: string | number | boolean | null;
}

interface PaymentMethodType {
  id: number;
  name: string;
  fields: string[];
}

interface UserPaymentMethod {
  id: number;
  user_id: number;
  payment_method_id: number;
  data: PaymentMethodData;
  method: PaymentMethodType;
}

interface EditModalProps {
  isOpen: boolean;
  method: UserPaymentMethod | null;
  onClose: () => void;
  onSave: (id: number, data: Omit<UpdateUserPaymentMethodDto, 'id'>) => Promise<void>;
}

const EditPaymentMethodModal: React.FC<EditModalProps> = ({ isOpen, method, onClose, onSave }) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (method) {
      const stringifiedData = Object.entries(method.data).reduce((acc, [key, value]) => {
        acc[key] = value !== null && value !== undefined ? String(value) : '';
        return acc;
      }, {} as Record<string, string>);
      setFormData(stringifiedData);
    }
  }, [method]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!method) return;
    try {
      setIsSaving(true);
      await onSave(method.id, { payment_method_id: method.payment_method_id, data: formData });
      onClose();
    } catch (error) {
      console.error('Error updating payment method:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el método de pago');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !method) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar método de pago</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {Object.entries(formData).map(([key]) => (
            <div key={key} className="space-y-2">
              <label className="text-sm font-medium leading-none capitalize">
                {key.replace(/_/g, ' ')}
              </label>
              <input
                type="text"
                name={key}
                value={formData[key] || ''}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving} className="h-10 px-4 py-2">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving} className="h-10 px-4 py-2">
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function UserPaymentMethods() {
  const [userPaymentMethods, setUserPaymentMethods] = useState<UserPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMethod, setEditingMethod] = useState<UserPaymentMethod | null>(null);
  const [methodToDelete, setMethodToDelete] = useState<number | null>(null);

  // --- FUNCIÓN PARA OBTENER EL TEMA SEGÚN EL NOMBRE ---
  const getTheme = (name: string) => {
    const key = name?.toLowerCase() || '';
    return METHOD_THEMES[key] || { main: '#6b7280', light: 'transparent', icon: <Banknote className="w-5 h-5" /> };
  };

  const fetchPaymentMethods = useCallback(async () => {
    try {
      setIsLoading(true);
      // CORRECCIÓN QUIRÚRGICA: https:// en lugar de httpss://
      const response = await fetch('https://api.atipaycompany.com/api/user/payment-methods', {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar los métodos de pago');
      }

      const data = await response.json();
      setUserPaymentMethods(data);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Error al cargar los métodos de pago');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentMethods();
    window.refreshPaymentMethods = fetchPaymentMethods;
    return () => { delete window.refreshPaymentMethods; };
  }, [fetchPaymentMethods]);

  const handleDelete = async (id: number) => {
    try {
      await deleteUserPaymentMethod(id);
      setUserPaymentMethods(prev => prev.filter(method => method.id !== id));
      setMethodToDelete(null);
      toast.success('Método de pago eliminado correctamente');
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el método de pago');
    }
  };

  const handleUpdatePaymentMethod = async (id: number, data: Omit<UpdateUserPaymentMethodDto, 'id'>) => {
    try {
      const updatedMethod = await updateUserPaymentMethod(id, data);
      setUserPaymentMethods(prev =>
        prev.map(method => method.id === id ? updatedMethod : method)
      );
      toast.success('Método de pago actualizado correctamente');
    } catch (error) {
      console.error('Error updating payment method:', error);
      throw error;
    }
  };

  const formatFieldValue = (_field: string, value: string | number | boolean | null | undefined): string => {
    if (value === undefined || value === null || value === '') return '-';
    return String(value);
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      'numero': 'Número', 'numerocuenta': 'Número de Cuenta', 'cuenta': 'Número de Cuenta',
      'titular': 'Titular', 'nombretitular': 'Titular', 'banco': 'Banco',
      'bancodestino': 'Banco', 'cci': 'Número de CCI', 'numerocci': 'Número de CCI',
      'telefono': 'Teléfono', 'celular': 'Teléfono', 'email': 'Correo Electrónico',
      'correo': 'Correo Electrónico', 'nombres': 'Nombres Completos', 'apellidos': 'Apellidos',
      'dni': 'DNI', 'ruc': 'RUC', 'direccion': 'Dirección', 'ciudad': 'Ciudad',
      'pais': 'País', 'moneda': 'Moneda', 'tipocuenta': 'Tipo de Cuenta',
    };
    const lowerField = field.toLowerCase();
    const matchedKey = Object.keys(labels).find(key => key.toLowerCase() === lowerField);
    if (matchedKey) return labels[matchedKey];
    return field.split(/(?=[A-Z])/).join(' ').replace(/^./, str => str.toUpperCase());
  };

  const renderMethodDetails = (method: UserPaymentMethod) => {
    const theme = getTheme(method.method?.name);
    return (
      <div className="space-y-1 border-l-2 pl-3" style={{ borderColor: theme.main }}>
        {Object.entries(method.data).map(([key, value]) => (
          <div key={key} className="text-sm">
            <span className="font-semibold" style={{ color: theme.main }}>
              {getFieldLabel(key)}:
            </span>{' '}
            <span className="text-gray-600">
              {formatFieldValue(key, value as string)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const getMethodName = (id: number) => {
    const method = userPaymentMethods.find(m => m.id === id);
    return method?.method?.name || 'este método de pago';
  };

  return (
    <div className="relative space-y-4">
      <EditPaymentMethodModal
        isOpen={!!editingMethod}
        method={editingMethod}
        onClose={() => setEditingMethod(null)}
        onSave={handleUpdatePaymentMethod}
      />
      <ConfirmModal
        isOpen={methodToDelete !== null}
        onClose={() => setMethodToDelete(null)}
        onConfirm={() => methodToDelete && handleDelete(methodToDelete)}
        title="Eliminar método de pago"
        message={`¿Estás seguro de que deseas eliminar ${methodToDelete ? getMethodName(methodToDelete) : 'este método de pago'}?`}
        confirmText="Eliminar"
        confirmColor="bg-red-600 hover:bg-red-700"
      />
      <Card className="w-full border-none shadow-lg overflow-hidden">
        <CardHeader className="bg-white border-b border-gray-50">
          <CardTitle className="text-xl font-bold text-gray-800">Mis métodos de pago</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {userPaymentMethods.length === 0 ? (
            <div className="text-center py-12 text-gray-500 font-medium">
              No hay métodos de pago registrados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Método</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Detalles</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {userPaymentMethods.map((method) => {
                    const theme = getTheme(method.method?.name);
                    return (
                      <tr 
                        key={method.id} 
                        className="transition-colors duration-200"
                        style={{ backgroundColor: theme.light }} // FONDO DIFUMINADO
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                              style={{ backgroundColor: theme.main }}
                            >
                              {theme.icon}
                            </div>
                            <span className="font-bold text-gray-900">{method.method?.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {renderMethodDetails(method)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => setEditingMethod(method)}
                              className="text-blue-500 hover:bg-white/50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="text-red-500 hover:bg-white/50"
                              onClick={() => setMethodToDelete(method.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}