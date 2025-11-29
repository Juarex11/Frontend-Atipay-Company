import { Plus, Minus, Trash2 } from 'lucide-react';
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
  const [showAtipayConfirm, setShowAtipayConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const {
    cart,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    clearCart,
  } = useCart();

  const processPayment = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);

    try {
      // Process each product in the cart
      for (const item of cart) {
        await productService.purchaseProduct(item.id, 'atipay', item.quantity);
      }

      // Show success message
      toast({
        title: '¡Pago exitoso!',
        description: 'Tu pago con Atipay se ha procesado correctamente.',
        variant: 'default',
      });

      // Clear cart and close
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

  const confirmAtipayPayment = () => {
    setShowAtipayConfirm(false);
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
      <ConfirmModal
        isOpen={showAtipayConfirm}
        onClose={() => !isProcessing && setShowAtipayConfirm(false)}
        onConfirm={confirmAtipayPayment}
        title="Confirmar pago con Atipay"
        message={`¿Estás seguro de que deseas proceder con el pago de ${formatCurrency(getCartTotal())} usando tu saldo Atipay?`}
        confirmText={isProcessing ? 'Procesando...' : 'Confirmar pago'}
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

                <div className="bg-green-50 rounded-xl p-4 mt-4 border border-green-100">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-green-800 font-medium">Total a pagar</span>
                    <div className="flex items-center gap-2">
                      <AtipayCoin size="xs" />
                      <span className="font-bold text-xl text-green-700">{formatCurrency(getCartTotal())}</span>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <Button
                      onClick={() => setShowAtipayConfirm(true)}
                      className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-semibold"
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Procesando...' : `Pagar con Atipay`}
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
