import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Search, CheckSquare, ArrowRight, Save, Package, Plus, Calculator, Image as ImageIcon, Camera, Trash2 } from 'lucide-react';
import type { Product, ConversionRule } from '../../../services/adminPurchaseService';
import { createPack, getProductsForSelector, getConversionRules } from '../../../services/adminPurchaseService';

interface CreatePackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// Interfaz para los items personalizados que creas al vuelo
interface CustomItem {
    tempId: number;
    name: string;
    price: number;
    points: number;
    image: File | null;
    imagePreview: string | null;
}

export const CreatePackModal: React.FC<CreatePackModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // --- DATOS GENERALES ---
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [savedRules, setSavedRules] = useState<ConversionRule[]>([]);
    
    // --- ESTADO PASO 1: SELECCIÓN ---
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [customItems, setCustomItems] = useState<CustomItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // --- ESTADO CREAR PRODUCTO RÁPIDO ---
    const [showQuickCreate, setShowQuickCreate] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newItemPoints, setNewItemPoints] = useState('');
    const [newItemImage, setNewItemImage] = useState<File | null>(null);
    const itemFileInputRef = useRef<HTMLInputElement>(null);

    // --- ESTADO PASO 2: CALIBRACIÓN Y DATOS PACK ---
    const [packName, setPackName] = useState('');
    const [packDescription, setPackDescription] = useState('');
    const [packImage, setPackImage] = useState<File | null>(null);
    const packFileInputRef = useRef<HTMLInputElement>(null);

    const [selectedRuleId, setSelectedRuleId] = useState<string>(''); 
    const [ruleMoney, setRuleMoney] = useState<number>(3.00);
    const [rulePoints, setRulePoints] = useState<number>(1.00);
    const [manualPoints, setManualPoints] = useState<Record<number, number>>({});
    const [customManualPoints, setCustomManualPoints] = useState<Record<number, number>>({});

    // Inicializar
    useEffect(() => {
        if (isOpen) {
            initData();
            setStep(1);
            setSelectedIds([]);
            setCustomItems([]);
            setPackName('');
            setPackDescription('');
            setPackImage(null);
            setManualPoints({});
            setCustomManualPoints({});
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
    const handleAddCustomItem = () => {
        if (!newItemName || !newItemPrice || !newItemPoints) return alert("Llena nombre, precio y puntos");
        
        const newItem: CustomItem = {
            tempId: Date.now(),
            name: newItemName,
            price: parseFloat(newItemPrice),
            points: parseFloat(newItemPoints),
            image: newItemImage,
            imagePreview: newItemImage ? URL.createObjectURL(newItemImage) : null
        };

        setCustomItems(prev => [...prev, newItem]);
        
        setNewItemName(''); 
        setNewItemPrice(''); 
        setNewItemPoints('');
        setNewItemImage(null);
        if (itemFileInputRef.current) itemFileInputRef.current.value = '';
        setShowQuickCreate(false);
    };

    const handleRemoveCustomItem = (tempId: number) => {
        setCustomItems(prev => prev.filter(item => item.tempId !== tempId));
        const newPoints = { ...customManualPoints };
        delete newPoints[tempId];
        setCustomManualPoints(newPoints);
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

    // --- MATEMÁTICA ---
    const selectedExistingProducts = useMemo(() => allProducts.filter(p => selectedIds.includes(p.id)), [allProducts, selectedIds]);
    
    const totalExistingPrice = selectedExistingProducts.reduce((sum, p) => sum + parseFloat(p.price.toString()), 0);
    const totalCustomPrice = customItems.reduce((sum, p) => sum + p.price, 0);
    const totalPrice = totalExistingPrice + totalCustomPrice;

    const targetTotalPoints = ruleMoney > 0 ? (totalPrice / ruleMoney) * rulePoints : 0;
    const getAutoPoints = (price: number) => (totalPrice === 0 ? 0 : (price / totalPrice) * targetTotalPoints);

    const totalAssignedPoints = 
        selectedExistingProducts.reduce((sum, p) => {
            return sum + (manualPoints[p.id] !== undefined ? manualPoints[p.id] : getAutoPoints(parseFloat(p.price.toString())));
        }, 0) +
        customItems.reduce((sum, p) => {
            return sum + (customManualPoints[p.tempId] !== undefined ? customManualPoints[p.tempId] : p.points);
        }, 0);

    const isBalanced = Math.abs(totalAssignedPoints - targetTotalPoints) < 0.05;

    // --- GUARDAR FINAL ---
    const handleSavePack = async () => {
        if (!packName.trim()) return alert("Falta el nombre del Pack");
        if ((selectedIds.length === 0 && customItems.length === 0)) return alert("El pack está vacío");
        
        if (!isBalanced && !confirm(`⚠️ Los puntos actuales (${totalAssignedPoints.toFixed(2)}) no coinciden con la regla (${targetTotalPoints.toFixed(2)}). ¿Guardar de todas formas?`)) return;

        setLoading(true);
        try {
            const formData = new FormData();
            
            // 1. Datos Básicos
            formData.append('name', packName);
            formData.append('description', packDescription);
            formData.append('conversion_money', ruleMoney.toString());
            formData.append('conversion_points', rulePoints.toString());
            formData.append('total_pack_price', totalPrice.toString());
            formData.append('total_pack_points', totalAssignedPoints.toString());

            if (packImage) {
                formData.append('image', packImage);
            }

            // 2. Productos Existentes
            selectedIds.forEach((id, index) => {
                formData.append(`products[${index}]`, id.toString());
                const p = selectedExistingProducts.find(p => p.id === id);
                if (p) {
                    const finalPts = manualPoints[id] !== undefined ? manualPoints[id] : getAutoPoints(parseFloat(p.price.toString()));
                    formData.append(`manual_distributions[${id}]`, finalPts.toString());
                }
            });

            // 3. Productos Personalizados
            customItems.forEach((item, index) => {
                formData.append(`items[${index}][name]`, item.name);
                formData.append(`items[${index}][price]`, item.price.toString());
                
                const finalPts = customManualPoints[item.tempId] !== undefined ? customManualPoints[item.tempId] : item.points;
                formData.append(`items[${index}][points]`, finalPts.toString());

                if (item.image) {
                    formData.append(`items[${index}][image]`, item.image);
                }
            });

            // 🔥 SOLUCIÓN ERROR 1: Usamos 'as any' para evitar conflicto de tipos si el servicio no está actualizado
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await createPack(formData as any);
            
            onSuccess();
            onClose();
        } catch (error) { 
            // 🔥 SOLUCIÓN ERROR 2: Quitamos ': any' y casteamos adentro
            console.error(error);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            alert("Error: " + (err.message || "Error desconocido")); 
        } finally { 
            setLoading(false); 
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] h-auto flex flex-col shadow-2xl animate-in zoom-in-95 overflow-hidden border border-gray-100">
                
                {/* HEADER */}
                <div className="px-6 py-4 border-b bg-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Package className="w-5 h-5 text-purple-600"/> 
                            {step === 1 ? 'Paso 1: Configurar Contenido' : 'Paso 2: Detalles y Reglas'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400"/></button>
                </div>

                {/* BODY SCROLLABLE */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 custom-scrollbar">
                    
                    {step === 1 && (
                        <div className="space-y-6">
                            {/* BARRA DE ACCIÓN */}
                            <div className="flex flex-col md:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                                    <input type="text" placeholder="Buscar en catálogo..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                </div>
                                <button onClick={() => setShowQuickCreate(!showQuickCreate)} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 shadow-sm ${showQuickCreate ? 'bg-purple-900 text-white border-purple-900' : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50'}`}>
                                    <Plus className="w-4 h-4"/> {showQuickCreate ? 'Cerrar Creador' : 'Crear Item Custom'}
                                </button>
                            </div>

                            {/* PANEL CREACIÓN RÁPIDA */}
                            {showQuickCreate && (
                                <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-lg animate-in slide-in-from-top-2 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"/>
                                    <h4 className="text-xs font-bold text-purple-800 uppercase mb-3 flex items-center gap-2"><Package className="w-3 h-3"/> Nuevo Item Personalizado</h4>
                                    
                                    <div className="flex flex-col md:flex-row gap-4 items-start">
                                        <div onClick={() => itemFileInputRef.current?.click()} className={`w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors shrink-0 ${newItemImage ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'}`}>
                                            <input ref={itemFileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setNewItemImage(e.target.files[0])} />
                                            {newItemImage ? <img src={URL.createObjectURL(newItemImage)} className="w-full h-full object-cover rounded-lg" /> : <Camera className="w-6 h-6 text-gray-400"/>}
                                        </div>

                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                                            <div className="md:col-span-3">
                                                <input value={newItemName} onChange={e=>setNewItemName(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Nombre (Ej: Botella)" />
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">S/</span>
                                                <input type="number" value={newItemPrice} onChange={e=>setNewItemPrice(e.target.value)} className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Precio" />
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2 text-xs font-bold text-amber-500">Pts</span>
                                                <input type="number" value={newItemPoints} onChange={e=>setNewItemPoints(e.target.value)} className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Puntos" />
                                            </div>
                                            <button onClick={handleAddCustomItem} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 shadow-md">Agregar al Pack</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* ITEMS PERSONALIZADOS */}
                                {customItems.length > 0 && (
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase">Items Personalizados ({customItems.length})</h3>
                                        <div className="space-y-2">
                                            {customItems.map(item => (
                                                <div key={item.tempId} className="flex items-center gap-3 bg-purple-50 p-2 pr-3 rounded-xl border border-purple-100">
                                                    <div className="w-10 h-10 bg-white rounded-lg border border-purple-100 overflow-hidden flex-shrink-0">
                                                        {item.imagePreview ? <img src={item.imagePreview} className="w-full h-full object-cover"/> : <Package className="w-full h-full p-2 text-purple-200"/>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-purple-900 text-sm truncate">{item.name}</p>
                                                        <p className="text-xs text-purple-600">S/ {item.price.toFixed(2)} • <span className="font-bold">{item.points} pts</span></p>
                                                    </div>
                                                    <button onClick={() => handleRemoveCustomItem(item.tempId)} className="p-1.5 text-purple-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* CATÁLOGO GENERAL */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase">Catálogo General</h3>
                                    <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2">
                                        {allProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => {
                                            const isSelected = selectedIds.includes(product.id);
                                            return (
                                                <div key={product.id} onClick={() => setSelectedIds(prev => prev.includes(product.id) ? prev.filter(i=>i!==product.id) : [...prev, product.id])} className={`cursor-pointer p-2 rounded-xl border flex items-center gap-3 transition-all ${isSelected ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-gray-100 hover:border-blue-300'}`}>
                                                    <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden shrink-0">
                                                        {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover"/> : <Package className="w-full h-full p-2 text-gray-300"/>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-bold text-xs truncate ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>{product.name}</p>
                                                        <p className="text-[10px] text-gray-500">S/ {Number(product.price).toFixed(2)}</p>
                                                    </div>
                                                    {isSelected && <CheckSquare className="w-4 h-4 text-blue-600"/>}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div onClick={() => packFileInputRef.current?.click()} className={`w-32 h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden shrink-0 ${packImage ? 'border-purple-500' : 'border-gray-300 hover:bg-gray-50'}`}>
                                    <input ref={packFileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setPackImage(e.target.files[0])} />
                                    {packImage ? <img src={URL.createObjectURL(packImage)} className="w-full h-full object-cover" /> : <div className="text-center"><ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-1"/><span className="text-[10px] text-gray-500 font-bold">FOTO PACK</span></div>}
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Nombre</label><input value={packName} onChange={e => setPackName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-purple-500 outline-none font-bold" placeholder="Ej: Pack Verano" /></div>
                                        <div className="col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Descripción</label><textarea value={packDescription} onChange={e => setPackDescription(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-purple-500 outline-none h-16 resize-none" placeholder="Contenido..." /></div>
                                    </div>
                                </div>
                            </div>

                            {/* REGLAS */}
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-xs font-bold text-blue-800 uppercase flex items-center gap-2"><Calculator className="w-4 h-4"/> Regla de Conversión</h3>
                                    <select className="bg-white border border-blue-200 text-xs font-bold text-blue-700 rounded-lg px-2 py-1 outline-none" value={selectedRuleId} onChange={(e) => handleRuleSelect(e.target.value)}>
                                        <option value="">-- Personalizada --</option>
                                        {savedRules.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <div className="flex-1 bg-white p-2 rounded-lg border border-blue-100 flex items-center justify-between px-3"><span className="text-xs font-bold text-gray-500">POR CADA</span><div className="flex items-center gap-1"><span className="text-gray-400 font-bold text-xs">S/</span><input type="number" value={ruleMoney} onChange={e => setRuleMoney(parseFloat(e.target.value))} className="w-16 text-right font-bold text-gray-800 outline-none"/></div></div>
                                    <ArrowRight className="w-4 h-4 text-blue-300"/>
                                    <div className="flex-1 bg-white p-2 rounded-lg border border-green-100 flex items-center justify-between px-3"><span className="text-xs font-bold text-gray-500">GANA</span><div className="flex items-center gap-1"><input type="number" value={rulePoints} onChange={e => setRulePoints(parseFloat(e.target.value))} className="w-16 text-right font-bold text-green-600 outline-none"/><span className="text-green-500 font-bold text-xs">Pts</span></div></div>
                                </div>
                            </div>

                            {/* TABLA */}
                            <div className="border rounded-xl overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase border-b">
                                        <tr><th className="px-4 py-3">Producto</th><th className="px-4 py-3 text-right">Precio</th><th className="px-4 py-3 text-right">Pts. Calc</th><th className="px-4 py-3 text-right w-32">Final</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {selectedExistingProducts.map(p => {
                                            const price = parseFloat(p.price.toString());
                                            const autoVal = getAutoPoints(price);
                                            const manualVal = manualPoints[p.id];
                                            return (<tr key={`exist-${p.id}`} className="hover:bg-gray-50"><td className="px-4 py-2 font-medium text-gray-700">{p.name}</td><td className="px-4 py-2 text-right text-gray-500 text-xs">S/ {price.toFixed(2)}</td><td className="px-4 py-2 text-right text-gray-400 text-xs">{autoVal.toFixed(2)}</td><td className="px-4 py-2 text-right"><input type="number" className="w-20 text-right border rounded px-1 py-0.5 text-xs font-bold focus:border-blue-500 outline-none" value={(manualVal !== undefined ? manualVal : autoVal).toFixed(2)} onChange={e => setManualPoints({...manualPoints, [p.id]: parseFloat(e.target.value)})}/></td></tr>);
                                        })}
                                        {customItems.map(p => {
                                            const manualVal = customManualPoints[p.tempId];
                                            return (<tr key={`custom-${p.tempId}`} className="hover:bg-purple-50 bg-purple-50/30"><td className="px-4 py-2 font-medium text-purple-900 flex items-center gap-2"><Package className="w-3 h-3 text-purple-400"/> {p.name}</td><td className="px-4 py-2 text-right text-gray-500 text-xs">S/ {p.price.toFixed(2)}</td><td className="px-4 py-2 text-right text-gray-400 text-xs">{p.points.toFixed(2)}</td><td className="px-4 py-2 text-right"><input type="number" className="w-20 text-right border rounded px-1 py-0.5 text-xs font-bold text-purple-700 border-purple-200 focus:border-purple-500 outline-none" value={(manualVal !== undefined ? manualVal : p.points).toFixed(2)} onChange={e => setCustomManualPoints({...customManualPoints, [p.tempId]: parseFloat(e.target.value)})}/></td></tr>);
                                        })}
                                    </tbody>
                                    <tfoot className="bg-gray-50 border-t">
                                        <tr><td className="px-4 py-2 font-bold text-gray-600 text-xs uppercase">Totales</td><td className="px-4 py-2 text-right font-bold text-gray-900">S/ {totalPrice.toFixed(2)}</td><td className="px-4 py-2 text-right font-bold text-blue-600">Meta: {targetTotalPoints.toFixed(2)}</td><td className="px-4 py-2 text-right"><span className={`font-bold px-2 py-0.5 rounded ${isBalanced ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>{totalAssignedPoints.toFixed(2)}</span></td></tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t bg-white flex justify-between items-center shrink-0">
                    {step === 2 && <button onClick={() => setStep(1)} className="px-5 py-2 rounded-xl border font-bold text-gray-600 text-sm hover:bg-gray-50">Atrás</button>}
                    {step === 1 ? (
                        <div className="flex justify-end w-full"><button onClick={() => (selectedIds.length > 0 || customItems.length > 0) ? setStep(2) : alert("Selecciona al menos 1 producto")} className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-black shadow-lg">Siguiente <ArrowRight className="w-4 h-4 inline ml-1"/></button></div>
                    ) : (
                        <button onClick={handleSavePack} disabled={loading} className={`px-6 py-2 rounded-xl font-bold text-white text-sm flex items-center gap-2 shadow-lg ml-auto ${isBalanced ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}>{loading ? 'Guardando...' : <><Save className="w-4 h-4"/> Guardar Pack</>}</button>
                    )}
                </div>
            </div>
        </div>
    );
};