import { Plus, Minus, Trash2, CreditCard, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCart } from '@/hooks/useCart';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { productService } from '@/services/productService';
import { useToast } from '@/components/ui/use-toast';
import { AtipayCoin } from '@/components/ui/AtipayCoin';

interface CartProps {
  readonly isOpen: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function Cart({ isOpen, onOpenChange }: CartProps) {
  const [paymentMethod, setPaymentMethod] = useState<'atipay' | 'deposit'>('atipay');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [acceptedDepositTerms, setAcceptedDepositTerms] = useState(false);

  const { toast } = useToast();

  const {
    cart,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    clearCart,
  } = useCart();

  // --- INICIO DE MODIFICACIÓN: RF-07 Puntos Totales ---
  const getCartPointsEarned = () => {
    return cart.reduce((totalPoints, item) => {
      const itemPoints = item.pointsEarned ? item.pointsEarned : 0;
      return totalPoints + itemPoints * item.quantity;
    }, 0);
  }

  const totalPointsEarned = getCartPointsEarned();
  // --- FIN DE MODIFICACIÓN: RF-07 Puntos Totales ---

  // Datos bancarios editables
  const bankInfo = {
    bank: "BCP - Banco de Crédito del Perú",
    accountType: "Cuenta de Ahorros",
    accountNumber: "123-45678901-0-12",
    cci: "00212300456789012345",
    holder: "DIEGO RAMOS",
    document: "DNI 12345678",
  };

  const processPayment = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);

    try {
      for (const item of cart) {
        await productService.purchaseProduct(item.id, paymentMethod, item.quantity);
      }

      const successMsg =
        paymentMethod === 'atipay'
          ? 'Tu pago con Atipay se ha procesado correctamente.'
          : 'Tu solicitud de compra por depósito ha sido creada. Por favor, sube el comprobante en tu historial de compras.';

      toast({
        title: '¡Solicitud creada!',
        description: successMsg,
        variant: 'default',
      });

      clearCart();
      onOpenChange(false);

    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Ocurrió un error al procesar el pago',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmPayment = () => {
    setShowConfirm(false);
    processPayment();
  };

  const handleQuantityChange = (productId: string, change: number) => {
    const item = cart.find(item => item.id === productId);
    if (item) {
      updateQuantity(productId, item.quantity + change);
    }
  };

  return (
    <>
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => !isProcessing && setShowConfirm(false)}
        onConfirm={confirmPayment}
        title={paymentMethod === 'atipay' ? 'Confirmar pago con Atipay' : 'Confirmar solicitud de compra por depósito'}
        message={
          paymentMethod === 'atipay'
            ? `¿Estás seguro de que deseas proceder con el pago de ${formatCurrency(getCartTotal())} usando tu saldo Atipay?`
            : `¿Deseas crear una solicitud de compra por depósito por ${formatCurrency(getCartTotal())}? Luego deberás subir el comprobante.`
        }
        confirmText={isProcessing ? 'Procesando...' : 'Confirmar'}
        cancelText="Cancelar"
        confirmColor="bg-green-600 hover:bg-green-700"
        isConfirmDisabled={isProcessing}
      />

      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-white">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl font-semibold text-green-800">Carrito de compras</SheetTitle>
          </SheetHeader>

