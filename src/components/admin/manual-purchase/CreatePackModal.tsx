import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, CheckSquare, ArrowRight, Save, AlertTriangle, Package, Plus, Bookmark, Calculator, Info } from 'lucide-react';
import type { Product, ConversionRule } from '../../../services/adminPurchaseService';
import { createPack, getProductsForSelector, getConversionRules, createConversionRule, createQuickProduct } from '../../../services/adminPurchaseService';

interface CreatePackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreatePackModal: React.FC<CreatePackModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // Datos Generales
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [savedRules, setSavedRules] = useState<ConversionRule[]>([]);
    
    // Estado Paso 1: Selección
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estado Crear Producto Rápido
    const [showQuickCreate, setShowQuickCreate] = useState(false);
    const [newProdName, setNewProdName] = useState('');
    const [newProdPrice, setNewProdPrice] = useState('');

    // Estado Paso 2: Calibración
    const [packName, setPackName] = useState('');
    const [selectedRuleId, setSelectedRuleId] = useState<string>(''); 
    const [ruleMoney, setRuleMoney] = useState<number>(3.00);
    const [rulePoints, setRulePoints] = useState<number>(1.00);
    const [manualPoints, setManualPoints] = useState<Record<number, number>>({});

    // Inicializar
    useEffect(() => {
        if (isOpen) {
            initData();
            setStep(1);
            setSelectedIds([]);
            setPackName('');
            setManualPoints({});
            setShowQuickCreate(false);
        }
    }, [isOpen]);

    const initData = async () => {
        try {
            const [prods, rules] = await Promise.all([getProductsForSelector(), getConversionRules(true)]);
            setAllProducts(prods);
            setSavedRules(rules);
        } catch (e) { console.error(e); }
    };

    // --- LÓGICA PASO 1 ---
    const handleQuickCreateProduct = async () => {
        if (!newProdName || !newProdPrice) return alert("Llena nombre y precio");
        setLoading(true);
        try {
            const newProduct = await createQuickProduct(newProdName, parseFloat(newProdPrice));
            setAllProducts(prev => [newProduct, ...prev]);
            setSelectedIds(prev => [...prev, newProduct.id]);
            setNewProdName(''); setNewProdPrice(''); setShowQuickCreate(false);
        } catch (error) { console.error(error); alert("Error al crear producto"); }
        finally { setLoading(false); }
    };

    // --- LÓGICA PASO 2 ---
    const handleRuleSelect = (ruleId: string) => {
        setSelectedRuleId(ruleId);
        const rule = savedRules.find(r => r.id.toString() === ruleId);
        if (rule) {
            setRuleMoney(rule.amount_required);
            setRulePoints(rule.points_awarded);
        }
    };

    const handleSaveNewRule = async () => {
        const name = prompt("Nombre para guardar esta regla (Ej: Pack Verano):");
        if (!name) return;
        setLoading(true);
        try {
            const newRule = await createConversionRule({
                name, amount_required: ruleMoney, points_awarded: rulePoints, is_active: true
            });
            const actualRule = (newRule as any).rule || newRule;
            setSavedRules(prev => [...prev, actualRule]);
            setSelectedRuleId(actualRule.id.toString());
            alert("Regla guardada ✅");
        } catch (e) { console.error(e); alert("Error al guardar regla"); } 
        finally { setLoading(false); }
    };

    // --- MATEMÁTICA ---
    const selectedProducts = useMemo(() => allProducts.filter(p => selectedIds.includes(p.id)), [allProducts, selectedIds]);
    const totalPrice = selectedProducts.reduce((sum, p) => sum + parseFloat(p.price.toString()), 0);
    const targetTotalPoints = ruleMoney > 0 ? (totalPrice / ruleMoney) * rulePoints : 0;

    const getAutoPoints = (price: number) => (totalPrice === 0 ? 0 : (price / totalPrice) * targetTotalPoints);

    const currentTotalPointsAssigned = selectedProducts.reduce((sum, p) => {
        const points = manualPoints[p.id] !== undefined ? manualPoints[p.id] : getAutoPoints(parseFloat(p.price.toString()));
        return sum + points;
    }, 0);

    const isBalanced = Math.abs(currentTotalPointsAssigned - targetTotalPoints) < 0.05;

    // --- GUARDAR FINAL ---
    const handleSavePack = async () => {
        if (!packName.trim()) return alert("Falta el nombre del Pack");
        if (!isBalanced && !confirm("⚠️ Los puntos no cuadran con la regla. ¿Guardar igual?")) return;
        if (!confirm("⚠️ Se actualizarán los puntos de los productos en la base de datos. ¿Continuar?")) return;

        setLoading(true);
        try {
            await createPack({
                name: packName,
                conversion_money: ruleMoney,
                conversion_points: rulePoints,
                products: selectedIds,
                manual_distributions: manualPoints
            });
            onSuccess();
            onClose();
        } catch (error: any) { alert("Error: " + (error.message || "Error desconocido")); } 
        finally { setLoading(false); }
    };

    const handleManualPointChange = (id: number, val: string) => {
        const num = parseFloat(val);
        setManualPoints(prev => ({ ...prev, [id]: isNaN(num) ? 0 : num }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            {/* CAMBIO CLAVE: max-h-[90vh] y h-auto para que se ajuste al contenido */}
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] h-auto flex flex-col shadow-2xl animate-in zoom-in-95 overflow-hidden">
                
                {/* Header Compacto */}
                <div className="px-6 py-4 border-b bg-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-600"/> 
                            {step === 1 ? 'Paso 1: Selección de Productos' : 'Paso 2: Reglas y Distribución'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400"/></button>
                </div>

                {/* Body Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    
                    {/* === PASO 1: SELECCIÓN === */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar producto..." 
                                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button 
                                    onClick={() => setShowQuickCreate(!showQuickCreate)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 shadow-sm ${showQuickCreate ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}
                                >
                                    <Plus className="w-4 h-4"/> {showQuickCreate ? 'Cancelar' : 'Nuevo Producto'}
                                </button>
                            </div>

                            {/* Panel Crear Rápido */}
                            {showQuickCreate && (
                                <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm animate-in slide-in-from-top-2">
                                    <div className="flex gap-3 items-end">
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Nombre</label>
                                            <input value={newProdName} onChange={e=>setNewProdName(e.target.value)} className="w-full p-2 rounded-lg border text-sm focus:ring-1 focus:ring-blue-500" placeholder="Ej: Coca Cola 3L" autoFocus/>
                                        </div>
                                        <div className="w-28 space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Precio</label>
                                            <input type="number" value={newProdPrice} onChange={e=>setNewProdPrice(e.target.value)} className="w-full p-2 rounded-lg border text-sm focus:ring-1 focus:ring-blue-500" placeholder="0.00" />
                                        </div>
                                        <button onClick={handleQuickCreateProduct} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm h-[38px]">
                                            Crear
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Grid Productos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {allProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => {
                                    const isSelected = selectedIds.includes(product.id);
                                    return (
                                        <div 
                                            key={product.id} 
                                            onClick={() => setSelectedIds(prev => prev.includes(product.id) ? prev.filter(i=>i!==product.id) : [...prev, product.id])}
                                            className={`group p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center select-none ${isSelected ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}
                                        >
                                            <div>
                                                <p className={`font-bold text-sm line-clamp-1 ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>{product.name}</p>
                                                <p className="text-xs text-gray-500 font-mono mt-0.5">S/ {parseFloat(product.price.toString()).toFixed(2)}</p>
                                            </div>
                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300 group-hover:border-blue-300'}`}>
                                                {isSelected && <CheckSquare className="w-3.5 h-3.5 text-white"/>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* === PASO 2: CALIBRACIÓN === */}
                    {step === 2 && (
                        <div className="space-y-6">
                            
                            {/* Card de Configuración (Limpia y Ordenada) */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">Configuración del Pack</h3>
                                        <p className="text-xs text-gray-500">Define las reglas generales.</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                                        <span className="text-[10px] font-bold text-gray-500 px-2 uppercase">Cargar Regla:</span>
                                        <select 
                                            className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer pr-2"
                                            value={selectedRuleId}
                                            onChange={(e) => handleRuleSelect(e.target.value)}
                                        >
                                            <option value="">-- Personalizada --</option>
                                            {savedRules.map(r => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-6 space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Nombre del Pack</label>
                                        <input value={packName} onChange={e => setPackName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Ej: Pack Verano 2025" />
                                    </div>
                                    <div className="md:col-span-3 space-y-1.5">
                                        <label className="text-xs font-bold text-blue-600 uppercase">Por cada (S/)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-gray-400 text-xs font-bold">S/</span>
                                            <input type="number" value={ruleMoney} onChange={e => {setRuleMoney(parseFloat(e.target.value)); setSelectedRuleId('')}} className="w-full pl-8 pr-3 py-2 rounded-lg border border-blue-200 bg-blue-50/50 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                        </div>
                                    </div>
                                    <div className="md:col-span-3 space-y-1.5">
                                        <label className="text-xs font-bold text-green-600 uppercase">Gana (Pts)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-gray-400 text-xs font-bold">P</span>
                                            <input type="number" value={rulePoints} onChange={e => {setRulePoints(parseFloat(e.target.value)); setSelectedRuleId('')}} className="w-full pl-8 pr-3 py-2 rounded-lg border border-green-200 bg-green-50/50 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-green-500 outline-none transition-all" />
                                        </div>
                                    </div>
                                </div>

                                {!selectedRuleId && ruleMoney > 0 && (
                                    <button onClick={handleSaveNewRule} disabled={loading} className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 hover:underline">
                                        <Bookmark className="w-3 h-3"/> Guardar esta regla para usarla después
                                    </button>
                                )}
                            </div>

                            {/* Tabla de Distribución */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                        <Calculator className="w-3 h-3"/> Distribución de Puntos
                                    </h4>
                                    <div className="flex gap-4 text-xs">
                                        <span className="text-gray-500">Total Pack: <strong className="text-gray-900">S/ {totalPrice.toFixed(2)}</strong></span>
                                        <span className="text-blue-600 bg-blue-50 px-2 rounded-md border border-blue-100">Meta: <strong>{targetTotalPoints.toFixed(2)} pts</strong></span>
                                    </div>
                                </div>
                                
                                <table className="w-full text-sm text-left">
                                    <thead className="text-gray-400 font-medium text-xs border-b border-gray-100">
                                        <tr>
                                            <th className="px-5 py-3 font-semibold">Producto</th>
                                            <th className="px-5 py-3 font-semibold text-right">Precio</th>
                                            <th className="px-5 py-3 font-semibold text-right">Prop. (%)</th>
                                            <th className="px-5 py-3 font-semibold text-right w-36">Puntos Asignados</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {selectedProducts.map(p => {
                                            const price = parseFloat(p.price.toString());
                                            const percent = totalPrice > 0 ? (price / totalPrice) * 100 : 0;
                                            const autoVal = getAutoPoints(price);
                                            const manualVal = manualPoints[p.id];
                                            const finalVal = manualVal !== undefined ? manualVal : autoVal;
                                            const isEdited = manualVal !== undefined;

                                            return (
                                                <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                                                    <td className="px-5 py-3 font-medium text-gray-700">{p.name}</td>
                                                    <td className="px-5 py-3 text-right text-gray-500 font-mono text-xs">S/ {price.toFixed(2)}</td>
                                                    <td className="px-5 py-3 text-right text-gray-400 text-xs">{percent.toFixed(1)}%</td>
                                                    <td className="px-5 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-2 relative">
                                                            <input 
                                                                type="number" 
                                                                className={`w-20 text-right text-sm border rounded-lg py-1 px-2 font-bold outline-none transition-all ${isEdited ? 'border-orange-300 text-orange-700 bg-orange-50 ring-1 ring-orange-200' : 'border-gray-200 text-gray-600 focus:border-blue-400 focus:ring-1 focus:ring-blue-200'}`}
                                                                value={finalVal.toFixed(2)}
                                                                onChange={(e) => handleManualPointChange(p.id, e.target.value)}
                                                                onBlur={() => {
                                                                    if (manualPoints[p.id] === undefined || isNaN(manualPoints[p.id])) {
                                                                        const newMap = {...manualPoints}; delete newMap[p.id]; setManualPoints(newMap);
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    
                                    {/* Footer de Tabla (Totales) */}
                                    <tfoot className="bg-gray-50 border-t border-gray-200">
                                        <tr>
                                            <td colSpan={3} className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">Suma Total:</td>
                                            <td className="px-5 py-3 text-right">
                                                <div className={`inline-flex items-center gap-2 font-bold text-sm px-3 py-1 rounded-lg border ${isBalanced ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                    {currentTotalPointsAssigned.toFixed(2)}
                                                    {!isBalanced && <AlertTriangle className="w-3.5 h-3.5"/>}
                                                </div>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Alerta de Desbalance */}
                            {!isBalanced && (
                                <div className="flex items-start gap-3 bg-red-50 border border-red-100 p-3 rounded-xl">
                                    <Info className="w-5 h-5 text-red-500 shrink-0 mt-0.5"/>
                                    <div className="text-xs text-red-700">
                                        <strong className="block mb-0.5">La suma no coincide</strong>
                                        Los puntos asignados manualmente suman <strong>{currentTotalPointsAssigned.toFixed(2)}</strong>, pero según la regla del pack deberían ser <strong>{targetTotalPoints.toFixed(2)}</strong>. Por favor ajusta los valores.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Fijo */}
                <div className="p-5 border-t bg-white flex justify-between items-center shrink-0">
                    {step === 2 ? (
                        <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 text-sm hover:bg-gray-50 hover:text-gray-800 transition-colors">
                            Atrás
                        </button>
                    ) : <div/>}

                    {step === 1 ? (
                        <button 
                            onClick={() => selectedIds.length > 0 ? setStep(2) : alert("Selecciona al menos 1 producto")} 
                            className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-black flex items-center gap-2 shadow-lg shadow-gray-200 transition-all"
                        >
                            Siguiente <ArrowRight className="w-4 h-4"/>
                        </button>
                    ) : (
                        <button 
                            onClick={handleSavePack} 
                            disabled={loading}
                            className={`px-8 py-2.5 rounded-xl font-bold text-white text-sm flex items-center gap-2 shadow-lg transition-all ${isBalanced ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-red-500 hover:bg-red-600 shadow-red-200'}`}
                        >
                            {loading ? 'Guardando...' : <><Save className="w-4 h-4"/> Guardar Pack</>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};