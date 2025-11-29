import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAuthHeaders } from '@/utils/auth';
import { deleteUserPaymentMethod, updateUserPaymentMethod, type UpdateUserPaymentMethodDto } from '@/services/userPaymentMethodService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

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
      // Convert all values to strings for the form
      const stringifiedData = Object.entries(method.data).reduce((acc, [key, value]) => {
        acc[key] = value !== null && value !== undefined ? String(value) : '';
        return acc;
      }, {} as Record<string, string>);
      setFormData(stringifiedData);
    }
  }, [method]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!method) return;

    try {
      setIsSaving(true);
      await onSave(method.id, {
        payment_method_id: method.payment_method_id,
        data: formData
      });
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
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="h-10 px-4 py-2"
            >
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

  const fetchPaymentMethods = useCallback(async () => {
    try {
      setIsLoading(true);
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

  // Fetch user payment methods on component mount
  useEffect(() => {
    fetchPaymentMethods();

    // Expose refresh function to parent
    window.refreshPaymentMethods = fetchPaymentMethods;

    return () => {
      delete window.refreshPaymentMethods;
    };
  }, [fetchPaymentMethods]);

  // Handle payment method deletion
  const handleDelete = async (id: number) => {
    try {
      await deleteUserPaymentMethod(id);

      // Update the list after successful deletion
      setUserPaymentMethods(prev => prev.filter(method => method.id !== id));
      setMethodToDelete(null);
      toast.success('Método de pago eliminado correctamente');
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el método de pago');
    }
  };

  // Handle update payment method
  const handleUpdatePaymentMethod = async (id: number, data: Omit<UpdateUserPaymentMethodDto, 'id'>) => {
    try {
      const updatedMethod = await updateUserPaymentMethod(id, data);
      setUserPaymentMethods(prev =>
        prev.map(method => method.id === id ? updatedMethod : method)
      );
      toast.success('Método de pago actualizado correctamente');
    } catch (error) {
      console.error('Error updating payment method:', error);
      throw error; // Re-throw to be handled by the modal
    }
  };

  // Format field values for display
  const formatFieldValue = (_field: string, value: string | number | boolean | null | undefined): string => {
    if (value === undefined || value === null || value === '') return '-';
    return String(value);
  };

  // Format field labels for display
  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      'numero': 'Número',
      'numerocuenta': 'Número de Cuenta',
      'cuenta': 'Número de Cuenta',
      'titular': 'Titular',
      'nombretitular': 'Titular',
      'banco': 'Banco',
      'bancodestino': 'Banco',
      'cci': 'Número de CCI',
      'numerocci': 'Número de CCI',
      'telefono': 'Teléfono',
      'celular': 'Teléfono',
      'email': 'Correo Electrónico',
      'correo': 'Correo Electrónico',
      'nombres': 'Nombres Completos',
      'apellidos': 'Apellidos',
      'dni': 'DNI',
      'ruc': 'RUC',
      'direccion': 'Dirección',
      'ciudad': 'Ciudad',
      'pais': 'País',
      'moneda': 'Moneda',
      'tipocuenta': 'Tipo de Cuenta',
    };

    // Check for case-insensitive match
    const lowerField = field.toLowerCase();
    const matchedKey = Object.keys(labels).find(key => key.toLowerCase() === lowerField);

    if (matchedKey) {
      return labels[matchedKey];
    }

    // Format the field name if no match found
    return field
      .split(/(?=[A-Z])/)
      .join(' ')
      .replace(/^./, str => str.toUpperCase());
  };

  // Render method details in a clean format
  const renderMethodDetails = (method: UserPaymentMethod) => {
    return (
      <div className="space-y-2">
        {Object.entries(method.data).map(([key, value]) => (
          <div key={key} className="text-sm">
            <span className="font-medium text-gray-900">
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
    <div className="relative">
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
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Mis métodos de pago</CardTitle>
        </CardHeader>
        <CardContent>
          {userPaymentMethods.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay métodos de pago registrados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Método
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detalles
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userPaymentMethods.map((method) => (
                    <tr key={method.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {method.method?.name || 'Método desconocido'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {renderMethodDetails(method)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-2">
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingMethod(method)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMethodToDelete(method.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
