/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X, Search, CheckSquare, ArrowRight, Save, Package, Plus,
  Calculator, Image as ImageIcon, Camera, Trash2, ChevronLeft,
  ChevronRight, AlertCircle, CheckCircle, RefreshCcw, Edit3,
  Info, // ✅ Nuevo icono para información
  HelpCircle // ✅ Nuevo icono para ayuda
} from "lucide-react";
import type { Product, ConversionRule, Pack } from "../../../services/adminPurchaseService";
import {
  createPack, updatePack, getProductsForSelector,
  getConversionRules, createConversionRule, deleteConversionRule,
} from "../../../services/adminPurchaseService";

// --- FUNCIÓN DE AYUDA PARA REDONDEO ---
const toDec = (num: number | string | undefined) => {
    const n = parseFloat(String(num || 0));
    return Math.round(n * 100) / 100;
};

// --- COMPONENTES VISUALES ---
const CustomAlert = ({ type, title, message, onClose }: any) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
    <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 animate-in zoom-in-95 text-center">
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${type === 'error' ? 'bg-red-50 text-red-500' : type === 'success' ? 'bg-green-50 text-green-500' : 'bg-amber-50 text-amber-500'}`}>
            {type === 'error' ? <X /> : type === 'success' ? <CheckCircle /> : <AlertCircle />}
        </div>
        <h3 className="text-lg font-extrabold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-2 mb-4 leading-relaxed">{message}</p>
        <button onClick={onClose} className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${type === 'error' ? 'bg-red-500 hover:bg-red-600' : type === 'success' ? 'bg-green-500 hover:bg-green-600' : 'bg-amber-500 hover:bg-amber-600'}`}>
          Entendido
        </button>
    </div>
  </div>
);

const ConfirmationModal = ({ title, message, onConfirm, onCancel }: any) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
    <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 animate-in zoom-in-95 text-center">
        <div className="p-4 bg-blue-50 text-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-extrabold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-2 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Cancelar</button>
            <button onClick={onConfirm} className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg transition-transform active:scale-95">Continuar</button>
        </div>
    </div>
  </div>
);

interface CreatePackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data?: any) => void;
  packToEdit?: Pack | null;
}

interface CustomItem {
  tempId: number;
  name: string;
  price: number;
  points: number;
  image: File | null;
  imagePreview: string | null;
}
const ITEMS_PER_PAGE = 9;

