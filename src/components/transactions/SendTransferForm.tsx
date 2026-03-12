import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createTransfer } from '@/services/transferService';
import type { Transfer } from '@/services/transferService';
import { Loader2, Check, X, Clock, Search } from 'lucide-react';
import { formatCurrency } from '@/utils/transactionUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Interfaces
interface SendTransferFormProps {
  availableBalance: number;
  onTransferComplete: () => void;
}

interface User {
  id: number;
  username: string;
  email: string;
  phone_number: string;
  reference_code: string;
  status?: string;
  role?: string;
}

interface FormValues {
  receiverId: number | null;
  amount: number;
  username: string;
}

// Componente separado para mostrar el resultado de la transferencia
const TransferResultDisplay = ({ transfer }: { transfer: Transfer }) => {
  // Si no hay un estado definido, asumimos que está pendiente
  const status = transfer.status || 'pending';

  // Funciones de ayuda para presentación del estado
  const getStatusColor = (status: string): string => {
    if (status === 'not_evaluated' || status === 'pending') return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    if (status === 'approved') return 'bg-green-50 border-green-200 text-green-800';
    return 'bg-red-50 border-red-200 text-red-800';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'not_evaluated' || status === 'pending') return <Clock className="h-4 w-4 text-yellow-500" />;
    if (status === 'approved') return <Check className="h-4 w-4 text-green-500" />;
    return <X className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = (status: string): string => {
    if (status === 'not_evaluated') return 'En espera de evaluación';
    if (status === 'pending') return 'Pendiente';
    if (status === 'approved') return 'Aprobada';
    return 'Rechazada';
  };

  // Verificar si el monto es un número válido
  const amount = isNaN(Number(transfer.amount)) ? 0 : Number(transfer.amount);

  return (
    <div className="mt-4">
      <Alert className={`border ${getStatusColor(status)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getStatusIcon(status)}
            <div className="ml-2">
              <h4 className="font-semibold text-sm">
                Transferencia {getStatusText(status)}
              </h4>
              <AlertDescription>
                <div className="text-xs mt-1 space-y-1">
                  <p>Monto: {formatCurrency(amount)}</p>
                  {transfer.receiver_id && <p>Destinatario ID: {transfer.receiver_id}</p>}
                  {transfer.id && <p>ID: {transfer.id}</p>}
                  {status === 'pending' && (
                    <p className="text-yellow-600 mt-1">
                      La transferencia está siendo procesada. Por favor espera la confirmación.
                    </p>
                  )}
                </div>
              </AlertDescription>
            </div>
          </div>
          {transfer.id && <Badge variant="outline">{`ID: ${transfer.id}`}</Badge>}
        </div>
      </Alert>
    </div>
  );
};

export const SendTransferForm = ({ availableBalance, onTransferComplete }: SendTransferFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [transferResult, setTransferResult] = useState<Transfer | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      receiverId: null,
      amount: undefined,
      username: ''
    }
  });

  const watchAmount = watch('amount') || 0;
  const watchUsername = watch('username');
  const remainingBalance = availableBalance - watchAmount;

  const searchUser = async () => {
    const searchTerm = watchUsername.trim();
    if (!searchTerm) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un nombre de usuario, correo o teléfono',
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.');
      }

      // Intentar buscar por username, email o teléfono
      const response = await fetch(`https://api.atipaycompany.com/api/partners/find/${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No autorizado. Por favor, inicia sesión nuevamente.');
        } else if (response.status === 404) {
          throw new Error('No se encontró ningún usuario con los datos proporcionados');
        } else {
          throw new Error('Error al buscar el usuario');
        }
      }

      const userData = await response.json();

      // Mapear la respuesta a la estructura esperada
      const user = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        phone_number: userData.phone_number,
        reference_code: userData.reference_code
      };

      setSelectedUser(user);
      setValue('receiverId', user.id);

      toast({
        title: 'Usuario encontrado',
        description: `Usuario ${user.username} encontrado con éxito`,
        variant: 'default',
      });

    } catch (error) {
      setSelectedUser(null);
      setValue('receiverId', null);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al buscar el usuario',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handler functions will be added if needed in the future

  // Función para manejar el envío del formulario
  const onSubmit = async (data: FormValues) => {
    if (!data.receiverId) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar un usuario',
        variant: 'destructive',
      });
      return;
    }

    if (data.amount < 20) {
      toast({
        title: 'Error',
        description: 'El monto mínimo para transferir es de 20 Atipay',
        variant: 'destructive',
      });
      return;
    }

    if (data.amount > availableBalance) {
      toast({
        title: 'Error',
        description: 'El monto excede tu saldo disponible',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setTransferResult(null);

      // Crear la transferencia
      const createdTransfer = await createTransfer({
        receiver_id: data.receiverId,
        amount: data.amount
      });

      // Guardar el resultado de la transferencia
      setTransferResult(createdTransfer);

      toast({
        title: 'Transferencia enviada',
        description: `Transferencia #${createdTransfer.id} enviada correctamente`,
        variant: 'default',
      });

      // Reset form
      reset();

      // Notify parent component
      if (onTransferComplete) {
        onTransferComplete();
      }
    } catch (error) {
      console.error('Error al enviar transferencia:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo procesar la transferencia',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Enviar transferencia</CardTitle>
          <CardDescription>
            Transfiere dinero a otro usuario de Atipay
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Mostrar resultado de transferencia si existe */}
          {transferResult && <TransferResultDisplay transfer={transferResult} />}

          <form onSubmit={handleSubmit(onSubmit)} id="transfer-form" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario destinatario</Label>
              <div className="flex space-x-2">
                <Input
                  id="username"
                  placeholder="Ingresa el nombre de usuario"
                  {...register('username', {
                    required: 'El nombre de usuario es obligatorio',
                  })}
                />
                <Button
                  type="button"
                  onClick={searchUser}
                  disabled={isSearching || !watchUsername}
                  className="bg-green-600 hover:bg-green-700 text-white border border-green-700 hover:border-green-800 rounded-r-md px-4 -ml-px transition-colors duration-200 shadow-sm"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-white" />
                  ) : (
                    <Search className="h-4 w-4 mr-2 text-white" />
                  )}
                  <span className="font-medium">Buscar</span>
                </Button>
              </div>
              {selectedUser && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{selectedUser.username}</p>
                      <p className="text-xs text-gray-500">Código: {selectedUser.reference_code}</p>
                      <p className="text-xs text-gray-500">Teléfono: {selectedUser.phone_number || 'No disponible'}</p>
                      {selectedUser.role && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                          {selectedUser.role}
                        </span>
                      )}
                    </div>
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                  </div>
                </div>
              )}
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username.message}</p>
              )}
              <input type="hidden" {...register('receiverId')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto a transferir (S/.)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('amount', {
                  required: 'El monto es obligatorio',
                  valueAsNumber: true,
                  min: {
                    value: 20,
                    message: 'El monto mínimo para transferir es de 20 Atipay'
                  },
                  validate: {
                    positive: value => value > 0 || 'El monto debe ser mayor a 0',
                    notExceedBalance: value => value <= availableBalance || 'Monto excede el saldo disponible',
                    minAmount: value => value >= 20 || 'El monto mínimo para transferir es de 20 Atipay'
                  }
                })}
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>

            <div className="rounded-lg bg-gray-50 p-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Saldo disponible:</span>
                <span className="font-medium">{formatCurrency(availableBalance)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500">Saldo restante:</span>
                <span className={`font-medium ${remainingBalance < 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {formatCurrency(remainingBalance)}
                </span>
              </div>
            </div>
          </form>
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            form="transfer-form"
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              'Enviar transferencia'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
