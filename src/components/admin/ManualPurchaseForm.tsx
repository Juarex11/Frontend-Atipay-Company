import { useState, useEffect, useCallback } from 'react';
import { 
    getUsersForSelector, 
    getProductsForSelector, 
    storeManualPurchase, 
    annulPurchase, 
    assignPrivatePack,
    getPacks,              
    getConversionRules,
    updatePack,
    createPack
} from '../../services/adminPurchaseService';

import { History, Trash2, LayoutDashboard, ChevronRight, Layers, Image as ImageIcon } from 'lucide-react';
import { ATIPAY_ICON_SRC, STORAGE_KEY, safeParseFloat } from './manual-purchase/types';
import type { User, CartItem, TransactionLog } from './manual-purchase/types';
import type { Product, Pack, ConversionRule } from '../../services/adminPurchaseService';
import { CatalogPanel } from './manual-purchase/CatalogPanel';
import { CartPanel } from './manual-purchase/CartPanel';

// ✅ CORRECCIÓN: Importamos desde la carpeta correcta
import { CreatePackModal } from './manual-purchase/CreatePackModal'; 

export const ManualPurchaseForm = () => {
    // --- DATOS ---
    const [users, setUsers] = useState<User[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [packs, setPacks] = useState<Pack[]>([]);
    const [rules, setRules] = useState<ConversionRule[]>([]);

    const [selectedUser, setSelectedUser] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet'>('cash');
    const [cart, setCart] = useState<CartItem[]>([]);
    
    // --- ESTADO DE EDICIÓN ---
    const [editingPack, setEditingPack] = useState<Pack | null>(null);

    // --- UI & MODALES ---
    const [loading, setLoading] = useState(false);
    const [productsLoading, setProductsLoading] = useState(true);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const [itemToAnnul, setItemToAnnul] = useState<number | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);
    const [showPackNameModal, setShowPackNameModal] = useState(false);
    
    // Modal antiguo (Lo mantenemos para edición si es necesario)
    const [showGlobalPackModal, setShowGlobalPackModal] = useState(false);

    // ✅ ESTADO PARA EL NUEVO MODAL DE PACKS
    const [showCreatePackModal, setShowCreatePackModal] = useState(false);
    
    // --- FORMULARIOS ---
    const [packNameInput, setPackNameInput] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [pointsDistribution, setPointsDistribution] = useState<Record<number, number>>({});

    // --- HISTORIAL ---
    const [history, setHistory] = useState<TransactionLog[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });

    // --- CÁLCULOS ---
    const totalMoney = cart.reduce((acc, item) => acc + (item.price || 0), 0);
    const totalPoints = cart.reduce((acc, item) => acc + (item.points || 0), 0);
    const selectedUserData = users.find(u => u.id.toString() === selectedUser);

    // --- CARGA DE DATOS ---
    const refreshAllData = useCallback(async () => {
        try {
            const [rulesData, packsData] = await Promise.all([
                getConversionRules(true),
                getPacks()
            ]);
            setRules(Array.isArray(rulesData) ? rulesData : []);
            setPacks(Array.isArray(packsData) ? packsData : []);
        } catch (error) {
            console.error("Error refreshing data:", error);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [u, p] = await Promise.all([
                    getUsersForSelector(), 
                    getProductsForSelector()
                ]);
                setUsers(Array.isArray(u) ? u : (u.data || []));
                setProducts(Array.isArray(p) ? p : (p.data || []));
                
                await refreshAllData();
            } catch (error) { setErrorMsg("Error cargando datos."); } 
            finally { setProductsLoading(false); }
        };
        loadData();
    }, [refreshAllData]);

    useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); }, [history]);

    // =========================================================
    // LÓGICA MODAL PACKS ANTIGUO (Mantener para compatibilidad)
    // =========================================================
    const [modalProducts, setModalProducts] = useState<{id: string, productId: string, name: string, price: number}[]>([]);

    useEffect(() => {
        if (showGlobalPackModal) {
            if (editingPack) {
                const mapped = editingPack.products?.map(p => ({
                    id: `pack-${p.id}`,
                    productId: p.id.toString(),
                    name: p.name,
                    price: Number(p.price)
                })) || [];
                setModalProducts(mapped);

                const initialDist: Record<number, number> = {};
                editingPack.products?.forEach(p => {
                    // @ts-ignore
                    initialDist[p.id] = Number(p.pivot?.assigned_points || 0);
                });
                setPointsDistribution(initialDist);
            }
        }
    }, [showGlobalPackModal, editingPack]);

    const currentModalPrice = modalProducts.reduce((sum, item) => sum + item.price, 0);
    const currentDistSum = modalProducts.reduce((sum, item) => {
        const pid = parseInt(item.productId);
        return sum + (pointsDistribution[pid] || 0);
    }, 0);

    const handleRemoveFromModal = (visualId: string) => {
        setModalProducts(prev => prev.filter(p => p.id !== visualId));
    };

    const handleSaveGlobalPack = async () => {
        if (!packNameInput.trim()) return alert("Nombre requerido");
        if (modalProducts.length === 0) return alert("El pack no puede estar vacío.");

        setLoading(true);
        const productIds = modalProducts.map(item => parseInt(item.productId));

        try {
            const payload = {
                name: packNameInput,
                conversion_money: currentModalPrice,
                conversion_points: currentDistSum,
                products: productIds,
                manual_distributions: pointsDistribution 
            };

            if (editingPack) {
                await updatePack(editingPack.id, payload);
                setSuccessMsg(`Pack actualizado!`);
            } else {
                await createPack(payload);
                setSuccessMsg(`Pack creado!`);
            }

            setShowGlobalPackModal(false);
            setEditingPack(null);
            await refreshAllData(); 
            
        } catch (error) {
            // @ts-ignore
            setErrorMsg(error.message || 'Error al guardar.');
        } finally { setLoading(false); }
    };

    // --- HANDLERS ---
    const handleAddProduct = (product: Product) => {
        const safePrice = safeParseFloat(product.price);
        const safePoints = Number(product.points) > 0 ? Number(product.points) : (safePrice / 3);
        setCart([...cart, { id: Date.now().toString(), productId: product.id, name: product.name, price: safePrice, points: safePoints, type: 'product' }]);
    };
    const handleAddPack = (pack: Pack) => setCart([...cart, { id: Date.now().toString(), name: `Pack: ${pack.name}`, price: Number(pack.total_pack_price), points: Number(pack.total_pack_points), type: 'product', description: 'Pack Predefinido' }]);
    const handleAddLooseItem = (amount: number, desc: string, ruleId: string | null, manualPoints?: number) => setCart([...cart, { id: Date.now().toString(), name: `Abarrotes: ${desc}`, price: amount, points: manualPoints ?? 0, type: 'loose', description: ruleId === 'manual' ? 'Puntos Manuales' : 'Regla de Conversión' }]);
    const handleRemoveItem = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
    
    // --- MODALES ---
    const handleOpenPackModal = () => { // Pack Privado (Cliente)
        setSuccessMsg(null); setErrorMsg(null);
        if (!selectedUser) return setErrorMsg('Selecciona un cliente.');
        if (cart.length === 0) return setErrorMsg('Carrito vacío.');
        setPackNameInput(`Pedido Especial para ${selectedUserData?.username || 'Cliente'}`);
        setSelectedImage(null); setShowPackNameModal(true);
    };

    const handleEditPackSelect = (pack: Pack) => {
        setEditingPack(pack);
        setPackNameInput(pack.name);
        setShowGlobalPackModal(true);
    };

    // Procesos de Venta
    const handleCreatePack = async () => { if (!packNameInput.trim()) return alert("Ingresa un nombre."); setLoading(true); const itemNames = cart.map(item => item.name).join(', '); try { await assignPrivatePack({ user_id: parseInt(selectedUser), name: packNameInput, price: totalMoney, points: totalPoints, description: itemNames, image: selectedImage }); setSuccessMsg(`¡Pack privado enviado!`); setCart([]); setSelectedUser(''); setShowPackNameModal(false); setTimeout(() => setSuccessMsg(null), 5000); } catch (error) { setErrorMsg(error instanceof Error ? error.message : 'Error creando pack.'); } finally { setLoading(false); } };
    const handleInitiateSubmit = () => { setSuccessMsg(null); setErrorMsg(null); if (!selectedUser) return setErrorMsg('Selecciona un cliente.'); if (cart.length === 0) return setErrorMsg('Carrito vacío.'); if (paymentMethod === 'wallet' && (selectedUserData?.atipay_money || 0) < totalMoney) return setErrorMsg(`Saldo insuficiente.`); setSelectedImage(null); setShowConfirmModal(true); };
    const handleFinalProcessSale = async () => { setLoading(true); const itemNames = cart.map(item => item.name).join(', '); try { const response = await storeManualPurchase({ user_id: parseInt(selectedUser), amount: totalMoney, description: itemNames, points: totalPoints, payment_method: paymentMethod, image: selectedImage }); const purchaseId = response.purchase ? response.purchase.id : Date.now(); const newLog: TransactionLog = { id: purchaseId, user_name: selectedUserData?.username || 'Cliente', description: itemNames, amount: totalMoney, points: totalPoints, payment_method: paymentMethod, date: new Date().toLocaleDateString('es-ES'), time: new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'}) }; setHistory(prev => [newLog, ...prev].slice(0, 50)); setSuccessMsg('¡Venta registrada!'); if (paymentMethod === 'wallet' && selectedUserData) selectedUserData.atipay_money = (selectedUserData.atipay_money || 0) - totalMoney; setCart([]); setSelectedUser(''); setPaymentMethod('cash'); setShowConfirmModal(false); setTimeout(() => setSuccessMsg(null), 5000); } catch (error) { setErrorMsg(error instanceof Error ? error.message : 'Error al procesar.'); } finally { setLoading(false); } };
    const confirmAnnulment = async () => { if (!itemToAnnul) return; setLoading(true); try { await annulPurchase(itemToAnnul); setHistory(prev => prev.filter(item => item.id !== itemToAnnul)); setSuccessMsg('Venta anulada.'); } catch (error) { setErrorMsg(error instanceof Error ? error.message : 'Error al anular.'); } finally { setLoading(false); setItemToAnnul(null); } };

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-12 min-h-[90vh] bg-gray-50/30 p-4 sm:p-6 rounded-3xl">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
                <div className="flex items-center gap-4">
                    <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 hidden sm:block">
                        <img src={ATIPAY_ICON_SRC} alt="Atipay" className="w-10 h-10 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mb-1">
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Panel Administrativo</span>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                            <span className="text-gray-900">Punto de Venta</span>
                        </div>
                        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Registro de Ventas</h2>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                <div className="xl:col-span-7 space-y-6">
                    <CatalogPanel 
                        products={products} packs={packs} rules={rules} 
                        loading={productsLoading} 
                        onAddProduct={handleAddProduct} onAddPack={handleAddPack} onAddLooseItem={handleAddLooseItem} 
                        
                        // ✅ CONEXIÓN CORRECTA AL NUEVO MODAL
                        onSaveCartAsPack={() => setShowCreatePackModal(true)} 
                        
                        onRulesChange={refreshAllData} 
                        onEditPack={handleEditPackSelect} 
                    />
                </div>
                <div className="xl:col-span-5 space-y-6 sticky top-6">
                    <CartPanel users={users} selectedUser={selectedUser} onSelectUser={setSelectedUser} cart={cart} onRemoveItem={handleRemoveItem} totalMoney={totalMoney} totalPoints={totalPoints} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} onSubmit={handleInitiateSubmit} onSendToStore={handleOpenPackModal} loading={loading} errorMsg={errorMsg} successMsg={successMsg} />
                </div>
            </div>

            {/* HISTORIAL */}
            <div className="mt-10">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><History className="w-5 h-5 text-gray-500"/> Historial Local</h3>
                        {history.length > 0 && <button onClick={() => setShowClearModal(true)} className="px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-2"><Trash2 className="w-3.5 h-3.5"/> Limpiar</button>}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 text-xs uppercase font-semibold">
                                    <th className="px-6 py-4">Usuario</th><th className="px-6 py-4">Descripción</th><th className="px-6 py-4 text-center">Fecha</th><th className="px-6 py-4 text-center">Método</th><th className="px-6 py-4 text-right">Total</th><th className="px-6 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {history.length > 0 ? history.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-semibold text-gray-900">{log.user_name}</td>
                                        <td className="px-6 py-4 text-gray-600 truncate max-w-[200px]" title={log.description}>{log.description}</td>
                                        <td className="px-6 py-4 text-center">{log.date}</td>
                                        <td className="px-6 py-4 text-center">{log.payment_method === 'wallet' ? <span className="text-blue-600 font-bold">SALDO</span> : <span className="text-green-600 font-bold">EFECTIVO</span>}</td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">S/ {log.amount.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-center"><button onClick={() => setItemToAnnul(log.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button></td>
                                    </tr>
                                )) : <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">Sin transacciones recientes.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODALES CLÁSICOS */}
            {showConfirmModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4"><div className="bg-white rounded-3xl w-full max-w-md p-6"><h3 className="font-bold text-xl mb-4 text-center">Confirmar Venta</h3><div className="flex gap-3"><button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 border rounded-xl">Cancelar</button><button onClick={handleFinalProcessSale} className="flex-1 py-3 bg-green-600 text-white rounded-xl">Confirmar</button></div></div></div>)}
            {showPackNameModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4"><div className="bg-white rounded-3xl w-full max-w-md p-6"><h3 className="font-bold text-xl mb-4 text-center">Crear Pack Privado</h3><input type="text" className="w-full border p-3 rounded-xl mb-4" value={packNameInput} onChange={e => setPackNameInput(e.target.value)} /><div className="flex gap-3"><button onClick={() => setShowPackNameModal(false)} className="flex-1 py-3 border rounded-xl">Cancelar</button><button onClick={handleCreatePack} className="flex-1 py-3 bg-blue-600 text-white rounded-xl">Crear</button></div></div></div>)}
            {itemToAnnul && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4"><div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center"><h3 className="font-bold text-lg mb-2">¿Anular Venta?</h3><div className="flex gap-3"><button onClick={() => setItemToAnnul(null)} className="flex-1 py-2 border rounded-xl">No</button><button onClick={confirmAnnulment} className="flex-1 py-2 bg-red-600 text-white rounded-xl">Sí, Anular</button></div></div></div>)}
            {showClearModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4"><div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center"><h3 className="font-bold text-lg mb-4">¿Limpiar Historial?</h3><div className="flex gap-3"><button onClick={() => setShowClearModal(false)} className="flex-1 py-2 border rounded-xl">Cancelar</button><button onClick={() => {setHistory([]); setShowClearModal(false);}} className="flex-1 py-2 bg-gray-900 text-white rounded-xl">Limpiar</button></div></div></div>)}

            {/* MODAL GLOBAL ANTIGUO (Solo para editar packs viejos) */}
            {showGlobalPackModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white p-0 rounded-3xl w-full max-w-lg shadow-2xl border border-purple-100 flex flex-col max-h-[85vh]">
                        <div className="bg-purple-50 p-6 border-b border-purple-100 flex flex-col items-center">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm"><Layers className="w-6 h-6 text-purple-600"/></div>
                            <h3 className="font-bold text-xl text-gray-900">{editingPack ? 'Editar Pack Global' : 'Crear Pack Global'}</h3>
                            <p className="text-xs text-purple-700 text-center">Total Calculado: <strong>{currentDistSum.toFixed(2)} pts</strong></p>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            <div className="mb-5">
                                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Nombre del Pack</label>
                                <input type="text" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none transition-all" placeholder="Ej. Pack Verano 2025" value={packNameInput} onChange={(e) => setPackNameInput(e.target.value)} autoFocus />
                            </div>
                            <div className="mb-2">
                                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase"><tr><th className="px-4 py-3">Producto</th><th className="px-4 py-3 text-right">Precio</th><th className="px-4 py-3 text-right w-24">Puntos</th><th className="px-2 py-3 w-8"></th></tr></thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {modalProducts.map((prod) => (
                                                <tr key={prod.id}> 
                                                    <td className="px-4 py-3 font-medium text-gray-800">{prod.name}</td>
                                                    <td className="px-4 py-3 text-right text-gray-500">S/ {prod.price?.toFixed(2)}</td>
                                                    <td className="px-4 py-2 text-right">
                                                        <input type="number" className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-right focus:outline-none focus:border-purple-500 font-mono text-sm" value={pointsDistribution[parseInt(prod.productId!)] || 0} onChange={(e) => { const val = parseFloat(e.target.value); const pid = parseInt(prod.productId!); setPointsDistribution(prev => ({...prev, [pid]: isNaN(val) ? 0 : val})); }} step="0.01" />
                                                    </td>
                                                    <td className="px-2 py-2 text-center"><button onClick={() => handleRemoveFromModal(prod.id)} className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors" title="Quitar del pack"><Trash2 className="w-4 h-4"/></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50 rounded-b-3xl">
                            <button onClick={() => setShowGlobalPackModal(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors">Cancelar</button>
                            <button onClick={handleSaveGlobalPack} disabled={loading || modalProducts.length === 0} className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all">{loading ? 'Guardando...' : (editingPack ? 'Actualizar Pack' : 'Guardar Pack')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ EL NUEVO MODAL DE PACKS (CREACIÓN PERSONALIZADA) */}
            <CreatePackModal 
                isOpen={showCreatePackModal}
                onClose={() => setShowCreatePackModal(false)}
                onSuccess={() => {
                    setShowCreatePackModal(false);
                    refreshAllData(); // Recargar la lista de packs y productos
                    setSuccessMsg("Pack creado exitosamente 🎉");
                    setTimeout(() => setSuccessMsg(null), 3000);
                }}
            />

        </div>
    );
};