          <div className="py-4 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Tu carrito está vacío</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => onOpenChange(false)}
                >
                  Seguir comprando
                </Button>
              </div>
            ) : (
              <>
                {/* Items */}
                <div className="space-y-4 bg-white">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-green-50 transition-colors">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 border-green-100 bg-white">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-medium text-green-900">{item.name}</h3>
                          <p className="font-semibold text-green-700">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-600 mt-1">
                          <AtipayCoin size="xs" />
                          <span className="text-green-700">{formatCurrency(item.price)} unidad</span>
                        </div>

                        {/* --- INICIO DE MODIFICACIÓN: Puntos Ganados por Producto --- */}
                        {item.pointsEarned && item.pointsEarned > 0 && (
                          <div className="flex items-center gap-2 text-xs text-yellow-600">
                            <svg className="w-3.5 h-3.5 fill-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26l6.91 1l-5 4.86l1.18 6.88l-6.18-3.25l-6.18 3.25l1.18-6.88l-5-4.86l6.91-1z" fill="currentColor"/>
                            </svg>
                            <span className="font-semibold text-yellow-700">
                              Ganas: {item.pointsEarned * item.quantity} Puntos
                            </span>
                          </div>
                        )}
                        {/* --- FIN DE MODIFICACIÓN: Puntos Ganados por Producto --- */}

                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-green-200 hover:bg-green-50 text-green-700"
                            onClick={() => handleQuantityChange(item.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center text-green-900 font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-green-200 hover:bg-green-50 text-green-700"
                            onClick={() => handleQuantityChange(item.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto h-8 w-8 text-green-400 hover:bg-red-50 hover:text-red-500"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="bg-green-50 rounded-xl p-4 mt-4 border border-green-100">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-green-800 font-medium">Total a pagar</span>
                    <div className="flex items-center gap-2">
                      <AtipayCoin size="xs" />
                      <span className="font-bold text-xl text-green-700">{formatCurrency(getCartTotal())}</span>
                    </div>
                  </div>

                  {/* --- INICIO DE MODIFICACIÓN: RF-07 Puntos Ganados --- */}
                  {totalPointsEarned > 0 && (
                    <div className="flex justify-between items-center py-2 border-t border-green-200/50">
                      <span className="text-green-800 font-medium flex items-center gap-1">
                        Puntos que ganarás
                      </span>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-5 h-5 text-yellow-600 fill-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26l6.91 1l-5 4.86l1.18 6.88l-6.18-3.25l-6.18 3.25l1.18-6.88l-5-4.86l6.91-1z" fill="currentColor"/>
                        </svg>
                        <span className="font-bold text-xl text-yellow-700">
                          {totalPointsEarned.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                  {/* --- FIN DE MODIFICACIÓN: RF-07 Puntos Ganados --- */}

                  {/* Payment Method */}
                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-medium text-green-800">Método de pago</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => setPaymentMethod('atipay')}
                        className={`h-10 text-sm font-medium transition-colors ${
                          paymentMethod === 'atipay'
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Atipay
                      </Button>
                      <Button
                        onClick={() => setPaymentMethod('deposit')}
                        className={`h-10 text-sm font-medium transition-colors ${
                          paymentMethod === 'deposit'
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <Banknote className="h-4 w-4 mr-2" />
                        Depósito
                      </Button>
                    </div>

                    {/* Deposit Information Block */}
                    {paymentMethod === 'deposit' && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">

                        <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                          <Banknote className="w-4 h-4" />
                          Pago por Depósito Bancario
                        </h3>

                        <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                          <h4 className="text-xs font-semibold text-blue-800 mb-2">Datos de la cuenta</h4>

                          <div className="text-xs text-blue-900 space-y-1">
                            <p><strong>Banco:</strong> {bankInfo.bank}</p>
                            <p><strong>Tipo de cuenta:</strong> {bankInfo.accountType}</p>
                            <p><strong>N° de cuenta:</strong> {bankInfo.accountNumber}</p>
                            <p><strong>CCI:</strong> {bankInfo.cci}</p>
                            <p><strong>Titular:</strong> {bankInfo.holder}</p>
                            <p><strong>Documento:</strong> {bankInfo.document}</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-blue-800 mb-1">Antes de continuar, recuerda:</h4>
                          <ul className="text-xs text-blue-800 space-y-2">
                            <li>• Se generará una <strong>solicitud de compra pendiente</strong>.</li>
                            <li>• Tienes <strong>24 horas</strong> para subir tu comprobante.</li>
                            <li>• Si no lo subes, la solicitud <strong>expira automáticamente</strong>.</li>
                            <li>• El comprobante será revisado en máximo <strong>24 horas</strong>.</li>
                            <li>• Si se rechaza, podrás subir otro desde tu historial.</li>
                            <li>• Formatos permitidos: <strong>JPG, PNG, PDF</strong>. Máx: <strong>5MB</strong>.</li>
                          </ul>
                        </div>

                        <div className="text-xs text-blue-700 bg-blue-100 border border-blue-300 p-2 rounded-lg">
                          📌 Consejo: asegúrate de que el comprobante sea claro, legible y muestre el monto exacto.
                        </div>

                        <label className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600"
                            checked={acceptedDepositTerms}
                            onChange={(e) => setAcceptedDepositTerms(e.target.checked)}
                          />
                          <span className="text-xs text-blue-900">
                            He leído y entiendo el proceso del pago por depósito.
                          </span>
                        </label>
                      </div>
                    )}

                    {/* Payment Button */}
                    <Button
                      onClick={() => setShowConfirm(true)}
                      className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-semibold"
                      disabled={
                        isProcessing ||
                        (paymentMethod === 'deposit' && !acceptedDepositTerms)
                      }
                    >
                      {isProcessing ? 'Procesando...' : `Continuar con ${paymentMethod === 'atipay' ? 'Atipay' : 'Depósito'}`}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full text-green-600 hover:bg-white border-green-200 hover:border-green-300 h-11"
                      onClick={clearCart}
                    >
                      Vaciar carrito
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
