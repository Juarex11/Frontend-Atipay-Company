import { useState, useEffect } from 'react';
import { getUsersForSelector, getProductsForSelector, storeManualPurchase, annulPurchase, assignPrivatePack } from '../../services/adminPurchaseService';
import { History, Clock, Trash2, X, Wallet, Banknote, AlertTriangle, CheckCircle2, Package, Upload, Image as ImageIcon } from 'lucide-react'; // Nuevos iconos
import { ATIPAY_ICON_SRC, STORAGE_KEY, CONVERSION_RULES, safeParseFloat } from './manual-purchase/types';
import type { User, Product, CartItem, TransactionLog } from './manual-purchase/types';
import { CatalogPanel } from './manual-purchase/CatalogPanel';
import { CartPanel } from './manual-purchase/CartPanel';

export const ManualPurchaseForm = () => {
    // ... (Estados anteriores igual) ...
    const [users, setUsers] = useState<User[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet'>('cash');
    const [cart, setCart] = useState<CartItem[]>([]);
    
    // Historial
    const [history, setHistory] = useState<TransactionLog[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });

    // UI
    const [loading, setLoading] = useState(false);
    const [productsLoading, setProductsLoading] = useState(true);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    // Modales y Datos
    const [itemToAnnul, setItemToAnnul] = useState<number | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);
    const [showPackNameModal, setShowPackNameModal] = useState(false);
    
    // --- ESTADOS PARA DATOS DE FORMULARIO ---
    const [packNameInput, setPackNameInput] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null); // <--- NUEVO: Para guardar la foto

    // ... (UseEffects y Handlers de Carrito IGUALES que antes) ...
    // Carga Inicial
    useEffect(() => {
        const loadData = async () => {
            try {
                const [uData, pData] = await Promise.all([getUsersForSelector(), getProductsForSelector()]);
                setUsers(Array.isArray(uData) ? uData : (uData.data || []));
                setProducts(Array.isArray(pData) ? pData : (pData.data || []));
            } catch (error) {
                console.error("Error cargando datos", error);
                setErrorMsg("Error de conexión al cargar datos.");
            } finally {
                setProductsLoading(false);
            }
        };
        loadData();
    }, []);

    useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); }, [history]);

    const handleAddProduct = (product: Product) => {
        const safePrice = safeParseFloat(product.price);
        let safePoints = safeParseFloat(product.points);
        if (safePoints === 0 && safePrice > 0) safePoints = (safePrice * 100) / 300;
        setCart([...cart, { id: Date.now().toString(), productId: product.id, name: product.name, price: safePrice, points: safePoints, type: 'product' }]);
    };

    const handleAddLooseItem = (amount: number, desc: string, ruleId: string) => {
        const rule = CONVERSION_RULES.find(r => r.id === ruleId)!;
        const calculatedPoints = (amount * rule.points) / rule.factor;
        setCart([...cart, { id: Date.now().toString(), name: `Abarrotes: ${desc}`, price: amount, points: calculatedPoints, type: 'loose', description: rule.name }]);
    };

    const handleRemoveItem = (id: string) => setCart(cart.filter(item => item.id !== id));

    const totalMoney = cart.reduce((acc, item) => acc + (item.price || 0), 0);
    const totalPoints = cart.reduce((acc, item) => acc + (item.points || 0), 0);
    const selectedUserData = users.find(u => u.id.toString() === selectedUser);


    // --- MANEJO DE IMAGEN ---
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedImage(e.target.files[0]);
        }
    };

    // --- ABRIR MODAL PACK ---
    const handleOpenPackModal = () => {
        setSuccessMsg(null); setErrorMsg(null);
        if (!selectedUser) return setErrorMsg('Selecciona un cliente.');
        if (cart.length === 0) return setErrorMsg('El carrito está vacío.');

        setPackNameInput(`Pedido Especial para ${selectedUserData?.username || 'Cliente'}`);
        setSelectedImage(null); // Reseteamos imagen
        setShowPackNameModal(true);
    };

    // --- PROCESAR PACK (ENVIAR A TIENDA) ---
    const handleCreatePack = async () => {
        if (!packNameInput.trim()) return alert("Ingresa un nombre para el pack.");
        
        setLoading(true);
        const itemNames = cart.map(item => item.name).join(', ');

        try {
            await assignPrivatePack({
                user_id: parseInt(selectedUser),
                name: packNameInput,
                price: totalMoney,
                points: totalPoints,
                description: itemNames,
                image: selectedImage // <--- Enviamos la imagen
            });

            setSuccessMsg(`¡Pack "${packNameInput}" enviado a la tienda!`);
            setCart([]); setSelectedUser(''); setShowPackNameModal(false);
            setTimeout(() => setSuccessMsg(null), 5000);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al crear pack.';
            setErrorMsg('Error: ' + message);
        } finally {
            setLoading(false);
        }
    };

    // --- ABRIR MODAL VENTA DIRECTA ---
    const handleInitiateSubmit = () => {
        setSuccessMsg(null); setErrorMsg(null);
        if (!selectedUser) return setErrorMsg('Selecciona un cliente.');
        if (cart.length === 0) return setErrorMsg('Carrito vacío.');
        
        const userBalance = selectedUserData?.atipay_money || 0;
        if (paymentMethod === 'wallet' && userBalance < totalMoney) {
            return setErrorMsg(`Saldo insuficiente: S/ ${userBalance.toFixed(2)}`);
        }

        setSelectedImage(null); // Reseteamos imagen
        setShowConfirmModal(true);
    };

    // --- PROCESAR VENTA DIRECTA ---
    const handleFinalProcessSale = async () => {
        setLoading(true);
        const itemNames = cart.map(item => item.name).join(', ');

        try {
            const response = await storeManualPurchase({
                user_id: parseInt(selectedUser),
                amount: totalMoney,
                description: itemNames,
                points: totalPoints,
                payment_method: paymentMethod,
                image: selectedImage // <--- Enviamos la imagen
            });

            const purchaseId = response.purchase ? response.purchase.id : Date.now();
            const newLog: TransactionLog = {
                id: purchaseId,
                user_name: selectedUserData?.username || 'Cliente',
                description: itemNames,
                amount: totalMoney,
                points: totalPoints,
                payment_method: paymentMethod,
                date: new Date().toLocaleDateString('es-ES'),
                time: new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})
            };
            setHistory(prev => [newLog, ...prev].slice(0, 50));
            setSuccessMsg('¡Venta registrada con éxito!');
            
            if (paymentMethod === 'wallet' && selectedUserData) {
                selectedUserData.atipay_money = (selectedUserData.atipay_money || 0) - totalMoney;
            }

            setCart([]); setSelectedUser(''); setPaymentMethod('cash'); setShowConfirmModal(false);
            setTimeout(() => setSuccessMsg(null), 5000);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al procesar.';
            setErrorMsg('Error: ' + message);
        } finally {
            setLoading(false);
        }
    };

    // ... (confirmAnnulment igual) ...
    const confirmAnnulment = async () => {
        if (!itemToAnnul) return;
        setLoading(true);
        try {
            await annulPurchase(itemToAnnul);
            setHistory(prev => prev.filter(item => item.id !== itemToAnnul));
            setSuccessMsg('Venta anulada correctamente.');
            setItemToAnnul(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al anular.';
            setErrorMsg('Error: ' + message);
        } finally {
            setLoading(false);
            setItemToAnnul(null);
        }
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-10 min-h-[85vh]">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 hidden sm:block">
                    <img src={ATIPAY_ICON_SRC} alt="Atipay" className="w-8 h-8 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">Punto de Venta Admin</h2>
                    <p className="text-sm text-gray-500">Registra compras de Packs o Abarrotes</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-6">
                    <CatalogPanel products={products} loading={productsLoading} onAddProduct={handleAddProduct} onAddLooseItem={handleAddLooseItem} />
                </div>
                <div className="lg:col-span-5 space-y-6">
                    <CartPanel 
                        users={users} selectedUser={selectedUser} onSelectUser={setSelectedUser}
                        cart={cart} onRemoveItem={handleRemoveItem}
                        totalMoney={totalMoney} totalPoints={totalPoints}
                        paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
                        onSubmit={handleInitiateSubmit} 
                        onSendToStore={handleOpenPackModal}
                        loading={loading} errorMsg={errorMsg} successMsg={successMsg}
                    />
                </div>
            </div>

            {/* Historial */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-8">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><History className="w-5 h-5 text-green-600"/> Últimas Ventas (Locales)</h3>
                    {history.length > 0 && <button onClick={() => setShowClearModal(true)} className="text-xs flex items-center gap-1 text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3"/> Limpiar Todo</button>}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead><tr className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold"><th className="px-6 py-4">Usuario</th><th className="px-6 py-4">Detalle</th><th className="px-6 py-4 text-center">Fecha</th><th className="px-6 py-4 text-center">Pago</th><th className="px-6 py-4 text-right">Monto</th><th className="px-6 py-4 text-center">Acción</th></tr></thead>
                        <tbody className="divide-y divide-gray-50 text-sm">{history.length > 0 ? history.map(log => (
                            <tr key={log.id} className="hover:bg-green-50/30">
                                <td className="px-6 py-4 font-medium text-gray-900">{log.user_name}</td>
                                <td className="px-6 py-4 text-gray-500 truncate max-w-[200px]">{log.description}</td>
                                <td className="px-6 py-4 text-center text-gray-500 text-xs flex flex-col items-center"><span>{log.date}</span><span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3"/> {log.time}</span></td>
                                <td className="px-6 py-4 text-center">{log.payment_method === 'wallet' ? <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold border border-blue-200 flex items-center justify-center gap-1"><Wallet className="w-3 h-3"/> SALDO</span> : <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] font-bold border border-gray-200 flex items-center justify-center gap-1"><Banknote className="w-3 h-3"/> EFECTIVO</span>}</td>
                                <td className="px-6 py-4 text-right font-mono">S/ {log.amount.toFixed(2)}</td>
                                <td className="px-6 py-4 text-center">
                                    <button onClick={() => setItemToAnnul(log.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors" title="Anular venta"><Trash2 className="w-4 h-4"/></button>
                                </td>
                            </tr>
                        )) : <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Sin historial reciente.</td></tr>}</tbody>
                    </table>
                </div>
            </div>

            {/* MODAL 1: CONFIRMACIÓN VENTA DIRECTA (CON FOTO) */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white p-6 rounded-3xl w-full max-w-md text-center relative shadow-2xl animate-in fade-in zoom-in-95 border-4 border-green-50">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-green-50">
                            <CheckCircle2 className="w-8 h-8 text-green-600"/>
                        </div>
                        <h3 className="font-bold text-xl text-gray-900 mb-1">Confirmar Venta</h3>
                        <p className="text-sm text-gray-500 mb-4">Verifica los detalles antes de procesar.</p>

                        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2 text-sm border border-gray-100">
                            <div className="flex justify-between"><span className="text-gray-500">Cliente:</span><span className="font-bold text-gray-900">{selectedUserData?.username}</span></div>
                            <div className="flex justify-between items-center"><span className="text-gray-500">Total:</span><span className="font-mono font-bold text-lg text-gray-900">S/ {totalMoney.toFixed(2)}</span></div>
                        </div>

                        {/* INPUT DE IMAGEN */}
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-500 mb-2 text-left">Adjuntar Foto (Opcional)</label>
                            <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-green-400 hover:bg-green-50/30 transition-colors cursor-pointer text-center">
                                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <div className="flex flex-col items-center justify-center gap-1">
                                    {selectedImage ? (
                                        <>
                                            <ImageIcon className="w-6 h-6 text-green-600"/>
                                            <span className="text-xs text-green-700 font-bold truncate max-w-[200px]">{selectedImage.name}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-6 h-6 text-gray-400"/>
                                            <span className="text-xs text-gray-500">Click para subir foto del pedido</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={handleFinalProcessSale} disabled={loading} className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition-colors">{loading ? 'Procesando...' : 'Confirmar'}</button>
                            <button onClick={() => setShowConfirmModal(false)} disabled={loading} className="flex-1 bg-white text-gray-700 border border-gray-200 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: CREAR PACK (CON FOTO) */}
            {showPackNameModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white p-6 rounded-3xl w-full max-w-md text-center relative shadow-2xl animate-in fade-in zoom-in-95 border-4 border-blue-50">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-blue-50">
                            <Package className="w-8 h-8 text-blue-600"/>
                        </div>
                        <h3 className="font-bold text-xl text-gray-900 mb-4">Crear Pack Privado</h3>

                        <div className="space-y-4 text-left">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Pack</label>
                                <input type="text" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" value={packNameInput} onChange={(e) => setPackNameInput(e.target.value)} autoFocus />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Imagen del Producto (Opcional)</label>
                                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer text-center">
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <div className="flex flex-col items-center justify-center gap-1">
                                        {selectedImage ? (
                                            <>
                                                <ImageIcon className="w-6 h-6 text-blue-600"/>
                                                <span className="text-xs text-blue-700 font-bold truncate max-w-[200px]">{selectedImage.name}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-6 h-6 text-gray-400"/>
                                                <span className="text-xs text-gray-500">Subir foto para la tienda</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={handleCreatePack} disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">{loading ? 'Enviando...' : 'Crear y Enviar'}</button>
                            <button onClick={() => setShowPackNameModal(false)} disabled={loading} className="flex-1 bg-white text-gray-700 border border-gray-200 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3 y 4 (Anulación y Limpiar) siguen igual... */}
            {itemToAnnul && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl w-96 text-center relative shadow-2xl animate-in fade-in zoom-in-95">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-6 h-6 text-red-600"/></div>
                        <h3 className="font-bold text-lg text-gray-900 mb-2">¿Anular esta venta?</h3>
                        <p className="text-sm text-gray-500 mb-6">Esta acción es irreversible. Se revertirá el dinero y los puntos.</p>
                        <div className="flex gap-3">
                            <button onClick={confirmAnnulment} disabled={loading} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors">Sí, Anular</button>
                            <button onClick={() => setItemToAnnul(null)} disabled={loading} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
            {showClearModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl w-80 text-center relative shadow-xl">
                        <button onClick={() => setShowClearModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>
                        <h3 className="font-bold text-lg mb-2">¿Borrar historial local?</h3>
                        <div className="flex gap-2">
                            <button onClick={() => { setHistory([]); localStorage.removeItem(STORAGE_KEY); setShowClearModal(false); }} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-bold">Sí, borrar</button>
                            <button onClick={() => setShowClearModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-bold">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};