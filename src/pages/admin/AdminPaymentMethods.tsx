/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Trash2 } from 'lucide-react';
import {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  type PaymentMethod
} from '../../services/paymentMethodService';
import UserPaymentMethods from '@/components/admin/UserPaymentMethods';

const METHOD_THEMES: Record<string, { main: string; light: string; border: string }> = {
  yape: { main: '#742284', light: 'rgba(116, 34, 132, 0.08)', border: '#742284' },
  plin: { main: '#00bfa5', light: 'rgba(0, 191, 165, 0.08)', border: '#00bfa5' },
  'transferencia bancaria': { main: '#004b98', light: 'rgba(0, 75, 152, 0.08)', border: '#004b98' },
  'bonificación': { main: '#f59e0b', light: 'rgba(245, 158, 11, 0.08)', border: '#f59e0b' },
};

export default function AdminPaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMethod, setCurrentMethod] = useState<PaymentMethod | null>(null);
  const [fields, setFields] = useState<string[]>(['']);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<number | null>(null);
  const [selectedMethodId, setSelectedMethodId] = useState<number | ''>('');
  const [formFields, setFormFields] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentMethod) {
      setFields(currentMethod.fields.length > 0 ? currentMethod.fields : ['']);
    } else {
      setFields(['']);
    }
  }, [currentMethod]);

  const fetchPaymentMethods = async () => {
    try {
      setError(null);
      const methods = await getPaymentMethods();
      setPaymentMethods(methods);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar los métodos de pago';
      setError(`Error: ${errorMessage}. Por favor, recarga la página.`);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
    
    // Check mount status cleanup
    const timer = setTimeout(() => {
      // Component mount check logic remains, just removed console.log
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleMethodSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const methodId = Number(e.target.value);
    setSelectedMethodId(methodId);

    if (methodId) {
      const selected = paymentMethods.find(m => m.id === methodId);
      if (selected) {
        // Initialize form fields with empty values
        const fields = selected.fields.reduce((acc, field) => {
          acc[field] = '';
          return acc;
        }, {} as Record<string, string>);
        setFormFields(fields);
      }
    } else {
      setFormFields({});
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUserPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethodId) return;

    try {
      // Show loading toast
      const loadingToast = toast.loading('Guardando información del método de pago...');

      // Import the service function to create user payment method
      const { createUserPaymentMethod } = await import('@/services/userPaymentMethodService');

      // Call the API to save the user's payment method
      await createUserPaymentMethod({
        payment_method_id: selectedMethodId as number,
        data: formFields
      });

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success('Información del método de pago guardada exitosamente');

      // Reset form
      setSelectedMethodId('');
      setFormFields({});

      // Refresh the user's payment methods using the window function
      if (window.refreshPaymentMethods) {
        window.refreshPaymentMethods();
      }
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar el método de pago');
    }
  };

  const handleSave = async (method: Omit<PaymentMethod, 'id'>) => {
    try {
      if (currentMethod?.id) {
        await updatePaymentMethod(currentMethod.id, method);
      } else {
        await createPaymentMethod(method);
      }
      await fetchPaymentMethods();
      setIsModalOpen(false);
      setCurrentMethod(null);
    } catch (err) {
      setError('Error al guardar el método de pago');
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!methodToDelete) return;

    try {
      await deletePaymentMethod(methodToDelete);
      await fetchPaymentMethods();
      setIsDeleteModalOpen(false);
      setMethodToDelete(null);
    } catch (err) {
      setError('Error al eliminar el método de pago');
      console.error(err);
    }
  };

  const openEditModal = (method: PaymentMethod) => {
    setCurrentMethod(method);
    setIsModalOpen(true);
  };

  const openDeleteModal = (id: number) => {
    setMethodToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    width: '90%',
    maxWidth: '500px'
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999
  };

  return (
    <div className="container mx-auto p-6" data-testid="admin-payment-methods">
      <h1 className="text-2xl font-bold mb-6">Gestión de Pagos</h1>

      <Tabs defaultValue="payment-methods" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
          <TabsTrigger value="payment-methods">Métodos de Pago</TabsTrigger>
          <TabsTrigger value="user-payment-methods">Mi Información</TabsTrigger>
        </TabsList>

        <TabsContent value="payment-methods">
  {error && (
    <div className="bg-red-100 border-l-4 border-red-600 text-red-800 p-3 rounded-md mb-5">
      <p className="m-0">{error}</p>
    </div>
  )}
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-xl font-semibold">Configuración de Métodos de Pago</h2>
    <button
      onClick={() => {
        setCurrentMethod(null);
        setIsModalOpen(true);
      }}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
    >
      Agregar Método
    </button>
  </div>
  <div className="shadow rounded-lg overflow-hidden">
    <table className="w-full border-collapse">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
            Nombre
          </th>
          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
            Campos
          </th>
          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">
            Acciones
          </th>
        </tr>
      </thead>
      <tbody className="bg-white">
        {paymentMethods.map((method) => (
          <tr key={method.id} className="hover:bg-gray-50">
            <td className="p-4 border-b border-gray-200 text-gray-900 font-medium">
              {method.name}
            </td>
            <td className="p-4 border-b border-gray-200 text-gray-500">
              {method.fields.join(', ')}
            </td>
            <td className="p-4 border-b border-gray-200 text-right">
              {/* --- AQUÍ LA CORRECCIÓN --- */}
              <button
                onClick={() => openEditModal(method)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-blue-600 hover:text-blue-900 mr-4"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => openDeleteModal(method.id!)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-red-600 hover:text-red-900"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              {/* --- FIN DE LA CORRECCIÓN --- */}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</TabsContent>

        <TabsContent value="user-payment-methods">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Agregar Información de Método de Pago</h2>
            </div>

            <div
              className="transition-all duration-500 ease-in-out rounded-lg p-6"
              style={{
                backgroundColor: selectedMethodId ? METHOD_THEMES[paymentMethods.find(m => m.id === selectedMethodId)?.name.toLowerCase() || '']?.light || 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                borderLeft: selectedMethodId ? `6px solid ${METHOD_THEMES[paymentMethods.find(m => m.id === selectedMethodId)?.name.toLowerCase() || '']?.main || '#ccc'}` : '6px solid #ccc'
              }}
            >
              <form onSubmit={handleUserPaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seleccionar Método de Pago
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={selectedMethodId}
                    onChange={handleMethodSelect}
                  >
                    <option value="" disabled>Seleccione un método</option>
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedMethodId && (
                  <div className="space-y-4 border-t pt-4 mt-4">
                    <h3 className="font-medium" style={{ color: METHOD_THEMES[paymentMethods.find(m => m.id === selectedMethodId)?.name.toLowerCase() || '']?.main || '#000' }}>
                      {paymentMethods.find(m => m.id === selectedMethodId)?.name} - Información Requerida
                    </h3>
                    {paymentMethods
                      .find(m => m.id === selectedMethodId)
                      ?.fields.map((field) => {
                        // Format the display name
                        const fieldDisplayName = field.split('_')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');

                        // Determine input type based on field name
                        let inputType = "text";
                        let pattern = undefined;

                        if (field.toLowerCase().includes('numero') ||
                          field.toLowerCase().includes('telefono') ||
                          field.toLowerCase().includes('celular')) {
                          inputType = "tel";
                          pattern = "[0-9]*";
                        } else if (field.toLowerCase().includes('email') ||
                          field.toLowerCase().includes('correo')) {
                          inputType = "email";
                        }

                        return (
                          <div key={field}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {fieldDisplayName}
                            </label>
                            <input
                              type={inputType}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              value={formFields[field] || ''}
                              onChange={(e) => handleFieldChange(field, e.target.value)}
                              placeholder={`Ingrese ${fieldDisplayName}`}
                              pattern={pattern}
                              required
                            />
                          </div>
                        );
                      })}
                  </div>
                )}

                {selectedMethodId && (
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMethodId('');
                        setFormFields({});
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Guardar Método
                    </button>
                  </div>
                )}
              </form>
            </div>

            <div className="mt-8">
              <UserPaymentMethods />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <>
          <div style={overlayStyle} onClick={() => setIsModalOpen(false)} />
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                {currentMethod ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6B7280'
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              const nonEmptyFields = fields.filter(field => field.trim() !== '');

              if (nonEmptyFields.length === 0) {
                toast.error('Por favor, agrega al menos un campo');
                return;
              }

              handleSave({
                name,
                fields: nonEmptyFields
              });
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Nombre del método<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={currentMethod?.name || ''}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Campos del método de pago<span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFields([...fields, ''])}
                    style={{
                      background: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>+</span> Agregar campo
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {fields.map((field, index) => (
                    <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={field}
                        onChange={(e) => {
                          const newFields = [...fields];
                          newFields[index] = e.target.value;
                          setFields(newFields);
                        }}
                        placeholder={`Campo ${index + 1}`}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newFields = [...fields];
                            newFields.splice(index, 1);
                            setFields(newFields);
                          }}
                          style={{
                            background: '#FEE2E2',
                            color: '#DC2626',
                            border: 'none',
                            borderRadius: '4px',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                          title="Eliminar campo"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    background: 'white',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#4F46E5',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {currentMethod ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && methodToDelete && (
        <>
          <div style={overlayStyle} onClick={() => setIsDeleteModalOpen(false)} />
          <div style={modalStyle}>
            <h2 style={{ marginTop: 0, fontSize: '20px', fontWeight: '600' }}>
              Eliminar método de pago
            </h2>
            <p>¿Estás seguro de que deseas eliminar este método de pago? Esta acción no se puede deshacer.</p>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '24px'
            }}>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setMethodToDelete(null);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  background: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  handleDelete();
                  setIsDeleteModalOpen(false);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#DC2626',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
