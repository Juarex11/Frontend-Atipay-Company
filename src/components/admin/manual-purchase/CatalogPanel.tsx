import { useState, useEffect, useRef } from 'react';
import { 
    Search, Package, Plus, Filter, X, Edit, Layers, 
    Save, Calculator, ArrowRight, AlertTriangle, CheckCircle, Camera, Upload,
    Eye, EyeOff, Trash2, ChevronLeft, ChevronRight 
} from 'lucide-react';
import type { Product, Pack, ConversionRule } from '../../../services/adminPurchaseService';
import { createProduct, updateProduct, createConversionRule, deleteProduct, deletePack } from '../../../services/adminPurchaseService';

// --- COMPONENTES DE ALERTAS Y MODALES ---

const CustomAlert = ({ 
    type, title, message, onClose 
}: { 
    type: 'success' | 'error' | 'warning', 
    title: string, 
    message: string, 
    onClose: () => void 
}) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 transform transition-all animate-in zoom-in-95 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1.5 ${type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-amber-500'}`} />
            <div className="flex flex-col items-center text-center space-y-4 pt-2">
                <div className={`p-4 rounded-full ${type === 'error' ? 'bg-red-50 text-red-500' : type === 'success' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-500'}`}>
                    {type === 'error' && <X className="w-8 h-8" />}
                    {type === 'success' && <CheckCircle className="w-8 h-8" />}
                    {type === 'warning' && <AlertTriangle className="w-8 h-8" />}
                </div>
                <div>
                    <h3 className="text-xl font-extrabold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed font-medium">{message}</p>
                </div>
                <button onClick={onClose} className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${type === 'error' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : type === 'success' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/30' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'}`}>
                    Entendido
                </button>
            </div>
        </div>
    </div>
);

const ConfirmModal = ({ 
    title, message, onConfirm, onCancel 
}: { 
    title: string, 
    message: string, 
    onConfirm: () => void, 
    onCancel: () => void 
}) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 transform transition-all animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-full bg-red-50 text-red-500 border border-red-100">
                    <Trash2 className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="text-lg font-extrabold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">{message}</p>
                </div>
                <div className="flex gap-3 w-full mt-2">
                    <button onClick={onCancel} className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Cancelar</button>
                    <button onClick={onConfirm} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-transform active:scale-95">Sí, Eliminar</button>
                </div>
            </div>
        </div>
    </div>
);

interface CatalogPanelProps {
    products: Product[];
    packs: Pack[];
    rules: ConversionRule[];
    loading: boolean;
    onAddProduct: (product: Product) => void;
    onAddPack: (pack: Pack) => void;
    onAddLooseItem: (amount: number, desc: string, ruleId: string | null, manualPoints?: number) => void;
    onSaveCartAsPack: () => void;
    onRulesChange: () => void;
    onEditPack: (pack: Pack) => void;
}

const ITEMS_PER_PAGE = 8; 

export const CatalogPanel = ({ 
    products, packs, rules, loading, 
    onAddProduct, onAddPack, onAddLooseItem, onSaveCartAsPack, onRulesChange, onEditPack 
}: CatalogPanelProps) => {
    
    const [activeTab, setActiveTab] = useState<'catalog' | 'packs'>('catalog');
    const [searchTerm, setSearchTerm] = useState('');
    const [showQuickCreate, setShowQuickCreate] = useState(false);
    
    // Paginación
    const [currentPage, setCurrentPage] = useState(1);

    // Estados para Alertas y Confirmaciones
    const [alertState, setAlertState] = useState<{show: boolean, type: 'success'|'error'|'warning', title: string, msg: string} | null>(null);
    const [confirmState, setConfirmState] = useState<{show: boolean, id: number, type: 'product' | 'pack'} | null>(null);

    const showAlert = (type: 'success'|'error'|'warning', title: string, msg: string) => {
        setAlertState({ show: true, type, title, msg });
    };

    // Estados Formularios
    const [showRuleModal, setShowRuleModal] = useState(false);
    const [newRuleName, setNewRuleName] = useState('');
    const [newRuleMoney, setNewRuleMoney] = useState('');
    const [newRulePoints, setNewRulePoints] = useState('');

    const [prodName, setProdName] = useState('');
    const [prodPrice, setProdPrice] = useState('');
    const [prodPoints, setProdPoints] = useState('');
    const [prodVisible, setProdVisible] = useState(true);
    const [prodImage, setProdImage] = useState<File | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const prodFileInputRef = useRef<HTMLInputElement>(null);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editPrice, setEditPrice] = useState('');
    const [editPoints, setEditPoints] = useState('');
    const [editVisible, setEditVisible] = useState(true);
    const [editImage, setEditImage] = useState<File | null>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);

    const [looseAmount, setLooseAmount] = useState('');
    const [looseDesc, setLooseDesc] = useState('Abarrotes');
    const [selectedRule, setSelectedRule] = useState<string>('manual');
    const [manualPoints, setManualPoints] = useState('');

    useEffect(() => {
        if (rules.length > 0 && selectedRule === 'manual' && !manualPoints) {
            setSelectedRule(rules[0].id.toString());
        }
    }, [rules]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeTab]);

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredPacks = packs.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const currentItems = activeTab === 'catalog' ? filteredProducts : filteredPacks;
    const totalPages = Math.ceil(currentItems.length / ITEMS_PER_PAGE);
    const paginatedItems = currentItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // --- HANDLERS ---

    const handleCreateRule = async () => {
        if (!newRuleName || !newRuleMoney || !newRulePoints) return showAlert('warning', 'Campos Vacíos', 'Por favor completa todos los datos.');
        if (parseFloat(newRuleMoney) < 0 || parseFloat(newRulePoints) < 0) return showAlert('error', 'Valor Inválido', 'No negativos.');
        try {
            await createConversionRule({ name: newRuleName, amount_required: parseFloat(newRuleMoney), points_awarded: parseFloat(newRulePoints), is_active: true });
            onRulesChange(); setShowRuleModal(false); setNewRuleName(''); setNewRuleMoney(''); setNewRulePoints(''); 
            showAlert('success', 'Regla Creada', 'Regla guardada correctamente.');
        } catch (error) { console.error(error); showAlert('error', 'Error', 'No se pudo guardar la regla.'); }
    };

    const handleSaveProduct = async () => {
        if (!prodName.trim() || !prodPrice || !prodPoints) return showAlert('warning', 'Faltan Datos', 'Nombre, Precio y Puntos son obligatorios.');
        if (Number(prodPrice) < 0 || Number(prodPoints) < 0) return showAlert('error', 'Error', 'No negativos.');
        setIsCreating(true);
        try {
            await createProduct({ name: prodName, price: parseFloat(prodPrice), points: parseFloat(prodPoints), stock: 100, type: 'product', description: 'Producto Rápido', image: prodImage, is_visible: prodVisible });
            setProdName(''); setProdPrice(''); setProdPoints(''); setProdImage(null); setProdVisible(true);
            if (prodFileInputRef.current) prodFileInputRef.current.value = '';
            setShowQuickCreate(false); onRulesChange(); 
            showAlert('success', 'Creado', 'Producto agregado con éxito.');
        } catch (error) { console.error(error); const err = error as any; showAlert('error', 'Error', err.message || 'Error inesperado.'); } finally { setIsCreating(false); }
    };

    const requestDelete = (id: number, type: 'product' | 'pack') => { setConfirmState({ show: true, id, type }); };

    const confirmDelete = async () => {
        if (!confirmState) return;
        try {
            if (confirmState.type === 'pack') {
                await deletePack(confirmState.id);
            } else {
                await deleteProduct(confirmState.id);
            }
            onRulesChange(); 
            showAlert('success', 'Eliminado', 'Ítem eliminado correctamente.');
        } catch (error: any) {
            console.error("Error al eliminar:", error);
            const errorMsg = error.message || '';
            if (errorMsg.includes('404') || errorMsg.includes('found') || errorMsg.includes('encontrado')) {
                onRulesChange(); 
                showAlert('warning', 'Aviso', 'El ítem ya no existía, lista actualizada.');
            } else {
                showAlert('error', 'Error', errorMsg || 'No se pudo eliminar.');
            }
        } finally {
            setConfirmState(null);
        }
    };

    const startEdit = (p: Product) => {
        setEditingId(p.id);
        setEditPrice(p.price.toString());
        const realPoints = p.points_earned !== undefined && p.points_earned !== null ? p.points_earned : (p.points || 0);
        setEditPoints(realPoints.toString());
        setEditVisible(!!p.is_visible);
        setEditImage(null); 
    };

    const saveEdit = async (id: number) => {
        if (Number(editPrice) < 0 || Number(editPoints) < 0) return showAlert('error', 'Error', 'No negativos.');
        try {
            const payload: any = { price: parseFloat(editPrice), points: parseFloat(editPoints), is_visible: editVisible };
            if (editImage) payload.image = editImage;
            await updateProduct(id, payload);
            setEditingId(null); setEditImage(null); onRulesChange(); 
            showAlert('success', 'Actualizado', 'Producto editado correctamente.');
        } catch (error) { console.error(error); const err = error as any; showAlert('error', 'Error', err.message || 'No se pudo actualizar.'); }
    };

    const calculatePoints = () => {
        const amount = parseFloat(looseAmount) || 0;
        if (selectedRule === 'manual') return parseFloat(manualPoints) || 0;
        const rule = rules.find(r => r.id.toString() === selectedRule);
        if (!rule) return amount / 3.0; 
        return (amount / rule.amount_required) * rule.points_awarded;
    };

    // ✅ FUNCIÓN CORREGIDA PARA IMÁGENES
    const getPackImage = (pack: any) => {
        // 1. Intentar obtener el campo que tenga datos
        let path = pack.image_url || pack.image_path || pack.image;
        
        if (!path) return null;

        // 2. Si es una URL completa (ej: Cloudinary o S3), devolverla directo
        if (typeof path === 'string' && path.startsWith('http')) return path;

        // 3. Limpieza: Si la base de datos guardó "public/packs/foto.jpg", 
        // debemos quitar "public/" para que la URL sea "storage/packs/foto.jpg"
        path = path.replace('public/', '');

        // 4. Construir URL local (Asegúrate que tu backend corre en el puerto 8000)
        return `http://127.0.0.1:8000/storage/${path}`;
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden relative">
            
            {/* ALERTAS Y MODALES */}
            {alertState?.show && <CustomAlert type={alertState.type} title={alertState.title} message={alertState.msg} onClose={() => setAlertState(null)} />}
            {confirmState?.show && <ConfirmModal title="¿Eliminar Ítem?" message="¿Estás seguro de que deseas eliminar este ítem? Esta acción no se puede deshacer." onConfirm={confirmDelete} onCancel={() => setConfirmState(null)} />}

            {/* TABS */}
            <div className="flex border-b border-gray-100 shrink-0">
                <button onClick={() => setActiveTab('catalog')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'catalog' ? 'text-green-600 border-b-2 border-green-500 bg-green-50/50' : 'text-gray-400 hover:text-gray-600'}`}><Package className="w-4 h-4"/> Catálogo</button>
                <button onClick={() => setActiveTab('packs')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'packs' ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50/50' : 'text-gray-400 hover:text-gray-600'}`}><Layers className="w-4 h-4"/> Packs</button>
            </div>

            {/* CONTENIDO SCROLLABLE */}
            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-60 sm:pb-48"> 
                <div className="relative">
                    <Search className="absolute left-4 top-3.5 text-gray-400 w-4 h-4" />
                    <input type="text" placeholder={activeTab === 'catalog' ? "Buscar producto..." : "Buscar pack..."} className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-green-100 outline-none text-gray-700 font-medium placeholder-gray-400 transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>

                {activeTab === 'catalog' && (
                    <>
                        <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100">
                            <div className="flex justify-between items-center mb-3 cursor-pointer" onClick={() => setShowQuickCreate(!showQuickCreate)}>
                                <h4 className="text-xs font-bold text-orange-600 uppercase flex items-center gap-2"><Plus className="w-3 h-3"/> Creación Rápida</h4>
                                {showQuickCreate ? <X className="w-4 h-4 text-orange-400"/> : <Plus className="w-4 h-4 text-orange-400"/>}
                            </div>
                            {showQuickCreate && (
                                <div className="animate-in slide-in-from-top-2 flex flex-col sm:flex-row gap-3 items-start">
                                    <div onClick={() => prodFileInputRef.current?.click()} className="w-full sm:w-20 h-20 bg-white rounded-xl border-2 border-dashed border-orange-200 hover:border-orange-400 flex items-center justify-center cursor-pointer shrink-0 overflow-hidden relative group">
                                        <input type="file" ref={prodFileInputRef} className="hidden" accept="image/*" onChange={e => setProdImage(e.target.files?.[0] || null)} />
                                        {prodImage ? <img src={URL.createObjectURL(prodImage)} className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-orange-300 group-hover:text-orange-500 transition-colors" />}
                                        {prodImage && <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Edit className="w-4 h-4 text-white"/></div>}
                                    </div>
                                    <div className="flex-1 w-full space-y-3">
                                        <div className="flex gap-2">
                                            <input value={prodName} onChange={e => setProdName(e.target.value)} placeholder="Nombre" className="flex-1 p-2 rounded-lg border border-orange-200 text-sm focus:border-orange-400 outline-none" />
                                            <button onClick={() => setProdVisible(!prodVisible)} className={`p-2 rounded-lg border transition-all ${prodVisible ? 'bg-green-50 border-green-200 text-green-600' : 'bg-gray-100 border-gray-200 text-gray-400'}`} title={prodVisible ? "Visible" : "Oculto"}>
                                                {prodVisible ? <Eye className="w-5 h-5"/> : <EyeOff className="w-5 h-5"/>}
                                            </button>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1"><span className="absolute left-2 top-2 text-xs font-bold text-gray-400">S/</span><input type="number" min="0" value={prodPrice} onChange={e => setProdPrice(e.target.value)} placeholder="0.00" className="w-full pl-6 p-2 rounded-lg border border-orange-200 text-sm focus:border-orange-400 outline-none" /></div>
                                            <div className="relative flex-1"><span className="absolute left-2 top-2 text-xs font-bold text-amber-500">Pts</span><input type="number" min="0" value={prodPoints} onChange={e => setProdPoints(e.target.value)} placeholder="0.00" className="w-full pl-8 p-2 rounded-lg border border-orange-200 text-sm focus:border-orange-400 outline-none" /></div>
                                        </div>
                                        <button onClick={handleSaveProduct} disabled={isCreating} className="w-full bg-orange-500 text-white px-4 py-2.5 rounded-lg font-bold text-xs hover:bg-orange-600 shadow-sm transition-colors">{isCreating ? '...' : 'Crear Producto'}</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                            {loading ? <p className="text-center text-gray-400 col-span-full py-4">Cargando catálogo...</p> : 
                             // @ts-ignore
                             paginatedItems.map((product: Product) => {
                                const displayPoints = product.points_earned !== undefined && product.points_earned !== null ? Number(product.points_earned) : Number(product.points || 0);
                                return (
                                <div key={product.id} className={`group bg-white border border-gray-100 hover:border-green-200 p-3 rounded-2xl transition-all hover:shadow-md flex flex-col justify-between relative overflow-hidden ${!product.is_visible && editingId !== product.id ? 'opacity-60 bg-gray-50' : ''}`}>
                                    
                                    {!product.is_visible && editingId !== product.id && <div className="absolute top-2 left-2 bg-gray-200 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10"><EyeOff className="w-3 h-3"/> Oculto</div>}

                                    <div className="absolute top-0 right-0 p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex gap-1 z-10 bg-white/80 backdrop-blur-sm rounded-bl-2xl">
                                        <button onClick={() => startEdit(product)} className="p-1.5 bg-white shadow rounded-lg text-blue-400 hover:bg-blue-50 hover:text-blue-600 border border-gray-100"><Edit className="w-3.5 h-3.5"/></button>
                                        <button onClick={() => requestDelete(product.id, 'product')} className="p-1.5 bg-white shadow rounded-lg text-red-300 hover:bg-red-50 hover:text-red-500 border border-gray-100"><Trash2 className="w-3.5 h-3.5"/></button>
                                    </div>

                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden relative cursor-pointer ${editingId === product.id ? 'ring-2 ring-green-400' : ''}`} onClick={() => editingId === product.id && editFileInputRef.current?.click()}>
                                            {editingId === product.id && editImage ? <img src={URL.createObjectURL(editImage)} className="w-full h-full object-cover" /> : product.image_url ? <img src={product.image_url} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-gray-300"/>}
                                            {editingId === product.id && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Upload className="w-4 h-4 text-white"/><input type="file" ref={editFileInputRef} className="hidden" accept="image/*" onChange={e => setEditImage(e.target.files?.[0] || null)} /></div>}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-bold text-gray-800 text-sm truncate" title={product.name}>{product.name}</h4>
                                                {editingId === product.id && (
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); setEditVisible(!editVisible); }} className={`ml-2 p-1.5 rounded-lg border transition-all relative z-20 ${editVisible ? 'bg-green-50 border-green-200 text-green-600' : 'bg-gray-100 border-gray-200 text-gray-400'}`} title={editVisible ? "Visible" : "Oculto"}>
                                                        {editVisible ? <Eye className="w-4 h-4"/> : <EyeOff className="w-4 h-4"/>}
                                                    </button>
                                                )}
                                            </div>
                                            {editingId === product.id ? (<div className="flex items-center gap-1 mt-1"><input type="number" min="0" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-16 text-xs border rounded px-1 font-bold" /><button onClick={() => saveEdit(product.id)} className="text-green-600 bg-green-50 p-1 rounded hover:bg-green-100"><CheckSquare className="w-3 h-3"/></button></div>) : (<p className="text-xs text-gray-500 font-medium">S/ {Number(product.price).toFixed(2)}</p>)}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                                        <div className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">{editingId === product.id ? <input type="number" min="0" value={editPoints} onChange={e => setEditPoints(e.target.value)} className="w-12 bg-transparent outline-none border-b border-amber-300" /> : `+${displayPoints.toFixed(2)} pts`}</div>
                                        <button onClick={() => onAddProduct(product)} className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-500 hover:text-white transition-colors"><Plus className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </>
                )}

                {activeTab === 'packs' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-purple-50 p-4 rounded-xl border border-purple-100">
                            <div><h3 className="text-sm font-bold text-purple-900">Gestión de Packs</h3><p className="text-xs text-purple-600 hidden sm:block">Crea packs con lógica.</p></div>
                            <button onClick={onSaveCartAsPack} className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 shadow-md flex items-center gap-2"><Save className="w-3.5 h-3.5"/> Nuevo Pack</button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 pb-2">
                            {/* @ts-ignore */}
                            {paginatedItems.map((pack: Pack) => {
                                // ✅ Usamos la nueva función corregida
                                const packImg = getPackImage(pack);
                                return (
                                <div key={pack.id} className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center justify-between group hover:border-purple-200 transition-all hover:shadow-md relative">
                                    
                                    <div className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex gap-1 bg-white/80 rounded-lg p-1">
                                        <button onClick={() => onEditPack(pack)} className="p-1.5 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"><Edit className="w-4 h-4"/></button>
                                        <button onClick={() => requestDelete(pack.id, 'pack')} className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-400 shrink-0 overflow-hidden">
                                            {packImg ? (
                                                <img 
                                                    src={packImg} 
                                                    className="w-full h-full object-cover rounded-xl"
                                                    onError={(e) => {
                                                        // Fallback si la imagen falla al cargar: Ocultarla y mostrar placeholder
                                                        e.currentTarget.style.display = 'none';
                                                        console.log("Error cargando imagen:", packImg);
                                                    }}
                                                />
                                            ) : <Layers className="w-6 h-6"/>}
                                        </div>
                                        <div className="min-w-0"><h4 className="font-bold text-gray-900 text-sm truncate">{pack.name}</h4><p className="text-xs text-gray-500">S/ {Number(pack.total_pack_price).toFixed(2)} • <span className="text-purple-600 font-bold">{Number(pack.total_pack_points).toFixed(2)} pts</span></p></div>
                                    </div>
                                    <div className="flex gap-2 mt-2 justify-end"><button onClick={() => onAddPack(pack)} className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm transition-colors"><Plus className="w-4 h-4"/></button></div>
                                </div>
                            )})}
                        </div>
                    </div>
                )}

                {/* CONTROLES DE PAGINACIÓN */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-4 py-2">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            <ChevronLeft className="w-5 h-5"/>
                        </button>
                        <span className="text-xs font-bold text-gray-500">
                            Página {currentPage} de {totalPages}
                        </span>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            <ChevronRight className="w-5 h-5"/>
                        </button>
                    </div>
                )}
            </div>

            {/* VENTA LIBRE */}
            <div className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-center mb-3"><h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2"><Filter className="w-3 h-3"/> Venta Libre / Abarrotes</h3></div>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <input value={looseDesc} onChange={e => setLooseDesc(e.target.value)} className="col-span-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:border-green-400 outline-none" placeholder="Descripción (Ej. Arroz)" />
                        <div className="relative"><span className="absolute left-3 top-2.5 text-xs font-bold text-gray-400">S/</span><input type="number" min="0" value={looseAmount} onChange={e => setLooseAmount(e.target.value)} className="w-full pl-8 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:border-green-400 outline-none font-bold" placeholder="0.00" /></div>
                        <div className="flex gap-2">
                            <select value={selectedRule} onChange={e => setSelectedRule(e.target.value)} className="flex-1 px-2 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs focus:border-green-400 outline-none appearance-none font-medium text-gray-600 truncate">
                                <option value="manual">Puntos Manuales</option>
                                {rules.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
                            </select>
                            <button onClick={() => setShowRuleModal(true)} className="px-3 bg-gray-800 text-white rounded-xl hover:bg-black transition-colors" title="Crear nueva regla"><Plus className="w-4 h-4"/></button>
                        </div>
                    </div>
                    {selectedRule === 'manual' && (<div className="animate-in fade-in zoom-in-95 duration-200"><input type="number" min="0" value={manualPoints} onChange={e => setManualPoints(e.target.value)} className="w-full px-3 py-2 bg-amber-50 rounded-xl border border-amber-200 text-sm focus:border-amber-400 outline-none text-amber-900 placeholder-amber-400" placeholder="Ingresar puntos manualmente" /></div>)}
                    <button onClick={() => { if (parseFloat(looseAmount) < 0 || (selectedRule === 'manual' && parseFloat(manualPoints) < 0)) return showAlert('error', 'Valor Negativo', 'No se permiten valores negativos.'); onAddLooseItem(parseFloat(looseAmount), looseDesc, selectedRule, calculatePoints()); setLooseAmount(''); setLooseDesc('Abarrotes'); setManualPoints(''); }} className="w-full py-3.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg"><Plus className="w-4 h-4"/> Agregar a Carrito</button>
                </div>
            </div>

            {/* MODAL NUEVA REGLA (Fixed Full) */}
            {showRuleModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
                            <div><h3 className="text-lg font-extrabold text-gray-800 flex items-center gap-2"><div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Calculator className="w-5 h-5"/></div>Nueva Regla</h3><p className="text-xs text-gray-500 mt-1 ml-1">Define una nueva tasa.</p></div>
                            <button onClick={() => setShowRuleModal(false)} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-sm border border-gray-100 transition-all"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="space-y-1.5"><label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Nombre</label><input value={newRuleName} onChange={e => setNewRuleName(e.target.value)} className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all placeholder:text-gray-400" placeholder="Ej. Promo Verano" autoFocus /></div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-3 relative"><div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1.5 rounded-full shadow-sm border border-gray-100 z-10"><ArrowRight className="w-4 h-4 text-gray-400"/></div><div className="flex-1 space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase text-center block">Venta (S/)</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">S/</span><input type="number" value={newRuleMoney} onChange={e => setNewRuleMoney(e.target.value)} className="w-full pl-8 pr-2 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-center font-bold text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" placeholder="3.00"/></div></div><div className="w-4"></div><div className="flex-1 space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase text-center block">Puntos</label><div className="relative"><input type="number" value={newRulePoints} onChange={e => setNewRulePoints(e.target.value)} className="w-full pl-2 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-center font-bold text-green-600 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all" placeholder="1.00"/><span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 font-bold text-xs">Pts</span></div></div></div>
                            <button onClick={handleCreateRule} className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-gray-900/20 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"><Save className="w-4 h-4"/> Guardar Nueva Regla</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};