export const CreatePackModal: React.FC<CreatePackModalProps> = ({ isOpen, onClose, onSuccess, packToEdit }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [alertState, setAlertState] = useState<any>(null);
  const [confirmState, setConfirmState] = useState<any>(null);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [savedRules, setSavedRules] = useState<ConversionRule[]>([]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Quick Create
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemPoints, setNewItemPoints] = useState("");
  const [newItemImage, setNewItemImage] = useState<File | null>(null);
  const itemFileInputRef = useRef<HTMLInputElement>(null);

  // Pack Form
  const [packName, setPackName] = useState("");
  const [packDescription, setPackDescription] = useState("");
  const [packImage, setPackImage] = useState<File | null>(null);
  const packFileInputRef = useRef<HTMLInputElement>(null);

  // Rules Logic
  const [useGlobalConversion, setUseGlobalConversion] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string>("");
  const [ruleMoney, setRuleMoney] = useState<number>(3.0);
  const [rulePoints, setRulePoints] = useState<number>(1.0);
  
  // New Rule Creation
  const [newRuleMoney, setNewRuleMoney] = useState("");
  const [newRulePoints, setNewRulePoints] = useState("");
  const [isCreatingRule, setIsCreatingRule] = useState(false);

  const [manualPoints, setManualPoints] = useState<Record<number, number>>({});
  const [customManualPoints, setCustomManualPoints] = useState<Record<number, number>>({});

  useEffect(() => {
    if (isOpen) {
      initData(packToEdit);
    }
  }, [isOpen, packToEdit]);

  const resetForm = () => {
    setStep(1); setSelectedIds([]); setCustomItems([]); setPackName(""); setPackDescription(""); 
    setPackImage(null); setManualPoints({}); setCustomManualPoints({});
    setUseGlobalConversion(false); setRuleMoney(3.0); setRulePoints(1.0); setSelectedRuleId("");
    setShowQuickCreate(false); setSearchTerm(""); setCurrentPage(1); setAlertState(null); setConfirmState(null);
  };

  const initData = async (currentPack?: Pack | null) => {
    try {
      const [prods, rules] = await Promise.all([getProductsForSelector(), getConversionRules(true)]);
      setAllProducts(prods);
      setSavedRules(rules);

      if (currentPack) {
        setStep(1);
        setPackName(currentPack.name);
        setPackDescription(currentPack.description || "");
        setPackImage(null); 

        const convMoney = Number((currentPack as any).conversion_factor_money ?? (currentPack as any).conversion_money) || 0;
        const convPoints = Number((currentPack as any).conversion_factor_points ?? (currentPack as any).conversion_points) || 0;
        
        const isGlobal = convMoney > 0;
        setUseGlobalConversion(isGlobal);

        if (isGlobal) {
          setRuleMoney(convMoney);
          setRulePoints(convPoints);
          const foundRule = rules.find(r => 
             Math.abs(Number(r.amount_required) - convMoney) < 0.01 && 
             Math.abs(Number(r.points_awarded) - convPoints) < 0.01
          );
          if (foundRule) setSelectedRuleId(String(foundRule.id));
          else setSelectedRuleId("");
        } else {
          setRuleMoney(3.0);
          setRulePoints(1.0);
          setSelectedRuleId("");
        }

        if (currentPack.products) {
          const ids = currentPack.products.map((p) => p.id);
          setSelectedIds(ids);

          const totalPackPrice = Number(currentPack.total_pack_price) || 0;
          const totalPackPoints = Number(currentPack.total_pack_points) || 0;
          const pointsMap: Record<number, number> = {};
          
          currentPack.products.forEach((p) => {
            const savedPoints = parseFloat((p as any).pivot?.assigned_points || "0");
            const price = Number(p.price);
            const originalPoints = Number(p.points_earned) || Number(p.points) || 0;
            
            let finalVal = savedPoints > 0 ? savedPoints : originalPoints;

            if (finalVal <= 0 && price > 0 && totalPackPrice > 0 && totalPackPoints > 0) {
                finalVal = (price / totalPackPrice) * totalPackPoints;
            }

            pointsMap[p.id] = toDec(finalVal);
          });
          setManualPoints(pointsMap);
        }
        setCustomItems([]);
      } else {
        resetForm();
      }
    } catch (e) {
      console.error(e);
      setAlertState({type:'error', title:'Error de Conexión', message:'No se pudo conectar con el servidor. Verifica que el backend esté encendido.'});
    }
  };

  const packPreviewUrl = useMemo(() => {
    if (packImage) return URL.createObjectURL(packImage);
    if (packToEdit) return packToEdit.image_url || packToEdit.image_path;
    return null;
  }, [packImage, packToEdit]);

  const selectedExistingProducts = useMemo(() => allProducts.filter((p) => selectedIds.includes(p.id)), [allProducts, selectedIds]);
  const totalExistingPrice = selectedExistingProducts.reduce((sum, p) => sum + Number(p.price), 0);
  const totalCustomPrice = customItems.reduce((sum, p) => sum + Number(p.price), 0);
  const totalPrice = totalExistingPrice + totalCustomPrice;

  const targetTotalPoints = ruleMoney > 0 ? toDec((totalPrice / ruleMoney) * rulePoints) : 0;

  const getAutoPoints = (product: Product | CustomItem) => {
    if (ruleMoney > 0 && totalPrice > 0) {
      return toDec((Number(product.price) / totalPrice) * targetTotalPoints);
    }
    return 'points_earned' in product ? toDec(Number(product.points_earned) || Number(product.points) || 0) : toDec(product.points);
  };

  const handleApplyRuleToManual = () => {
    setConfirmState({
        title: "Editar Manualmente",
        message: "Se aplicarán los puntos calculados por la regla actual a cada producto y se activará el modo manual para que puedas hacer ajustes finos.",
        action: executeApplyRule
    });
  };

  const executeApplyRule = () => {
    const newManualPoints = { ...manualPoints };
    const newCustomPoints = { ...customManualPoints };
    selectedExistingProducts.forEach(p => { newManualPoints[p.id] = getAutoPoints(p); });
    customItems.forEach(p => { newCustomPoints[p.tempId] = getAutoPoints(p) as number; });
    setManualPoints(newManualPoints);
    setCustomManualPoints(newCustomPoints);
    setUseGlobalConversion(false); 
    setConfirmState(null);
    setAlertState({ type: 'success', title: 'Modo Manual Activado', message: 'Ahora puedes editar los puntos casilla por casilla.' });
  };

  const handleRestoreOriginals = () => {
    setConfirmState({
        title: "Restaurar Puntos",
        message: "¿Estás seguro? Se borrarán todos los cambios manuales y reglas aplicadas. Los productos volverán a tener sus puntos originales del catálogo.",
        action: executeRestore
    });
  };

  const executeRestore = () => {
    const newManualPoints: Record<number, number> = {};
    selectedExistingProducts.forEach(p => {
        const pEarned = Number(p.points_earned);
        const pBase = Number(p.points);
        const originalVal = pEarned > 0 ? pEarned : (pBase > 0 ? pBase : 0);
        newManualPoints[p.id] = toDec(originalVal);
    });
    setManualPoints(newManualPoints);
    setCustomManualPoints({});
    setUseGlobalConversion(false);
    setConfirmState(null);
    setAlertState({ type: 'success', title: 'Restaurado', message: 'Los puntos han vuelto a sus valores originales.' });
  };

  const individualSumPoints = 
      selectedExistingProducts.reduce((sum, p) => sum + (manualPoints[p.id] ?? Number(getAutoPoints(p))), 0) + 
      customItems.reduce((sum, p) => sum + (customManualPoints[p.tempId] ?? Number(p.points)), 0);

  const finalPackPoints = toDec(useGlobalConversion ? targetTotalPoints : individualSumPoints);
  const isBalanced = Math.abs(finalPackPoints - targetTotalPoints) < 0.05;

  const handleRuleSelect = (ruleId: string) => {
    setSelectedRuleId(ruleId);
    if (ruleId !== "new") {
      const rule = savedRules.find((r) => String(r.id) === ruleId);
      if (rule) { setRuleMoney(rule.amount_required); setRulePoints(rule.points_awarded); }
    } else { setNewRuleMoney(""); setNewRulePoints(""); }
  };

  const handleCreateNewRule = async () => {
      const m = parseFloat(newRuleMoney), p = parseFloat(newRulePoints);
      if(!m || !p) return setAlertState({type:'warning', title:'Datos Inválidos', message:'Por favor ingresa montos mayores a 0 para crear la regla.'});
      setIsCreatingRule(true);
      try {
          const response = await createConversionRule({ name: `R: ${m}->${p}`, amount_required: m, points_awarded: p });
          const newRule = (response as any).data || (response as any).rule || response;

          if (newRule && newRule.id) {
              setSavedRules(prev => [...prev, newRule]); 
              setSelectedRuleId(String(newRule.id));
              setRuleMoney(m); setRulePoints(p);
              setAlertState({type:'success', title:'Regla Creada', message:'La regla de conversión se ha guardado correctamente y está seleccionada.'});
          } else {
              const freshRules = await getConversionRules(true);
              setSavedRules(freshRules);
              const created = freshRules.find((r: any) => Math.abs(Number(r.amount_required) - m) < 0.01 && Math.abs(Number(r.points_awarded) - p) < 0.01);
              if(created) { setSelectedRuleId(String(created.id)); setRuleMoney(m); setRulePoints(p); }
              setAlertState({type:'success', title:'Regla Creada', message:'Regla guardada y lista actualizada.'});
          }
      } catch(e) { 
          console.error(e); 
          setAlertState({type:'error', title:'Error', message:'No se pudo crear la regla. Intenta nuevamente.'}); 
      } 
      finally { setIsCreatingRule(false); }
  };

  const handleDeleteRule = (e:any, id:string) => {
      e.stopPropagation();
      setConfirmState({
          title: "Eliminar Regla",
          message: "¿Estás seguro de que deseas eliminar permanentemente esta regla de conversión? Esta acción no se puede deshacer.",
          action: () => executeDeleteRule(id)
      });
  };

  const executeDeleteRule = async (id: string) => {
      setConfirmState(null);
      try { 
          await deleteConversionRule(id); 
          setSavedRules(prev => prev.filter(r => String(r.id) !== String(id))); 
          if(selectedRuleId === id) setSelectedRuleId(""); 
          setAlertState({type:'success', title:'Eliminado', message:'La regla ha sido eliminada correctamente.'});
      } catch {
          setAlertState({type:'error', title:'Error', message: "No se pudo eliminar la regla. Puede que esté en uso."});
      }
  };

  const handleNextStep = () => {
    if (selectedIds.length > 0 || customItems.length > 0) {
      setStep(2);
    } else {
      setAlertState({ type: 'warning', title: 'Selección Vacía', message: 'Debes seleccionar al menos un producto del catálogo o crear un item personalizado.' });
    }
  };

  const handleSaveClick = () => {
    if (!packName.trim()) return setAlertState({type:'warning', title:'Falta Nombre', message:'El pack necesita un nombre para ser identificado.'});
    if (!selectedIds.length && !customItems.length) return setAlertState({type:'warning', title:'Pack Vacío', message:'El pack no tiene productos. Agrega al menos uno.'});
    
    setConfirmState({ 
        title: packToEdit ? "Actualizar Pack" : "Guardar Pack", 
        message: packToEdit 
            ? "¿Estás seguro de actualizar este pack con la configuración actual?" 
            : "¿Deseas crear este nuevo pack y publicarlo en el catálogo?", 
        action: executeSave 
    });
  };

  const executeSave = async () => {
    setConfirmState(null); setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", packName); fd.append("description", packDescription);
      fd.append("conversion_money", useGlobalConversion ? ruleMoney.toString() : "0");
      fd.append("conversion_points", useGlobalConversion ? rulePoints.toString() : "0");
      fd.append("total_pack_price", totalPrice.toString());
      fd.append("total_pack_points", finalPackPoints.toString());
      if (packImage) fd.append("image", packImage);

      selectedIds.forEach((id, i) => {
        fd.append(`products[${i}]`, id.toString());
        const auto = getAutoPoints(selectedExistingProducts.find(p=>p.id===id)!);
        const manual = manualPoints[id];
        const ptToSend = !useGlobalConversion ? (manual !== undefined ? manual : Number(auto)) : 0;
        fd.append(`manual_distributions[${id}]`, ptToSend.toString());
      });

      customItems.forEach((item, i) => {
        fd.append(`items[${i}][name]`, item.name); 
        fd.append(`items[${i}][price]`, item.price.toString());
        fd.append(`items[${i}][points]`, item.points.toString()); 

        const auto = getAutoPoints(item);
        const manual = customManualPoints[item.tempId];
        const ptAssigned = !useGlobalConversion ? (manual !== undefined ? manual : Number(auto)) : 0;
        
        fd.append(`items[${i}][assigned_points]`, ptAssigned.toString());

        if (item.image) fd.append(`items[${i}][image]`, item.image);
      });

      const res = packToEdit ? await updatePack(packToEdit.id, fd) : await createPack(fd);
      onSuccess(res); onClose();
    } catch (e: any) { 
        setAlertState({type:'error', title:'Error al Guardar', message: e.message || "Ocurrió un error inesperado al procesar la solicitud."}); 
    } finally { setLoading(false); }
  };

  const filteredProducts = allProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const paginated = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
      {alertState && <CustomAlert type={alertState.type} title={alertState.title} message={alertState.message} onClose={() => setAlertState(null)} />}
      {confirmState && <ConfirmationModal title={confirmState.title} message={confirmState.message} onConfirm={confirmState.action} onCancel={() => setConfirmState(null)} />}

      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 border border-gray-100">
        
        {/* HEADER CON TÍTULO INFORMATIVO */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
            <div>
                <h2 className="text-lg font-extrabold flex items-center gap-2 text-gray-900">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Package className="w-5 h-5"/></div>
                    {step===1 ? (packToEdit ? "Editar Contenido del Pack" : "Paso 1: Seleccionar Productos") : "Paso 2: Configurar Detalles y Puntos"}
                </h2>
                <p className="text-xs text-gray-500 mt-1 ml-11">
                    {step===1 ? "Elige los productos que formarán parte de este paquete." : "Define el precio, nombre y cómo se distribuirán los puntos."}
                </p>
            </div>
            <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"><X className="w-5 text-gray-500"/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 custom-scrollbar">
          {step === 1 ? (
             <div className="space-y-6">
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 text-gray-400 w-4"/>
                        <input className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-purple-500 shadow-sm" placeholder="Buscar producto en inventario..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
                    </div>
                    <button onClick={()=>setShowQuickCreate(!showQuickCreate)} className={`px-5 rounded-xl font-bold text-sm border flex items-center gap-2 transition-all shadow-sm ${showQuickCreate ? 'bg-purple-900 text-white border-purple-900' : 'bg-white text-purple-700 hover:bg-purple-50 border-purple-200'}`}>
                        {showQuickCreate ? 'Cerrar Creador' : '+ Crear Item Custom'}
                    </button>
                </div>

                {/* INFO BOX PARA ITEMS CUSTOM */}
                {showQuickCreate && (
                    <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-lg animate-in slide-in-from-top-2 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                        <h4 className="text-xs font-bold text-purple-800 uppercase mb-4 flex items-center gap-2">
                            <Plus className="w-4 h-4"/> Crear Item Personalizado (Fuera de Inventario)
                        </h4>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input type="file" ref={itemFileInputRef} className="hidden" onChange={e => e.target.files && setNewItemImage(e.target.files[0])}/>
                            <div onClick={()=>itemFileInputRef.current?.click()} className={`w-24 h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer shrink-0 transition-colors ${newItemImage?'border-purple-500 bg-purple-50':'border-gray-300 hover:border-purple-400 hover:bg-gray-50'}`}>
                                {newItemImage?<img src={URL.createObjectURL(newItemImage)} className="w-full h-full object-cover rounded-lg"/>:<Camera className="text-gray-400"/>}
                                {!newItemImage && <span className="text-[10px] text-gray-400 mt-1">Foto</span>}
                            </div>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Nombre del Producto</label>
                                    <input placeholder="Ej: Camiseta Edición Especial" className="w-full border p-2 rounded-lg text-sm focus:border-purple-500 outline-none" value={newItemName} onChange={e=>setNewItemName(e.target.value)}/>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Precio (S/)</label>
                                        <input type="number" className="w-full border p-2 rounded-lg text-sm focus:border-purple-500 outline-none" value={newItemPrice} onChange={e=>setNewItemPrice(e.target.value)} placeholder="0.00"/>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Puntos Base</label>
                                        <input type="number" className="w-full border p-2 rounded-lg text-sm focus:border-purple-500 outline-none" value={newItemPoints} onChange={e=>setNewItemPoints(e.target.value)} placeholder="0"/>
                                    </div>
                                </div>
                                <button onClick={()=> {
                                    if(!newItemName || !newItemPrice) return setAlertState({type:'warning', title:'Faltan Datos', message:'Debes ingresar al menos el nombre y el precio.'});
                                    setCustomItems(prev=>[...prev, {tempId: Date.now(), name: newItemName, price: parseFloat(newItemPrice), points: toDec(parseFloat(newItemPoints||'0')), image: newItemImage, imagePreview: newItemImage?URL.createObjectURL(newItemImage):null}]);
                                    setShowQuickCreate(false); setNewItemName(""); setNewItemPrice(""); setNewItemPoints(""); setNewItemImage(null);
                                }} className="w-full bg-purple-600 text-white p-2.5 rounded-lg font-bold text-sm hover:bg-purple-700 shadow-md transition-transform active:scale-95">
                                    Agregar al Pack
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {paginated.map(p=>(
                        <div key={p.id} onClick={()=>setSelectedIds(prev=>prev.includes(p.id)?prev.filter(i=>i!==p.id):[...prev,p.id])} className={`group p-3 rounded-xl border cursor-pointer flex gap-3 items-center transition-all ${selectedIds.includes(p.id)?'border-blue-500 bg-blue-50 ring-1 ring-blue-500 shadow-md':'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}>
                            <div className="w-12 h-12 bg-gray-100 rounded-lg shrink-0 overflow-hidden border border-gray-100 relative">
                                {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover"/> : <Package className="w-full h-full p-3 text-gray-300"/>}
                                {selectedIds.includes(p.id) && <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center"><CheckCircle className="text-white w-6 h-6 drop-shadow-md"/></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`font-bold text-sm truncate ${selectedIds.includes(p.id)?'text-blue-900':'text-gray-700'}`}>{p.name}</p>
                                <p className="text-xs text-gray-500 font-medium">S/ {toDec(Number(p.price))}</p>
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* PAGINACIÓN */}
                <div className="flex justify-center items-center gap-4 pt-4 border-t border-dashed border-gray-200">
                    <button onClick={()=>setCurrentPage(p=>Math.max(1, p-1))} disabled={currentPage===1} className="p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 disabled:opacity-30 transition-all"><ChevronLeft className="w-5 h-5 text-gray-600"/></button>
                    <span className="text-xs font-bold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">Página {currentPage} de {totalPages}</span>
                    <button onClick={()=>setCurrentPage(p=>Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 disabled:opacity-30 transition-all"><ChevronRight className="w-5 h-5 text-gray-600"/></button>
                </div>

                {customItems.length > 0 && (
                    <div className="space-y-3 mt-6">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase">Items Personalizados ({customItems.length})</h3>
                            <div className="h-px bg-gray-200 flex-1"></div>
                        </div>
                        {customItems.map(i=>(
                            <div key={i.tempId} className="flex justify-between items-center bg-purple-50 p-3 rounded-xl border border-purple-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-white overflow-hidden border border-purple-100">{i.imagePreview ? <img src={i.imagePreview} className="w-full h-full object-cover"/> : <Package className="p-2 text-purple-300"/>}</div>
                                    <div><p className="font-bold text-purple-900 text-sm">{i.name}</p><p className="text-xs text-purple-600">S/ {toDec(i.price)}</p></div>
                                </div>
                                <button onClick={()=>setCustomItems(prev=>prev.filter(x=>x.tempId!==i.tempId))} className="p-2 text-purple-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        ))}
                    </div>
                )}
             </div>
          ) : (
            <div className="space-y-8">
              {/* SECCIÓN DETALLES */}
              <div className="flex flex-col md:flex-row gap-6">
                <div onClick={()=>packFileInputRef.current?.click()} className={`w-full md:w-48 h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group transition-all ${packPreviewUrl?'border-purple-500 bg-white':'border-gray-300 hover:border-purple-400 hover:bg-purple-50'}`}>
                    <input ref={packFileInputRef} type="file" className="hidden" onChange={e=>e.target.files && setPackImage(e.target.files[0])}/>
                    {packPreviewUrl ? (
                        <>
                            <img src={packPreviewUrl} className="w-full h-full object-cover"/>
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">Cambiar</span>
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-gray-400">
                            <ImageIcon className="w-10 h-10 mx-auto mb-2 text-gray-300 group-hover:text-purple-400 transition-colors"/>
                            <span className="text-xs font-bold block">SUBIR FOTO</span>
                            <span className="text-[10px]">(Opcional)</span>
                        </div>
                    )}
                </div>
                <div className="flex-1 space-y-5">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Nombre del Pack <span className="text-red-500">*</span></label>
                        <input value={packName} onChange={e=>setPackName(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 font-bold text-gray-800 focus:ring-2 focus:ring-purple-500 outline-none transition-shadow" placeholder="Ej: Pack Verano 2025"/>
                        <p className="text-[10px] text-gray-400 mt-1 ml-1">Este nombre será visible para los clientes.</p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Descripción</label>
                        <textarea value={packDescription} onChange={e=>setPackDescription(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 h-24 resize-none focus:ring-2 focus:ring-purple-500 outline-none transition-shadow" placeholder="Describe qué incluye este paquete..."/>
                    </div>
                </div>
              </div>

              {/* SECCIÓN PUNTOS */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-t-2xl"></div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h3 className="font-bold text-slate-800 flex gap-2 items-center text-lg">
                            <Calculator className="w-5 h-5 text-purple-600"/> Configuración de Puntos
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Define cómo ganan puntos los clientes al comprar este pack.</p>
                    </div>
                    <div className="flex bg-white p-1 rounded-xl border shadow-sm self-end sm:self-auto">
                        <button onClick={()=>setUseGlobalConversion(false)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!useGlobalConversion?'bg-purple-100 text-purple-700 shadow-sm':'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>Individual / Manual</button>
                        <button onClick={()=>setUseGlobalConversion(true)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${useGlobalConversion?'bg-purple-600 text-white shadow-md':'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>Regla Global</button>
                    </div>
                </div>

                {useGlobalConversion ? (
                    <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
                        {/* ALERT INFO */}
                        <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-xs">
                            <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-500"/>
                            <div>
                                <strong className="block mb-1">Modo: Regla Global</strong>
                                Los puntos se calculan automáticamente repartiendo el total proporcionalmente según el precio de cada producto.
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-purple-100 shadow-sm">
                            <label className="text-xs font-bold text-purple-700 uppercase mb-3 block flex justify-between">
                                <span>Seleccionar Regla de Conversión</span>
                                <span title="Define cuánto vale el dinero en puntos para este pack">
                                    <HelpCircle className="w-4 h-4 text-purple-300 cursor-help" />
                                </span>
                            </label>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <select value={selectedRuleId} onChange={e=>handleRuleSelect(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500 appearance-none">
                                        <option value="">-- Seleccionar una regla guardada --</option>
                                        {savedRules.map(r=><option key={String(r.id)} value={String(r.id)}>{r.name} (S/{r.amount_required} = {r.points_awarded} pts)</option>)}
                                        <option value="new" className="text-purple-600 font-extrabold">+ Crear Nueva Regla</option>
                                    </select>
                                    <ChevronRight className="w-4 h-4 text-gray-400 absolute right-3 top-3.5 rotate-90 pointer-events-none"/>
                                </div>
                                {selectedRuleId && selectedRuleId!=='new' && <button onClick={(e)=>handleDeleteRule(e, selectedRuleId)} className="px-4 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl border border-transparent hover:border-red-100 transition-all" title="Eliminar regla"><Trash2 className="w-5 h-5"/></button>}
                            </div>
                            
                            {selectedRuleId === 'new' && (
                                <div className="flex gap-4 mt-4 items-end p-4 bg-purple-50 rounded-xl border border-purple-100 animate-in zoom-in-95">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-purple-400 block mb-1 uppercase">Por cada (S/)</label>
                                        <input type="number" className="w-full border border-purple-200 bg-white p-2 rounded-lg font-bold text-sm outline-none focus:border-purple-500" value={newRuleMoney} onChange={e=>setNewRuleMoney(e.target.value)} placeholder="0.00"/>
                                    </div>
                                    <ArrowRight className="w-5 h-5 mb-3 text-purple-300"/>
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-purple-400 block mb-1 uppercase">Gana (Pts)</label>
                                        <input type="number" className="w-full border border-purple-200 bg-white p-2 rounded-lg font-bold text-sm text-green-600 outline-none focus:border-green-500" value={newRulePoints} onChange={e=>setNewRulePoints(e.target.value)} placeholder="0.00"/>
                                    </div>
                                    <button onClick={handleCreateNewRule} disabled={isCreatingRule} className="bg-purple-600 text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-purple-700 shadow-md transition-transform active:scale-95">Guardar Regla</button>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition-colors cursor-pointer group" onClick={handleApplyRuleToManual}>
                            <div className="p-3 bg-blue-50 rounded-full text-blue-600 group-hover:bg-blue-100 transition-colors"><Edit3 className="w-5 h-5"/></div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-800 font-bold">¿Quieres ajustar los puntos manualmente?</p>
                                <p className="text-xs text-gray-500">Aplica la regla actual a los productos y cambia al modo edición.</p>
                            </div>
                            <button className="text-blue-600 text-xs font-bold bg-blue-50 px-4 py-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                                Editar Manualmente
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
                        {/* ALERT INFO */}
                        <div className="flex items-start gap-3 bg-slate-100 p-4 rounded-xl border border-slate-200 text-slate-600 text-xs">
                            <Edit3 className="w-5 h-5 shrink-0 mt-0.5 text-slate-400"/>
                            <div>
                                <strong className="block mb-1 text-slate-800">Modo: Manual / Individual</strong>
                                Puedes escribir libremente cuántos puntos otorga cada producto en la columna "Final".
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button onClick={handleRestoreOriginals} className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 px-4 py-2.5 rounded-xl transition-all shadow-sm">
                                <RefreshCcw className="w-3.5 h-3.5"/> Restaurar Valores Originales
                            </button>
                        </div>
                    </div>
                )}
              </div>

              {/* TABLA DE PRODUCTOS */}
              <div className="border rounded-2xl overflow-hidden bg-white shadow-sm ring-1 ring-gray-100">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50/80 text-xs font-bold text-gray-500 uppercase border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left">Producto</th>
                            <th className="px-6 py-4 text-right" title="Precio unitario del producto">Precio (S/)</th>
                            <th className="px-6 py-4 text-right text-gray-400" title="Cálculo automático según regla">Pts Calc.</th>
                            <th className="px-6 py-4 text-right w-40" title="Valor final que se guardará">Puntos Finales</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {selectedExistingProducts.map(p => {
                            const autoVal = getAutoPoints(p);
                            const manualVal = manualPoints[p.id];
                            const displayVal = manualVal !== undefined ? manualVal : (useGlobalConversion ? autoVal : (Number(p.points_earned)||0));

                            return (
                                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-3 font-medium text-gray-700">{p.name}</td>
                                    <td className="px-6 py-3 text-right text-gray-500 text-xs">S/ {toDec(Number(p.price)).toFixed(2)}</td>
                                    <td className="px-6 py-3 text-right text-gray-400 text-xs font-mono">{autoVal.toFixed(2)}</td>
                                    <td className="px-6 py-3 text-right">
                                        {useGlobalConversion ? (
                                            <span className="font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-lg text-sm">{autoVal.toFixed(2)}</span>
                                        ) : (
                                            <input type="number" className="w-24 text-right border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-bold text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                                                value={displayVal}
                                                onChange={e => setManualPoints({...manualPoints, [p.id]: parseFloat(e.target.value)})}
                                                onBlur={e => setManualPoints({...manualPoints, [p.id]: toDec(parseFloat(e.target.value || "0"))})}
                                            />
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                        {customItems.map(p => {
                            const autoVal = getAutoPoints(p);
                            const manualVal = customManualPoints[p.tempId];
                            const displayVal = manualVal !== undefined ? manualVal : (useGlobalConversion ? autoVal : p.points);

                            return (
                                <tr key={p.tempId} className="bg-purple-50/20 hover:bg-purple-50/40 transition-colors">
                                    <td className="px-6 py-3 font-medium text-purple-900 flex items-center gap-2">
                                        <div className="p-1 bg-white rounded-md shadow-sm"><Package className="w-3 h-3 text-purple-500"/></div>
                                        {p.name} <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded font-bold">CUSTOM</span>
                                    </td>
                                    <td className="px-6 py-3 text-right text-gray-500 text-xs">S/ {p.price.toFixed(2)}</td>
                                    <td className="px-6 py-3 text-right text-gray-400 text-xs font-mono">{autoVal.toFixed(2)}</td>
                                    <td className="px-6 py-3 text-right">
                                        {useGlobalConversion ? (
                                            <span className="font-bold text-purple-700 bg-white px-3 py-1 rounded-lg text-sm shadow-sm border border-purple-100">{autoVal.toFixed(2)}</span>
                                        ) : (
                                            <input type="number" className="w-24 text-right border border-purple-200 bg-white rounded-lg px-3 py-1.5 text-sm font-bold text-purple-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                                                value={displayVal}
                                                onChange={e => setCustomManualPoints({...customManualPoints, [p.tempId]: parseFloat(e.target.value)})}
                                                onBlur={e => setCustomManualPoints({...customManualPoints, [p.tempId]: toDec(parseFloat(e.target.value || "0"))})}
                                            />
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-100">
                        <tr>
                            <td className="px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Totales Generales</td>
                            <td className="px-6 py-4 text-right font-bold text-gray-900 text-sm">S/ {totalPrice.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right font-bold text-blue-600 text-xs">{useGlobalConversion && `Meta Global: ${targetTotalPoints.toFixed(2)}`}</td>
                            <td className="px-6 py-4 text-right">
                                <span className={`px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm border ${isBalanced ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                    {finalPackPoints.toFixed(2)} pts
                                </span>
                            </td>
                        </tr>
                    </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-white flex justify-between rounded-b-3xl items-center sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {step===2 && <button onClick={()=>setStep(1)} className="px-6 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 text-sm hover:bg-gray-50 hover:text-gray-900 transition-colors">Atrás</button>}
            <div className="flex-1"></div>
            <button onClick={step===1 ? handleNextStep : handleSaveClick} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-black shadow-lg shadow-gray-900/20 transition-all active:scale-95">
                {step===1 ? <>Siguiente <ArrowRight className="w-4 h-4"/></> : (loading ? 'Guardando...' : <><Save className="w-4 h-4"/> Guardar Pack</>)}
            </button>
        </div>
      </div>
    </div>
  );
};