/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Search, CheckSquare, ArrowRight, Save, Package, Plus, Calculator, Image as ImageIcon, Camera, Trash2, ChevronLeft, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import type { Product, ConversionRule, Pack } from '../../../services/adminPurchaseService';
import { createPack, updatePack, getProductsForSelector, getConversionRules } from '../../../services/adminPurchaseService';

// --- COMPONENTES VISUALES ---
const CustomAlert = ({ type, title, message, onClose }: { type: 'success' | 'error' | 'warning', title: string, message: string, onClose: () => void }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4"><div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 transform transition-all animate-in zoom-in-95"><div className="flex flex-col items-center text-center space-y-4"><div className={`p-4 rounded-full ${type === 'error' ? 'bg-red-50 text-red-500' : type === 'success' ? 'bg-green-50 text-green-500' : 'bg-amber-50 text-amber-500'}`}>{type === 'error' && <X className="w-8 h-8" />}{type === 'success' && <CheckCircle className="w-8 h-8" />}{type === 'warning' && <AlertCircle className="w-8 h-8" />}</div><div><h3 className="text-lg font-extrabold text-gray-900">{title}</h3><p className="text-sm text-gray-500 mt-2 leading-relaxed">{message}</p></div><button onClick={onClose} className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${type === 'error' ? 'bg-red-500 hover:bg-red-600' : type === 'success' ? 'bg-green-500 hover:bg-green-600' : 'bg-amber-500 hover:bg-amber-600'}`}>Entendido</button></div></div></div>
);

const ConfirmationModal = ({ title, message, onConfirm, onCancel }: { title: string, message: string, onConfirm: () => void, onCancel: () => void }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4"><div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 transform transition-all animate-in zoom-in-95"><div className="flex flex-col items-center text-center space-y-4"><div className="p-4 rounded-full bg-blue-50 text-blue-500"><AlertCircle className="w-8 h-8" /></div><div><h3 className="text-lg font-extrabold text-gray-900">{title}</h3><p className="text-sm text-gray-500 mt-2 leading-relaxed">{message}</p></div><div className="flex gap-3 w-full"><button onClick={onCancel} className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Cancelar</button><button onClick={onConfirm} className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-transform active:scale-95">Continuar</button></div></div></div></div>
);

interface CreatePackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    packToEdit?: Pack | null;
}

interface CustomItem { tempId: number; name: string; price: number; points: number; image: File | null; imagePreview: string | null; }
const ITEMS_PER_PAGE = 9; 

export const CreatePackModal: React.FC<CreatePackModalProps> = ({ isOpen, onClose, onSuccess, packToEdit }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    const [alertState, setAlertState] = useState<{ show: boolean, type: 'success' | 'error' | 'warning', title: string, msg: string } | null>(null);
    const [confirmState, setConfirmState] = useState<{ show: boolean, title: string, msg: string, action: () => void } | null>(null);

    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [savedRules, setSavedRules] = useState<ConversionRule[]>([]);
    
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [customItems, setCustomItems] = useState<CustomItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1); 
    
    const [showQuickCreate, setShowQuickCreate] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newItemPoints, setNewItemPoints] = useState('');
    const [newItemImage, setNewItemImage] = useState<File | null>(null);
    const itemFileInputRef = useRef<HTMLInputElement>(null);

    const [packName, setPackName] = useState('');
    const [packDescription, setPackDescription] = useState('');
    const [packImage, setPackImage] = useState<File | null>(null);
    const packFileInputRef = useRef<HTMLInputElement>(null);

    const [selectedRuleId, setSelectedRuleId] = useState<string>(''); 
    const [ruleMoney, setRuleMoney] = useState<number>(3.00);
    const [rulePoints, setRulePoints] = useState<number>(1.00);
    const [manualPoints, setManualPoints] = useState<Record<number, number>>({});
    const [customManualPoints, setCustomManualPoints] = useState<Record<number, number>>({});

    useEffect(() => {
        if (isOpen) {
            initData();
            if (packToEdit) {
                // MODO EDICION
                setStep(1);
                setPackName(packToEdit.name);
                setPackDescription(packToEdit.description || '');
                setPackImage(null); // Importante: empieza null porque no hemos subido archivo nuevo
                
                if (packToEdit.products) {
                    const ids = packToEdit.products.map(p => p.id);
                    setSelectedIds(ids);
                    
                    const pointsMap: Record<number, number> = {};
                    packToEdit.products.forEach(p => {
                        const pivot = (p as any).pivot;
                        if (pivot && pivot.assigned_points) {
                            pointsMap[p.id] = parseFloat(pivot.assigned_points);
                        }
                    });
                    setManualPoints(pointsMap);
                }
                
                setRuleMoney(Number((packToEdit as any).conversion_money) || 0);
                setRulePoints(Number((packToEdit as any).conversion_points) || 0);

                setCustomItems([]); 

            } else {
                // MODO CREACION
                setStep(1); setSelectedIds([]); setCustomItems([]); setPackName(''); setPackDescription('');
                setPackImage(null); setManualPoints({}); setCustomManualPoints({});
                setRuleMoney(3.00); setRulePoints(1.00);
            }
            setShowQuickCreate(false); setSearchTerm(''); setCurrentPage(1); setAlertState(null); setConfirmState(null);
        }
    }, [isOpen, packToEdit]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    const initData = async () => {
        try {
            const [prods, rules] = await Promise.all([getProductsForSelector(), getConversionRules(true)]);
            setAllProducts(prods); setSavedRules(rules);
        } catch (e) { console.error(e); }
    };

    // --- NUEVA LÓGICA DE PREVISUALIZACIÓN DE IMAGEN ---
    // Esto decide qué imagen mostrar: la nueva subida (si existe) o la guardada en BD
    const packPreviewUrl = useMemo(() => {
        if (packImage) return URL.createObjectURL(packImage);
        if (packToEdit) return packToEdit.image_url || packToEdit.image_path; 
        return null;
    }, [packImage, packToEdit]);
    // --------------------------------------------------

    const showAlert = (type: 'success' | 'error' | 'warning', title: string, msg: string) => { setAlertState({ show: true, type, title, msg }); };

    const filteredProducts = allProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleAddCustomItem = () => {
        if (!newItemName || !newItemPrice || !newItemPoints) return showAlert('warning', 'Faltan datos', "Llena nombre, precio y puntos");
        if (parseFloat(newItemPrice) < 0 || parseFloat(newItemPoints) < 0) return showAlert('error', 'Error', "No negativos.");
        setCustomItems(prev => [...prev, { tempId: Date.now(), name: newItemName, price: parseFloat(newItemPrice), points: parseFloat(newItemPoints), image: newItemImage, imagePreview: newItemImage ? URL.createObjectURL(newItemImage) : null }]);
        setNewItemName(''); setNewItemPrice(''); setNewItemPoints(''); setNewItemImage(null); if (itemFileInputRef.current) itemFileInputRef.current.value = ''; setShowQuickCreate(false);
    };

    const handleRemoveCustomItem = (tempId: number) => {
        setCustomItems(prev => prev.filter(item => item.tempId !== tempId));
        const newPoints = { ...customManualPoints }; delete newPoints[tempId]; setCustomManualPoints(newPoints);
    };

    const handleRuleSelect = (ruleId: string) => {
        setSelectedRuleId(ruleId);
        const rule = savedRules.find(r => r.id.toString() === ruleId);
        if (rule) { setRuleMoney(rule.amount_required); setRulePoints(rule.points_awarded); }
    };

    const selectedExistingProducts = useMemo(() => allProducts.filter(p => selectedIds.includes(p.id)), [allProducts, selectedIds]);
    const totalExistingPrice = selectedExistingProducts.reduce((sum, p) => sum + parseFloat(p.price.toString()), 0);
    const totalCustomPrice = customItems.reduce((sum, p) => sum + p.price, 0);
    const totalPrice = totalExistingPrice + totalCustomPrice;
    
    const targetTotalPoints = ruleMoney > 0 ? (totalPrice / ruleMoney) * rulePoints : 0;
    const getAutoPoints = (price: number) => (totalPrice === 0 ? 0 : (price / totalPrice) * targetTotalPoints);

    const totalAssignedPoints = selectedExistingProducts.reduce((sum, p) => sum + (manualPoints[p.id] !== undefined ? manualPoints[p.id] : getAutoPoints(parseFloat(p.price.toString()))), 0) + customItems.reduce((sum, p) => sum + (customManualPoints[p.tempId] !== undefined ? customManualPoints[p.tempId] : p.points), 0);
    const isBalanced = Math.abs(totalAssignedPoints - targetTotalPoints) < 0.05;

    const handleSaveClick = () => {
        if (!packName.trim()) return showAlert('warning', 'Nombre requerido', "Falta nombre");
        if ((selectedIds.length === 0 && customItems.length === 0)) return showAlert('warning', 'Vacío', "Agrega productos");
        if (ruleMoney === 0 && rulePoints === 0) { setConfirmState({ show: true, title: 'Pack Gratuito', msg: "Regla 0/0. Continuar?", action: checkExistingProducts }); return; }
        if (!isBalanced) { setConfirmState({ show: true, title: 'Puntos no coinciden', msg: `Asignado: ${totalAssignedPoints.toFixed(2)} vs Meta: ${targetTotalPoints.toFixed(2)}. Guardar?`, action: checkExistingProducts }); return; }
        checkExistingProducts();
    };

    const checkExistingProducts = () => {
        if (selectedIds.length > 0) { setConfirmState({ show: true, title: 'Actualizar', msg: "Se actualizarán productos existentes. Continuar?", action: executeSave }); return; }
        executeSave(); 
    };

    const executeSave = async () => {
        setConfirmState(null); setLoading(true);
        try {
            const formData = new FormData();
            
            // Datos básicos
            formData.append('name', packName);
            formData.append('description', packDescription || '');
            formData.append('conversion_money', ruleMoney.toString());
            formData.append('conversion_points', rulePoints.toString());
            formData.append('total_pack_price', totalPrice.toString());
            formData.append('total_pack_points', totalAssignedPoints.toString());

            // Solo enviamos imagen si el usuario seleccionó una NUEVA
            if (packImage) {
                formData.append('image', packImage);
            }

            // Productos existentes (IDs)
            selectedIds.forEach((id, index) => {
                formData.append(`products[${index}]`, id.toString());
                const p = selectedExistingProducts.find(p => p.id === id);
                if (p) {
                    const finalPts = manualPoints[id] !== undefined ? manualPoints[id] : getAutoPoints(parseFloat(p.price.toString()));
                    formData.append(`manual_distributions[${id}]`, finalPts.toString());
                }
            });

            // Items personalizados
            customItems.forEach((item, index) => {
                formData.append(`items[${index}][name]`, item.name);
                formData.append(`items[${index}][price]`, item.price.toString());
                const finalPts = customManualPoints[item.tempId] !== undefined ? customManualPoints[item.tempId] : item.points;
                formData.append(`items[${index}][points]`, finalPts.toString());
                
                if (item.image) {
                    formData.append(`items[${index}][image]`, item.image);
                }
            });

            if (packToEdit) {
                // Truco para Laravel: Enviamos POST con _method: PUT
                formData.append('_method', 'PUT');
                
                console.log("Enviando UPDATE con FormData:", Object.fromEntries(formData));
                await updatePack(packToEdit.id, formData as any);
            } else {
                console.log("Enviando CREATE con FormData:", Object.fromEntries(formData));
                await createPack(formData as any);
            }
            
            onSuccess();
            onClose();
        } catch (error) { 
            console.error("Error en executeSave:", error); 
            const err = error as any; 
            const msg = err.response?.data?.message || err.message || "Error al guardar";
            showAlert('error', 'Error', msg);
        } finally { 
            setLoading(false); 
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
            {alertState?.show && <CustomAlert type={alertState.type} title={alertState.title} message={alertState.msg} onClose={() => setAlertState(null)} />}
            {confirmState?.show && <ConfirmationModal title={confirmState.title} message={confirmState.msg} onConfirm={confirmState.action} onCancel={() => setConfirmState(null)} />}

            <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 transform transition-all animate-in zoom-in-95">
                <div className="px-6 py-4 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                            <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Package className="w-5 h-5"/></div>
                            {step === 1 ? (packToEdit ? 'Editar Contenido Pack' : 'Paso 1: Configurar Contenido') : 'Paso 2: Detalles y Reglas'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><X className="w-5 h-5"/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 custom-scrollbar min-h-0">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                                    <input type="text" placeholder="Buscar producto..." className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none shadow-sm transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                </div>
                                <button onClick={() => setShowQuickCreate(!showQuickCreate)} className={`px-5 py-3 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 shadow-sm ${showQuickCreate ? 'bg-purple-900 text-white border-purple-900' : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50'}`}>
                                    <Plus className="w-4 h-4"/> {showQuickCreate ? 'Cerrar' : 'Crear Custom'}
                                </button>
                            </div>

                            {showQuickCreate && (
                                <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-xl animate-in slide-in-from-top-2 relative overflow-hidden">
                                    <h4 className="text-xs font-bold text-purple-800 uppercase mb-4 flex items-center gap-2"><Package className="w-3 h-3"/> Nuevo Item Personalizado</h4>
                                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                                        <div onClick={() => itemFileInputRef.current?.click()} className={`w-full sm:w-24 h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors shrink-0 ${newItemImage ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'}`}><input ref={itemFileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setNewItemImage(e.target.files[0])} />{newItemImage ? <img src={URL.createObjectURL(newItemImage)} className="w-full h-full object-cover rounded-lg" /> : <Camera className="w-6 h-6 text-gray-400"/>}</div>
                                        <div className="flex-1 w-full space-y-3"><input value={newItemName} onChange={e=>setNewItemName(e.target.value)} className="w-full px-4 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Nombre" /><div className="flex gap-3"><div className="relative flex-1"><span className="absolute left-3 top-2 text-xs font-bold text-gray-400">S/</span><input type="number" min="0" value={newItemPrice} onChange={e=>setNewItemPrice(e.target.value)} className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Precio" /></div><div className="relative flex-1"><span className="absolute left-3 top-2 text-xs font-bold text-amber-500">Pts</span><input type="number" min="0" value={newItemPoints} onChange={e=>setNewItemPoints(e.target.value)} className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Puntos" /></div></div><button onClick={handleAddCustomItem} className="w-full bg-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-purple-700 shadow-md transition-colors">Agregar al Pack</button></div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {customItems.length > 0 && (<div className="space-y-2"><h3 className="text-xs font-bold text-gray-400 uppercase">Items Personalizados ({customItems.length})</h3><div className="space-y-2">{customItems.map(item => (<div key={item.tempId} className="flex items-center gap-3 bg-purple-50 p-3 rounded-xl border border-purple-100"><div className="w-10 h-10 bg-white rounded-lg border border-purple-100 overflow-hidden flex-shrink-0">{item.imagePreview ? <img src={item.imagePreview} className="w-full h-full object-cover"/> : <Package className="w-full h-full p-2 text-purple-200"/>}</div><div className="flex-1 min-w-0"><p className="font-bold text-purple-900 text-sm truncate">{item.name}</p><p className="text-xs text-purple-600">S/ {item.price.toFixed(2)} • <span className="font-bold">{item.points} pts</span></p></div><button onClick={() => handleRemoveCustomItem(item.tempId)} className="p-2 text-purple-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button></div>))}</div></div>)}
                                <div className="space-y-2 col-span-1 lg:col-span-2">
                                    <div className="flex justify-between items-center"><h3 className="text-xs font-bold text-gray-400 uppercase">Catalogo General</h3><span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">{filteredProducts.length} items</span></div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">{paginatedProducts.map(product => { const isSelected = selectedIds.includes(product.id); return (<div key={product.id} onClick={() => setSelectedIds(prev => prev.includes(product.id) ? prev.filter(i=>i!==product.id) : [...prev, product.id])} className={`cursor-pointer p-2 rounded-xl border flex items-center gap-3 transition-all ${isSelected ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}><div className="w-10 h-10 rounded-lg bg-gray-50 overflow-hidden shrink-0 border border-gray-100">{product.image_url ? <img src={product.image_url} className="w-full h-full object-cover"/> : <Package className="w-full h-full p-2.5 text-gray-300"/>}</div><div className="flex-1 min-w-0"><p className={`font-bold text-sm truncate ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>{product.name}</p><p className="text-xs text-gray-500 font-medium">S/ {Number(product.price).toFixed(2)}</p></div>{isSelected && <div className="bg-blue-600 text-white rounded-full p-0.5"><CheckSquare className="w-3.5 h-3.5"/></div>}</div>)})}</div>
                                    {totalPages > 1 && (<div className="flex justify-center items-center gap-4 mt-4 pt-3 border-t border-dashed border-gray-200"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg bg-white border hover:bg-gray-50 disabled:opacity-50 transition-colors"><ChevronLeft className="w-4 h-4 text-gray-600"/></button><span className="text-xs text-gray-500 font-bold">Pagina {currentPage} de {totalPages}</span><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg bg-white border hover:bg-gray-50 disabled:opacity-50 transition-colors"><ChevronRight className="w-4 h-4 text-gray-600"/></button></div>)}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            {/* --- AQUÍ ESTÁ EL CAMBIO PARA VISUALIZAR LA IMAGEN AL EDITAR --- */}
                            <div className="flex flex-col md:flex-row gap-6">
                                <div onClick={() => packFileInputRef.current?.click()} className={`w-full md:w-40 h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden shrink-0 ${packPreviewUrl ? 'border-purple-500' : 'border-gray-300 hover:bg-gray-50'}`}>
                                    <input ref={packFileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setPackImage(e.target.files[0])} />
                                    {packPreviewUrl ? (
                                        <img src={packPreviewUrl} className="w-full h-full object-cover" alt="Preview" />
                                    ) : (
                                        <div className="text-center"><ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2"/><span className="text-xs text-gray-500 font-bold">SUBIR FOTO</span></div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-4"><div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Nombre del Pack</label><input value={packName} onChange={e => setPackName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-purple-500 outline-none font-bold" placeholder="Ej: Pack Verano 2025" /></div><div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Descripcion</label><textarea value={packDescription} onChange={e => setPackDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-purple-500 outline-none h-20 resize-none" placeholder="Describe el contenido..." /></div></div>
                            </div>
                            {/* ------------------------------------------------------------- */}

                            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100"><div className="flex justify-between items-center mb-4"><h3 className="text-xs font-bold text-blue-800 uppercase flex items-center gap-2"><Calculator className="w-4 h-4"/> Regla de Conversion</h3><select className="bg-white border border-blue-200 text-xs font-bold text-blue-700 rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:border-blue-400 transition-colors" value={selectedRuleId} onChange={(e) => handleRuleSelect(e.target.value)}><option value="">-- Personalizada --</option>{savedRules.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div><div className="flex flex-col sm:flex-row gap-4 items-center"><div className="flex-1 w-full bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between px-4 shadow-sm"><span className="text-xs font-bold text-gray-500">POR CADA</span><div className="flex items-center gap-1"><span className="text-gray-400 font-bold text-sm">S/</span><input type="number" min="0" value={ruleMoney} onChange={e => setRuleMoney(Math.max(0, parseFloat(e.target.value)))} className="w-20 text-right font-bold text-gray-800 outline-none bg-transparent"/></div></div><ArrowRight className="w-5 h-5 text-blue-300 hidden sm:block"/><div className="flex-1 w-full bg-white p-3 rounded-xl border border-green-100 flex items-center justify-between px-4 shadow-sm"><span className="text-xs font-bold text-gray-500">GANA</span><div className="flex items-center gap-1"><input type="number" min="0" value={rulePoints} onChange={e => setRulePoints(Math.max(0, parseFloat(e.target.value)))} className="w-20 text-right font-bold text-green-600 outline-none bg-transparent"/><span className="text-green-500 font-bold text-sm">Pts</span></div></div></div></div>
                            <div className="border rounded-2xl overflow-hidden shadow-sm"><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase border-b"><tr><th className="px-4 py-3">Producto</th><th className="px-4 py-3 text-right">Precio</th><th className="px-4 py-3 text-right">Pts. Calc</th><th className="px-4 py-3 text-right w-32">Final</th></tr></thead><tbody className="divide-y divide-gray-50">{selectedExistingProducts.map(p => { const price = parseFloat(p.price.toString()); const autoVal = getAutoPoints(price); const manualVal = manualPoints[p.id]; return (<tr key={`exist-${p.id}`} className="hover:bg-gray-50"><td className="px-4 py-2.5 font-medium text-gray-700">{p.name}</td><td className="px-4 py-2.5 text-right text-gray-500 text-xs">S/ {price.toFixed(2)}</td><td className="px-4 py-2.5 text-right text-gray-400 text-xs">{autoVal.toFixed(2)}</td><td className="px-4 py-2.5 text-right"><input type="number" min="0" className="w-20 text-right border rounded px-1 py-1 text-xs font-bold focus:border-blue-500 outline-none" value={(manualVal !== undefined ? manualVal : autoVal).toFixed(2)} onChange={e => setManualPoints({...manualPoints, [p.id]: Math.max(0, parseFloat(e.target.value))})} /></td></tr>); })}{customItems.map(p => { const manualVal = customManualPoints[p.tempId]; return (<tr key={`custom-${p.tempId}`} className="hover:bg-purple-50 bg-purple-50/30"><td className="px-4 py-2.5 font-medium text-purple-900 flex items-center gap-2"><Package className="w-3 h-3 text-purple-400"/> {p.name}</td><td className="px-4 py-2.5 text-right text-gray-500 text-xs">S/ {p.price.toFixed(2)}</td><td className="px-4 py-2.5 text-right text-gray-400 text-xs">{p.points.toFixed(2)}</td><td className="px-4 py-2.5 text-right"><input type="number" min="0" className="w-20 text-right border rounded px-1 py-1 text-xs font-bold text-purple-700 border-purple-200 focus:border-purple-500 outline-none" value={(manualVal !== undefined ? manualVal : p.points).toFixed(2)} onChange={e => setCustomManualPoints({...customManualPoints, [p.tempId]: Math.max(0, parseFloat(e.target.value))})} /></td></tr>); })}</tbody><tfoot className="bg-gray-50 border-t"><tr><td className="px-4 py-3 font-bold text-gray-600 text-xs uppercase">Totales</td><td className="px-4 py-3 text-right font-bold text-gray-900">S/ {totalPrice.toFixed(2)}</td><td className="px-4 py-3 text-right font-bold text-blue-600">Meta: {targetTotalPoints.toFixed(2)}</td><td className="px-4 py-3 text-right"><span className={`font-bold px-2 py-1 rounded text-xs ${isBalanced ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>{totalAssignedPoints.toFixed(2)}</span></td></tr></tfoot></table></div></div>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
                    {step === 2 && <button onClick={() => setStep(1)} className="px-6 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 text-sm hover:bg-gray-50 transition-colors">Atras</button>}
                    {step === 1 ? (
                        <div className="flex justify-end w-full"><button onClick={() => (selectedIds.length > 0 || customItems.length > 0) ? setStep(2) : showAlert('warning', 'Atencion', "Selecciona al menos 1 producto")} className="bg-gray-900 text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-black shadow-lg transition-transform active:scale-95 flex items-center gap-2">Siguiente <ArrowRight className="w-4 h-4 inline ml-1"/></button></div>
                    ) : (
                        <button onClick={handleSaveClick} disabled={loading} className={`px-8 py-2.5 rounded-xl font-bold text-white text-sm flex items-center gap-2 shadow-lg ml-auto transition-transform active:scale-95 ${isBalanced ? 'bg-green-600 hover:bg-green-700' : 'bg-emerald-500 hover:bg-emerald-600'}`}>{loading ? 'Guardando...' : <><Save className="w-4 h-4"/> {packToEdit ? 'Actualizar Pack' : 'Guardar Pack'}</>}</button>
                    )}
                </div>
            </div>
        </div>
    );
};