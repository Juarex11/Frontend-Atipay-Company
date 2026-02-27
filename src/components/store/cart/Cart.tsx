import { Plus, Minus, Trash2, CreditCard, Banknote, RefreshCw, User, Phone, Info, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { productService } from "@/services/productService";
import { useToast } from "@/components/ui/use-toast";
import { AtipayCoin } from "@/components/ui/AtipayCoin";
import { DepositService } from '@/services/depositService';

interface CartProps {
  readonly isOpen: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

// Interfaz para los datos del estado
interface DepositInfoData {
  bankInfo: string;
  bankDescription: string;
  adminName: string;
  adminPhone: string;
  adminEmail: string;
}

export function Cart({ isOpen, onOpenChange }: CartProps) {
  const [paymentMethod, setPaymentMethod] = useState<"atipay" | "deposit">("atipay");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [acceptedDepositTerms, setAcceptedDepositTerms] = useState(false);

  const { toast } = useToast();
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  const [depositData, setDepositData] = useState<DepositInfoData | null>(null);
  const [loadingBankInfo, setLoadingBankInfo] = useState(false);

  // --- LÓGICA DE PUNTOS (RF-07) ---
  const getCartPointsEarned = () => {
    return cart.reduce((totalPoints, item) => {
      const itemPoints = item.pointsEarned ? item.pointsEarned : 0;
      return totalPoints + itemPoints * item.quantity;
    }, 0);
  }

  const totalPointsEarned = getCartPointsEarned();
  
  // --- LÓGICA DE BANCO DINÁMICA (Del Main) ---
  useEffect(() => {
    if (paymentMethod === 'deposit') {
      const fetchBankInfo = async () => {
        setLoadingBankInfo(true);
        try {
          const response = await DepositService.getBankInfo();
          
          // Manejo seguro de la respuesta de la API
          let dataToUse: any = response;
          
          if (response && response.data) {
             dataToUse = response.data;
          }

          // Verificamos si es string (fallback) o objeto
          if (typeof dataToUse === 'string') {
             setDepositData({
               bankInfo: dataToUse,
               bankDescription: "Cuenta para depósitos",
               adminName: "Milenco Carhuamaca",
               adminPhone: "906289965",
               adminEmail: "milencogicglobal@gmail.com"
             });
          } else {
             // Asignación segura
             setDepositData({
               bankInfo: dataToUse.bank_info || "No hay información configurada.",
               bankDescription: dataToUse.bank_description || "Información de Pago",
               adminName: dataToUse.admin_name || "Administrador",
               adminPhone: dataToUse.admin_phone || "No disponible",
               adminEmail: dataToUse.admin_email || ""
             });
          }

        } catch (error) {
          console.error("Error cargando cuenta:", error);
          setDepositData({
            bankInfo: "Error al cargar datos.",
            bankDescription: "Error",
            adminName: "Soporte",
            adminPhone: "",
            adminEmail: ""
          });
        } finally {
          setLoadingBankInfo(false);
        }
      };
      fetchBankInfo();
    }
  }, [paymentMethod]);
  
  const processPayment = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      for (const item of cart) {
        await productService.purchaseProduct(
          item.id,
          paymentMethod,
          item.quantity
        );
      }
      const successMsg = paymentMethod === "atipay"
          ? "Tu pago con Atipay se ha procesado correctamente."
          : "Tu solicitud de compra por depósito ha sido creada.";

      toast({ title: "¡Solicitud creada!", description: successMsg, variant: "default" });
      clearCart();
      onOpenChange(false);
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Ocurrió un error", 
        variant: "destructive" 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmPayment = () => { setShowConfirm(false); processPayment(); };

  const handleQuantityChange = (productId: string, change: number) => {
    const item = cart.find((item) => item.id === productId);
    if (item) { updateQuantity(productId, item.quantity + change); }
  };

  return (
    <>
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => !isProcessing && setShowConfirm(false)}
        onConfirm={confirmPayment}
        title={paymentMethod === "atipay" ? "Confirmar pago" : "Confirmar solicitud"}
        message={paymentMethod === "atipay" 
            ? `¿Pagar ${formatCurrency(getCartTotal())} con saldo Atipay?` 
            : `¿Crear solicitud de depósito por ${formatCurrency(getCartTotal())}?`}
        confirmText={isProcessing ? "Procesando..." : "Confirmar"}
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
                <Button variant="outline" className="mt-4" onClick={() => onOpenChange(false)}>Seguir comprando</Button>
              </div>
            ) : (
              <>
                {/* Lista de productos */}
                <div className="space-y-4 bg-white">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-green-50 transition-colors">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 border-green-100 bg-white">
                        {item.imageUrl ? (
                             <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover object-center" />
                        ) : (
                            <div className="h-full w-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">Sin img</div>
                        )}
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

                        {/* --- Puntos Ganados por Producto (RF-07) --- */}
                        {item.pointsEarned && item.pointsEarned > 0 && (
                          <div className="flex items-center gap-2 text-xs text-yellow-600">
                            <svg className="w-3.5 h-3.5 fill-yellow-400" xmlns="https://www.w3.org/2000/svg" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26l6.91 1l-5 4.86l1.18 6.88l-6.18-3.25l-6.18 3.25l1.18-6.88l-5-4.86l6.91-1z" fill="currentColor"/>
                            </svg>
                            <span className="font-semibold text-yellow-700">
                              Ganas: {item.pointsEarned * item.quantity} Puntos
                            </span>
                          </div>
                        )}

                        <div className="mt-2 flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8 border-green-200 hover:bg-green-50 text-green-700" onClick={() => handleQuantityChange(item.id, -1)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center text-green-900 font-medium">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-8 w-8 border-green-200 hover:bg-green-50 text-green-700" onClick={() => handleQuantityChange(item.id, 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 text-green-400 hover:bg-red-50 hover:text-red-500" onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resumen */}
                <div className="bg-green-50 rounded-xl p-4 mt-4 border border-green-100">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-green-800 font-medium">Total a pagar</span>
                    <div className="flex items-center gap-2">
                      <AtipayCoin size="xs" />
                      <span className="font-bold text-xl text-green-700">{formatCurrency(getCartTotal())}</span>
                    </div>
                  </div>

                  {/* --- Resumen de Puntos Ganados (RF-07) --- */}
                  {totalPointsEarned > 0 && (
                    <div className="flex justify-between items-center py-2 border-t border-green-200/50">
                      <span className="text-green-800 font-medium flex items-center gap-1">
                        Puntos que ganarás
                      </span>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-5 h-5 text-yellow-600 fill-yellow-400" xmlns="https://www.w3.org/2000/svg" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26l6.91 1l-5 4.86l1.18 6.88l-6.18-3.25l-6.18 3.25l1.18-6.88l-5-4.86l6.91-1z" fill="currentColor"/>
                        </svg>
                        <span className="font-bold text-xl text-yellow-700">
                          {totalPointsEarned.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-medium text-green-800">Método de pago</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => setPaymentMethod("atipay")} className={`h-10 text-sm font-medium transition-colors ${paymentMethod === "atipay" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>
                        <CreditCard className="h-4 w-4 mr-2" /> Atipay
                      </Button>
                      <Button onClick={() => setPaymentMethod("deposit")} className={`h-10 text-sm font-medium transition-colors ${paymentMethod === "deposit" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>
                        <Banknote className="h-4 w-4 mr-2" /> Depósito
                      </Button>
                    </div>

                    {/* BLOQUE DE DEPÓSITO MEJORADO */}
                    {paymentMethod === "deposit" && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                          <Banknote className="w-4 h-4" /> Pago por Depósito Bancario
                        </h3>

                        {loadingBankInfo ? (
                           <div className="flex items-center justify-center py-4 gap-2 text-blue-400">
                             <span className="animate-spin"><RefreshCw className="h-4 w-4" /></span>
                             <span className="text-xs">Cargando datos bancarios...</span>
                           </div>
                        ) : (
                          <>
                            {/* --- DISEÑO DE TARJETA BANCARIA --- */}
                            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-600 to-green-800 p-5 text-white shadow-lg mb-4">
                              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
                              <div className="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
                              <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4 opacity-90">
                                  <Banknote className="h-5 w-5" />
                                  <span className="text-xs font-medium tracking-wider uppercase">Cuenta Corriente</span>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] uppercase tracking-widest opacity-70">{depositData?.bankDescription || "Banco"}</p>
                                  <p className="text-lg font-mono font-bold tracking-wide text-white drop-shadow-md break-all">{depositData?.bankInfo || "Cargando..."}</p>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <span className="text-[9px] uppercase opacity-70">Titular</span>
                                    <span className="text-xs font-semibold">Atipay Company</span>
                                  </div>
                                  <div className="h-6 w-10 rounded bg-white/20 flex items-center justify-center border border-white/10">
                                    <div className="h-4 w-6 rounded-sm border border-white/30" />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* --- CONTACTO DE SOPORTE LIMPIO --- */}
                            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex items-center gap-3 mb-4">
                              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0 border border-blue-100">
                                <User className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">¿Necesitas ayuda?</p>
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-gray-800 truncate">{depositData?.adminName || "Soporte"}</span>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                                        <a href={`tel:${depositData?.adminPhone}`} className="text-[11px] text-green-600 hover:underline flex items-center gap-1 font-medium">
                                            <Phone className="w-3 h-3" /> {depositData?.adminPhone || "--"}
                                        </a>
                                        {depositData?.adminEmail && (
                                             <span className="text-[11px] text-gray-400 flex items-center gap-1 truncate max-w-[140px]" title={depositData.adminEmail}>
                                                 <Mail className="w-3 h-3" /> {depositData.adminEmail}
                                             </span>
                                        )}
                                    </div>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        <div>
                          <h4 className="text-xs font-semibold text-blue-800 mb-1">Recuerda:</h4>
                          <ul className="text-xs text-blue-800 space-y-1 pl-1">
                            <li>• Se generará una <strong>solicitud pendiente</strong>.</li>
                            <li>• Tienes <strong>24 horas</strong> para subir tu comprobante.</li>
                          </ul>
                        </div>

                        <label className="flex items-start gap-2 pt-1 cursor-pointer">
                          <input type="checkbox" className="mt-0.5 h-4 w-4 text-blue-600 rounded border-blue-300" checked={acceptedDepositTerms} onChange={(e) => setAcceptedDepositTerms(e.target.checked)} />
                          <span className="text-xs text-blue-900 leading-tight">He leído y entiendo el proceso.</span>
                        </label>
                      </div>
                    )}

                    <Button onClick={() => setShowConfirm(true)} className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-semibold" disabled={isProcessing || (paymentMethod === "deposit" && !acceptedDepositTerms)}>
                      {isProcessing ? "Procesando..." : `Continuar con ${paymentMethod === "atipay" ? "Atipay" : "Depósito"}`}
                    </Button>

                    <Button variant="outline" className="w-full text-green-600 hover:bg-white border-green-200 hover:border-green-300 h-11" onClick={clearCart}>Vaciar carrito</Button>
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