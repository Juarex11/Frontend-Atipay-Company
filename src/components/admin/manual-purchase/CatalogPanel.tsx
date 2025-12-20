import { useState } from 'react';
import { 
    Search, Plus, Package, Calculator, Zap, ScrollText, ArrowRight, 
    MousePointerClick, Settings, X, Edit, Trash2, ToggleLeft, ToggleRight, 
    Save, Loader2, Layers 
} from 'lucide-react';

import { 
    type Product, type Pack, type ConversionRule, 
    createProduct, deletePack, togglePackStatus,
    getConversionRules, createConversionRule, updateConversionRule, deleteConversionRule 
} from '../../../services/adminPurchaseService';

interface CatalogPanelProps {
    products: Product[];
    packs: Pack[];
    rules: ConversionRule[];
    loading: boolean;
    onAddProduct: (product: Product) => void;
    onAddPack: (pack: Pack) => void;
    onAddLooseItem: (amount: number, desc: string, ruleId: string | null, manualPoints?: number) => void;
    onSaveCartAsPack: () => void; // <--- Esta función viene del padre
    onRulesChange: () => void;
    onEditPack: (pack: Pack) => void;
}

export const CatalogPanel = ({ 
    products, 
    packs, 
    rules, 
    loading, 
    onAddProduct, 
    onAddPack, 
    onAddLooseItem,
    onSaveCartAsPack,
    onRulesChange,
    onEditPack
}: CatalogPanelProps) => {
    
    // --- ESTADOS GLOBALES ---
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'catalog' | 'packs' | 'rules' | 'calculator'>('catalog');
    
    // --- ESTADOS CREACIÓN RÁPIDA ---
    const [newProductName, setNewProductName] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [createLoading, setCreateLoading] = useState(false);

    // --- ESTADOS CALCULADORA ---
    const [calcAmount, setCalcAmount] = useState('');
    const [calcDesc, setCalcDesc] = useState('');
    
    // --- ESTADOS GESTIÓN DE REGLAS ---
    const [isRuleManagerOpen, setIsRuleManagerOpen] = useState(false);
    const [managerRules, setManagerRules] = useState<ConversionRule[]>([]); 
    const [managerLoading, setManagerLoading] = useState(false);
    const [editingRule, setEditingRule] = useState<Partial<ConversionRule> | null>(null);

    // --- TOAST ---
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    // =========================================================================
    // 📦 GESTIÓN DE PACKS
    // =========================================================================
    
    const handleDeletePack = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation(); 
        if (!window.confirm("¿Eliminar este Pack?")) return;
        try {
            await deletePack(id);
            showToast("Pack eliminado", 'success');
            onRulesChange();
        } catch (error) { showToast("Error al eliminar", 'error'); }
    };

    const handleEditClick = (e: React.MouseEvent, pack: Pack) => {
        e.stopPropagation();
        onEditPack(pack); 
    };

    const handleTogglePack = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        try {
            await togglePackStatus(id);
            showToast("Estado actualizado", 'success');
            onRulesChange(); 
        } catch (error) { showToast("Error al cambiar estado", 'error'); }
    };

    // =========================================================================
    // 📜 GESTIÓN DE REGLAS
    // =========================================================================

    const fetchManagerRules = async () => {
        setManagerLoading(true);
        try {
            const data = await getConversionRules(false);
            setManagerRules(Array.isArray(data) ? data : []);
        } catch (error) { console.error(error); } 
        finally { setManagerLoading(false); }
    };

    const openRuleManager = () => {
        setIsRuleManagerOpen(true);
        setEditingRule(null);
        fetchManagerRules();
    };

    const handleSaveRule = async () => {
        if (!editingRule?.name || !editingRule.amount_required || !editingRule.points_awarded) return alert("Completa los campos");
        setManagerLoading(true);
        try {
            if (editingRule.id) {
                await updateConversionRule(editingRule.id, editingRule);
                showToast("Regla actualizada", 'success');
            } else {
                await createConversionRule(editingRule);
                showToast("Regla creada", 'success');
            }
            await fetchManagerRules();
            onRulesChange();
            setEditingRule(null);
        } catch (error) { showToast("Error al guardar", 'error'); } 
        finally { setManagerLoading(false); }
    };

    const handleDeleteRule = async (id: number) => {
        if (!confirm("¿Eliminar regla?")) return;
        setManagerLoading(true);
        try {
            await deleteConversionRule(id);
            showToast("Regla eliminada", 'success');
            await fetchManagerRules();
            onRulesChange();
        } catch (error) { showToast("Error al eliminar", 'error'); } 
        finally { setManagerLoading(false); }
    };

    const handleToggleRule = async (rule: ConversionRule) => {
        setManagerLoading(true);
        try {
            await updateConversionRule(rule.id, { is_active: !rule.is_active });
            setManagerRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: !r.is_active } : r));
            onRulesChange();
        } catch (error) { showToast("Error estado regla", 'error'); } 
        finally { setManagerLoading(false); }
    };

    // =========================================================================
    // 🛒 OTROS HANDLERS
    // =========================================================================
    
    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredPacks = packs.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleQuickCreate = async () => {
        if (!newProductName.trim() || !newProductPrice) return;
        setCreateLoading(true);
        try {
            const priceVal = parseFloat(newProductPrice);
            // IMPORTANTE: Al crear producto suelto, la lógica por defecto es precio/3
            // Pero al crear un pack, se sobreescribirá con la distribución manual
            await createProduct({ 
                name: newProductName, 
                price: priceVal, 
                points: (priceVal / 3).toFixed(2), 
                description: 'Rápido', 
                image: null 
            });
            setNewProductName(''); setNewProductPrice('');
            showToast(`Producto creado`, 'success');
        } catch (error) { showToast("Error al crear", 'error'); } 
        finally { setCreateLoading(false); }
    };

    const handleAddCalculatorItem = () => {
        const amount = parseFloat(calcAmount);
        if (!amount) return;
        onAddLooseItem(amount, calcDesc || 'Varios', 'manual', amount / 3);
        setCalcAmount(''); setCalcDesc('');
        showToast("Ítem agregado", 'success');
    };

    const handleAddRuleItem = (rule: ConversionRule) => {
        onAddLooseItem(Number(rule.amount_required), `Regla: ${rule.name}`, rule.id.toString(), Number(rule.points_awarded));
        showToast(`¡Aplicada!`, 'success');
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full min-h-[600px] relative">
            
            {/* Toast */}
            <div className={`absolute top-4 right-4 z-[60] transition-all duration-500 ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border border-gray-100 bg-white min-w-[280px] border-l-4 ${toast.type === 'success' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                    <p className="text-sm font-bold text-gray-800">{toast.message}</p>
                </div>
            </div>

            {/* HEADER DINÁMICO (CAMBIA SEGÚN EL TAB) */}
            <div className="bg-gray-50 p-5 border-b border-gray-200 min-h-[88px] flex flex-col justify-center">
                
                {activeTab === 'catalog' && (
                    <>
                        <div className="flex items-center gap-2 mb-3"> <Zap className="w-4 h-4 text-amber-500 fill-amber-500" /> <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Creación Rápida</h3> </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input type="text" placeholder="Nombre" className="flex-[2] border border-gray-300 rounded-xl px-4 py-2 text-sm outline-none" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} />
                            <div className="flex flex-1 gap-3">
                                <input type="number" placeholder="Precio" className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm outline-none" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} />
                                <button onClick={handleQuickCreate} disabled={createLoading} className="bg-gray-900 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-black">{createLoading ? '...' : 'Crear'}</button>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'packs' && (
                    <div className="flex items-center justify-between w-full">
                        <div>
                            <h3 className="text-sm font-bold text-purple-900 flex items-center gap-2"><Layers className="w-4 h-4"/> Gestión de Packs</h3>
                            <p className="text-xs text-purple-600 mt-0.5">Crea packs con lógica de puntos personalizada.</p>
                        </div>
                        <button 
                            onClick={onSaveCartAsPack}
                            className="bg-purple-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-purple-700 shadow-md shadow-purple-100 flex items-center gap-2 transition-all active:scale-95"
                        >
                            <Save className="w-4 h-4"/> Guardar Carrito como Pack
                        </button>
                    </div>
                )}

                {activeTab === 'rules' && (
                    <div className="flex items-center gap-2 text-amber-800">
                        <ScrollText className="w-4 h-4" />
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider">Reglas Rápidas</h3>
                            <p className="text-[10px] opacity-70">Conversiones predefinidas para ítems sueltos.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'calculator' && (
                    <div className="flex items-center gap-2 text-blue-800">
                        <Calculator className="w-4 h-4" />
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider">Modo Manual</h3>
                            <p className="text-[10px] opacity-70">Ingreso libre de montos.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('catalog')} className={`flex-1 py-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 min-w-[100px] transition-colors ${activeTab === 'catalog' ? 'text-green-600 bg-white border-b-2 border-green-500' : 'text-gray-400 bg-gray-50 hover:bg-gray-100'}`}><Package className="w-4 h-4"/> Catálogo</button>
                <button onClick={() => setActiveTab('packs')} className={`flex-1 py-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 min-w-[100px] transition-colors ${activeTab === 'packs' ? 'text-purple-600 bg-white border-b-2 border-purple-500' : 'text-gray-400 bg-gray-50 hover:bg-gray-100'}`}><Layers className="w-4 h-4"/> Packs</button>
                <button onClick={() => setActiveTab('rules')} className={`flex-1 py-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 min-w-[100px] transition-colors ${activeTab === 'rules' ? 'text-amber-600 bg-white border-b-2 border-amber-500' : 'text-gray-400 bg-gray-50 hover:bg-gray-100'}`}><ScrollText className="w-4 h-4"/> Reglas</button>
                <button onClick={() => setActiveTab('calculator')} className={`flex-1 py-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 min-w-[100px] transition-colors ${activeTab === 'calculator' ? 'text-blue-600 bg-white border-b-2 border-blue-500' : 'text-gray-400 bg-gray-50 hover:bg-gray-100'}`}><Calculator className="w-4 h-4"/> Manual</button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto max-h-[600px] custom-scrollbar relative">
                
                {/* 1. CATÁLOGO */}
                {activeTab === 'catalog' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Buscar producto..." className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-100 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                        {loading ? <div className="text-center py-10 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto"/> Cargando...</div> : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {filteredProducts.map(product => (
                                    <div key={product.id} onClick={() => onAddProduct(product)} className="group border border-gray-100 rounded-xl p-3 hover:border-green-500 hover:shadow-md cursor-pointer bg-white transition-all flex flex-col justify-between h-28">
                                        <div><h4 className="text-xs sm:text-sm font-bold text-gray-700 leading-tight mb-1 group-hover:text-green-700 line-clamp-2">{product.name}</h4></div>
                                        <div className="mt-2 flex items-end justify-between">
                                            <div><div className="text-[10px] text-gray-400 uppercase">Precio</div><div className="font-mono font-bold text-gray-900">S/ {Number(product.price).toFixed(2)}</div></div>
                                            <div className="bg-green-50 text-green-700 p-1.5 rounded-lg group-hover:bg-green-500 group-hover:text-white transition-colors"><Plus className="w-4 h-4"/></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 2. PACKS (CON GESTIÓN) */}
                {activeTab === 'packs' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                         <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Buscar pack..." className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-100 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                        
                        {filteredPacks.length === 0 ? (
                            <div className="text-center py-10 flex flex-col items-center justify-center">
                                <Layers className="w-12 h-12 text-gray-200 mb-2"/>
                                <p className="text-gray-400 text-sm">No hay packs registrados.</p>
                                <p className="text-xs text-purple-500 mt-2 max-w-[200px]">Agrega productos al carrito y dale al botón de arriba "Guardar Carrito como Pack".</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredPacks.map(pack => {
                                    const isActive = pack.status !== 'inactive'; 
                                    return (
                                    <div key={pack.id} onClick={() => isActive && onAddPack(pack)} className={`group border rounded-xl p-4 transition-all relative ${isActive ? 'border-gray-100 bg-white hover:border-purple-500 hover:shadow-md cursor-pointer' : 'border-gray-100 bg-gray-50 opacity-70 cursor-default'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1 pr-2">
                                                <h4 className="font-bold text-gray-800 group-hover:text-purple-700 leading-tight text-sm">{pack.name}</h4>
                                                {!isActive && <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 rounded mt-1 inline-block">INACTIVO</span>}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={(e) => handleTogglePack(e, pack.id)} className={`p-1.5 rounded-lg transition-colors ${isActive ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-200'}`} title={isActive ? "Desactivar" : "Activar"}>{isActive ? <ToggleRight className="w-4 h-4"/> : <ToggleLeft className="w-4 h-4"/>}</button>
                                                <button onClick={(e) => handleEditClick(e, pack)} className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar"><Edit className="w-3.5 h-3.5"/></button>
                                                <button onClick={(e) => handleDeletePack(e, pack.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar"><Trash2 className="w-3.5 h-3.5"/></button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end mt-3 border-t border-dashed border-gray-100 pt-2">
                                            <div><p className="text-[10px] text-gray-400 uppercase">Precio Pack</p><p className="font-mono font-bold text-base text-gray-900">S/ {Number(pack.total_pack_price).toFixed(2)}</p></div>
                                            <div className="text-right"><p className="text-[10px] text-gray-400 uppercase">Puntos</p><p className="font-bold text-purple-600 text-sm">{Number(pack.total_pack_points).toFixed(2)} pts</p></div>
                                        </div>
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <Plus className="w-8 h-8 text-purple-500 bg-white rounded-full shadow-lg p-1"/>
                                        </div>
                                    </div>
                                )})}
                            </div>
                        )}
                    </div>
                )}

                {/* 3. REGLAS (CON GESTIÓN) */}
                {activeTab === 'rules' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center bg-amber-50 p-4 rounded-xl border border-amber-100 mb-4">
                            <div><h4 className="font-bold text-amber-800 text-sm flex items-center gap-2"><ScrollText className="w-4 h-4"/> Reglas Definidas</h4><p className="text-xs text-amber-700 mt-1">Accesos directos de conversión.</p></div>
                            <button onClick={openRuleManager} className="bg-white border border-amber-200 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors flex items-center gap-1 shadow-sm"><Settings className="w-3.5 h-3.5"/> Gestionar</button>
                        </div>
                        {rules.length === 0 ? (
                             <div className="text-center py-10"><ScrollText className="w-12 h-12 text-gray-200 mx-auto mb-2"/><p className="text-gray-400 text-sm">No hay reglas activas.</p><button onClick={openRuleManager} className="text-amber-600 font-bold text-xs mt-2 underline">Crear una regla</button></div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {rules.map(rule => (
                                    <button key={rule.id} onClick={() => handleAddRuleItem(rule)} className="w-full flex items-center justify-between bg-white border border-gray-200 p-4 rounded-xl hover:border-amber-500 hover:shadow-md transition-all group text-left active:scale-[0.98]">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-amber-100 p-2.5 rounded-full text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors"><MousePointerClick className="w-5 h-5"/></div>
                                            <div>
                                                <h5 className="font-bold text-gray-800 group-hover:text-amber-700 transition-colors text-sm">{rule.name}</h5>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-mono border border-gray-200">S/ {Number(rule.amount_required).toFixed(2)}</span>
                                                    <ArrowRight className="w-3 h-3 text-gray-400"/>
                                                    <span className="text-xs bg-amber-100 px-2 py-0.5 rounded text-amber-700 font-bold border border-amber-200">{Number(rule.points_awarded)} Pts</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity"><Plus className="w-5 h-5 text-amber-500"/></div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 4. MANUAL */}
                {activeTab === 'calculator' && (
                    <div className="h-full flex flex-col justify-center max-w-xs mx-auto animate-in fade-in duration-300">
                        <div className="text-center mb-6"><div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3"><Calculator className="w-8 h-8 text-blue-500"/></div><h3 className="font-bold text-gray-900">Calculadora Manual</h3><p className="text-xs text-gray-500 mt-1">Cálculo estándar: Precio / 3</p></div>
                        <div className="space-y-4">
                            <div><label className="block text-xs font-bold text-gray-600 mb-1 ml-1">Descripción</label><input type="text" value={calcDesc} onChange={(e) => setCalcDesc(e.target.value)} placeholder="Ej. Varios" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none"/></div>
                            <div><label className="block text-xs font-bold text-gray-600 mb-1 ml-1">Monto (S/)</label><input type="number" value={calcAmount} onChange={(e) => setCalcAmount(e.target.value)} placeholder="0.00" className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-lg font-mono font-bold focus:border-blue-500 focus:ring-4 outline-none" onKeyDown={(e) => e.key === 'Enter' && handleAddCalculatorItem()}/></div>
                            <button onClick={handleAddCalculatorItem} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"><Plus className="w-5 h-5"/> Agregar</button>
                             {calcAmount && parseFloat(calcAmount) > 0 && <div className="text-center text-xs text-blue-600 font-medium bg-blue-50 py-2 rounded-lg border border-blue-100">Equivale a: <span className="font-bold">{(parseFloat(calcAmount) / 3).toFixed(2)} Puntos</span></div>}
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* 🛑 MODAL GESTOR DE REGLAS (CRUD COMPLETO) */}
            {/* ========================================================================= */}
            {isRuleManagerOpen && (
                <div className="absolute inset-0 z-50 bg-white animate-in slide-in-from-bottom-5 duration-300 flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><Settings className="w-4 h-4"/> Gestión de Reglas</h3>
                        <button onClick={() => setIsRuleManagerOpen(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><X className="w-5 h-5"/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {editingRule ? (
                            <div className="space-y-4 max-w-sm mx-auto mt-4">
                                <h4 className="text-sm font-bold text-amber-600 uppercase mb-4">{editingRule.id ? 'Editar Regla' : 'Nueva Regla'}</h4>
                                <div><label className="block text-xs font-bold text-gray-600 mb-1">Nombre</label><input autoFocus type="text" className="w-full border p-2 rounded-lg text-sm" value={editingRule.name || ''} onChange={e => setEditingRule({...editingRule, name: e.target.value})} placeholder="Ej. Promo Navideña"/></div>
                                <div className="flex gap-3">
                                    <div className="flex-1"><label className="block text-xs font-bold text-gray-600 mb-1">Monto (S/)</label><input type="number" className="w-full border p-2 rounded-lg text-sm font-mono" value={editingRule.amount_required || ''} onChange={e => setEditingRule({...editingRule, amount_required: parseFloat(e.target.value)})} placeholder="0.00"/></div>
                                    <div className="flex-1"><label className="block text-xs font-bold text-gray-600 mb-1">Puntos</label><input type="number" className="w-full border p-2 rounded-lg text-sm font-mono" value={editingRule.points_awarded || ''} onChange={e => setEditingRule({...editingRule, points_awarded: parseFloat(e.target.value)})} placeholder="0"/></div>
                                </div>
                                {!editingRule.id && (<div className="flex items-center gap-2 mt-2"><input type="checkbox" id="activeCheck" checked={editingRule.is_active !== false} onChange={e => setEditingRule({...editingRule, is_active: e.target.checked})}/><label htmlFor="activeCheck" className="text-xs text-gray-600">Activa inmediatamente</label></div>)}
                                <div className="flex gap-2 pt-4"><button onClick={() => setEditingRule(null)} className="flex-1 py-2 border rounded-lg text-sm font-bold text-gray-600">Cancelar</button><button onClick={handleSaveRule} disabled={managerLoading} className="flex-1 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold flex justify-center items-center gap-2 hover:bg-amber-600">{managerLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Save className="w-4 h-4"/> Guardar</>}</button></div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <button onClick={() => setEditingRule({ name: '', amount_required: 0, points_awarded: 0, is_active: true })} className="w-full py-3 border-2 border-dashed border-amber-300 bg-amber-50 text-amber-700 rounded-xl font-bold text-sm hover:bg-amber-100 flex justify-center items-center gap-2 transition-colors"><Plus className="w-4 h-4"/> Crear Nueva Regla</button>
                                {managerLoading && managerRules.length === 0 ? (<div className="text-center py-8 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></div>) : (
                                    <div className="space-y-2">
                                        {managerRules.map(rule => (
                                            <div key={rule.id} className={`flex items-center justify-between p-3 rounded-xl border ${rule.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-70'}`}>
                                                <div className="flex-1"><h5 className="font-bold text-sm text-gray-800">{rule.name}</h5><p className="text-xs text-gray-500 font-mono">S/ {Number(rule.amount_required).toFixed(2)} → {Number(rule.points_awarded)} pts</p></div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleToggleRule(rule)} className={`p-2 rounded-lg transition-colors ${rule.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-200'}`} title={rule.is_active ? "Desactivar" : "Activar"}>{rule.is_active ? <ToggleRight className="w-5 h-5"/> : <ToggleLeft className="w-5 h-5"/>}</button>
                                                    <button onClick={() => setEditingRule(rule)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar"><Edit className="w-4 h-4"/></button>
                                                    <button onClick={() => handleDeleteRule(rule.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar"><Trash2 className="w-4 h-4"/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};