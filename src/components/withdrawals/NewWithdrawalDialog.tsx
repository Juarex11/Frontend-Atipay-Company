import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { withdrawalService, type CreateWithdrawalData, type Withdrawal } from '@/services/withdrawalService';
import { useUserBalance } from '@/hooks/useUserBalance';
import { formatCurrency } from '@/lib/utils';

interface NewWithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (withdrawal: Withdrawal) => void;
}

export function NewWithdrawalDialog({ open, onOpenChange, onSuccess }: Readonly<NewWithdrawalDialogProps>) {
  // Available withdrawal methods with their display names and input types
  const withdrawalMethods = [
    { id: 'yape', name: 'Yape', type: 'phone' },
    { id: 'plin', name: 'Plin', type: 'phone' },
    { id: 'transferencia_electronica', name: 'Transferencia Electrónica', type: 'account' },
    { id: 'transferencia_bancaria', name: 'Transferencia Bancaria', type: 'account' },
  ];

  const [formData, setFormData] = useState<Omit<CreateWithdrawalData, 'phone_number' | 'account_number'> & {
    reference_code: string;
    confirmReference: string;
  }>({
    amount: undefined as unknown as number,
    method: 'yape',
    reference_code: '',
    confirmReference: '',
    holder: ''
  });

  // Get current method details
  const currentMethod = withdrawalMethods.find(m => m.id === formData.method) || withdrawalMethods[0];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { balance, loading: balanceLoading } = useUserBalance();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      const numValue = parseFloat(value);
      // Only update if it's a valid number and not negative
      if (!isNaN(numValue) && numValue >= 0) {
        setFormData(prev => ({
          ...prev,
          [name]: numValue,
        }));
      } else if (value === '') {
        // Allow empty input for better UX when deleting the value
        setFormData(prev => ({
          ...prev,
          [name]: undefined as unknown as number,
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };


  const validateAmount = (amount: number | undefined): boolean => {
    if (!amount || amount <= 0) {
      toast({
        title: 'Error',
        description: 'El monto debe ser mayor a 0',
        variant: 'destructive',
      });
      return false;
    }

    // Validar monto mínimo de retiro
    if (amount < 20) {
      toast({
        title: 'Error',
        description: 'El monto mínimo para retirar es de S/20.00',
        variant: 'destructive',
      });
      return false;
    }

    // Validar si el usuario tiene saldo suficiente
    if (balance !== undefined && amount > balance) {
      toast({
        title: 'Saldo insuficiente',
        description: `No tienes saldo suficiente. Tu saldo actual es de $${formatCurrency(balance)}`,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const validateReferenceCode = (referenceCode: string, method: string): boolean => {
    if (!referenceCode) {
      toast({
        title: 'Error',
        description: `Por favor ingresa el número de ${method === 'yape' || method === 'plin' ? 'celular' : 'cuenta'}`,
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const validateReferenceMatch = (reference: string, confirmReference: string, method: string): boolean => {
    if (reference !== confirmReference) {
      toast({
        title: 'Error',
        description: `Los ${method === 'yape' || method === 'plin' ? 'números de celular' : 'números de cuenta'} no coinciden`,
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  // Helper functions for labels
  const getReferenceLabel = (): string => {
    return currentMethod.type === 'phone' ? 'Número de celular' : 'Número de cuenta';
  };

  const getConfirmReferenceLabel = (): string => {
    return currentMethod.type === 'phone' ? 'número de celular' : 'número de cuenta';
  };

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    const phoneRegex = /^9\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un número de celular válido (9 dígitos, empezando con 9)',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setFormData({
      amount: undefined as unknown as number,
      method: 'yape',
      reference_code: '',
      confirmReference: '',
      holder: '',
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Ensure amount is a number and meets minimum requirement
      const amount = Number(formData.amount);
      if (isNaN(amount) || amount < 20) {
        toast({
          title: 'Error',
          description: 'El monto mínimo para retirar es de S/20.00',
          variant: 'destructive',
        });
        return;
      }
      
      if (!validateAmount(amount)) return;
      if (!validateReferenceCode(formData.reference_code, formData.method)) return;
      if (!validateReferenceMatch(formData.reference_code, formData.confirmReference, formData.method)) return;

      // Validate phone number format for Yape/Plin
      const isPhoneMethod = currentMethod.type === 'phone';
      if (isPhoneMethod && !validatePhoneNumber(formData.reference_code)) return;

      // Prepare the data to send
      const submissionData: CreateWithdrawalData & { metadata: Record<string, unknown> } = {
        amount: Number(formData.amount),
        method: formData.method,
        holder: formData.holder.trim(),
        metadata: {}
      };

      // Add payment method specific data
      if (isPhoneMethod) {
        submissionData.phone_number = formData.reference_code.trim();
      } else {
        // For transfer methods, use account_number
        submissionData.account_number = formData.reference_code.trim();
      }

      console.log('Submitting withdrawal with data:', submissionData);
      const newWithdrawal = await withdrawalService.createWithdrawal(submissionData);
      onSuccess(newWithdrawal);
      resetForm();
      onOpenChange(false);

      toast({
        title: 'Solicitud creada',
        description: 'Tu solicitud de retiro ha sido registrada exitosamente',
      });
    } catch (error: unknown) {
      console.error('Error creating withdrawal:', error);

      // Format the error message to be more user-friendly
      let errorMessage = (error as Error)?.message || 'No se pudo crear la solicitud de retiro';

      // If the error is about the phone number, make it more specific
      if ((error as Error)?.message?.includes('número de celular')) {
        errorMessage = 'Por favor ingresa un número de celular válido (9 dígitos, empezando con 9)';
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-y-auto max-h-[90vh] bg-transparent border-0 shadow-none">
        <div className="bg-white rounded-t-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-green-600 mb-1 text-center">
              Retirar Fondos
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm text-center">
              Ingresa los detalles para realizar tu retiro
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Amount Input */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Monto a retirar
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">S/</span>
                </div>
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  value={formData.amount || ''}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 bg-white rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-0 transition-colors text-lg font-medium"
                  placeholder="20.00"
                  min="20"
                  step="0.01"
                  required
                />
              </div>
              {/* Mostrar saldo disponible */}
              <div className="mt-1 text-xs text-gray-500">
                Monto mínimo: S/ 20.00
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {balanceLoading ? (
                  <span className="text-gray-400">Cargando saldo...</span>
                ) : balance !== undefined ? (
                  <span className="text-green-600">
                    Saldo disponible: S/ {formatCurrency(balance)}
                  </span>
                ) : (
                  <span className="text-red-500">No se pudo cargar el saldo</span>
                )}
              </div>
            </div>

            {/* Holder Name */}
            <div>
              <label htmlFor="holder" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del titular
              </label>
              <input
                type="text"
                name="holder"
                id="holder"
                value={formData.holder || ''}
                onChange={handleInputChange}
                className="block w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-0 transition-colors"
                placeholder="Nombre completo del titular"
                required
              />
            </div>

            {/* Payment Method */}
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">
                Método de retiro
              </span>
              <div className="grid grid-cols-3 gap-2">
                {withdrawalMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      method: method.id as 'yape' | 'plin' | 'bcp' | 'interbank' | 'bbva' | 'other' | 'transferencia_electronica',
                      reference_code: '',
                      confirmReference: ''
                    }))}
                    className={`py-2 px-3 rounded-lg border-2 transition-all text-sm font-medium ${formData.method === method.id
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    {method.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Reference Number - Single field that changes based on method */}
            <div>
              <label htmlFor="reference_code" className="block text-sm font-medium text-gray-700 mb-1">
                {getReferenceLabel()}
              </label>
              <input
                type="text"
                name="reference_code"
                id="reference_code"
                value={formData.reference_code}
                onChange={handleInputChange}
                className="block w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-0 transition-colors"
                placeholder={currentMethod.type === 'phone' ? '912345678' : 'Número de cuenta'}
                required
              />
            </div>

            {/* Confirm Reference */}
            <div>
              <label htmlFor="confirmReference" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar {getConfirmReferenceLabel()}
              </label>
              <input
                type="text"
                name="confirmReference"
                id="confirmReference"
                value={formData.confirmReference}
                onChange={handleInputChange}
                className="block w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-0 transition-colors"
                placeholder={currentMethod.type === 'phone' ? '912345678' : 'Número de cuenta'}
                required
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                    Procesando...
                  </>
                ) : (
                  <span className="font-medium text-lg">Solicitar Retiro</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
