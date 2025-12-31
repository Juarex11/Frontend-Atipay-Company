import { useState, useRef } from 'react';
import { 
    Search, Plus, Package, Zap, Layers, Save, Loader2, Pencil, Ban, 
    Eye, EyeOff, Info, X, Tag, Box, CheckCircle, ShoppingCart, Camera, Image as ImageIcon 
} from 'lucide-react';

import { 
    type Product, type Pack, 
    createProduct, updateProduct, deletePack, togglePackStatus 
} from '../../../services/adminPurchaseService';

interface CatalogPanelProps {
    products: Product[];
    packs: Pack[];
    loading: boolean;
    onAddProduct: (product: Product) => void;
    onAddPack: (pack: Pack) => void;
    onSaveCartAsPack: () => void;
    onRulesChange: () => void;
    onEditPack: (pack: Pack) => void;
}

export const CatalogPanel = ({ 
    products, 
    packs, 
    loading, 
    onAddProduct, 
    onAddPack, 
    onSaveCartAsPack,
    onRulesChange,
    onEditPack
}: CatalogPanelProps) => {
    
    // --- ESTADOS GLOBALES ---
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'catalog' | 'packs'>('catalog');
    
    // --- ESTADOS DE GESTIÓN DE PRODUCTO ---
    const [idToEdit, setIdToEdit] = useState<number | null>(null);
    const [prodName, setProdName] = useState('');
    const [prodPrice, setProdPrice] = useState('');
    const [prodPoints, setProdPoints] = useState('');
    
    // NUEVOS ESTADOS PARA IMAGEN Y DESCRIPCIÓN
    const [prodDescription, setProdDescription] = useState('');
    const [prodImage, setProdImage] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isVisible, setIsVisible] = useState(true); 
    const [isProcessing, setIsProcessing] = useState(false);

    // --- ESTADO PARA EL MODAL DE DETALLE ---
    const [viewProduct, setViewProduct] = useState<Product | null>(null);

    // --- TOAST ---
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getPoints = (p: any) => {
        const val = p.points ?? p.points_earned ?? 0;
        return Number(val) || 0;
    };

    // =========================================================================
    // HANDLERS
    // =========================================================================

    const handleEditProductClick = (e: React.MouseEvent, p: Product) => {
        e.stopPropagation();
        setIdToEdit(p.id);
        setProdName(p.name);
        setProdPrice(p.price.toString());
        setProdPoints(getPoints(p).toFixed(2));
        setProdDescription(p.description || ''); // Cargar descripción existente
        setIsVisible(p.is_visible !== false && p.is_visible !== 0); 
        setProdImage(null); // Resetear imagen nueva al editar
        document.querySelector('.catalog-header')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setIdToEdit(null);
        setProdName('');
        setProdPrice('');
        setProdPoints('');
        setProdDescription('');
        setProdImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsVisible(true);
    };

    const handlePriceChange = (val: string) => {
        setProdPrice(val);
        if (!idToEdit && (!prodPoints || prodPoints === '0.00')) {
            const num = parseFloat(val);
            if (!isNaN(num)) {
                setProdPoints((num / 3).toFixed(2));
            } else {
                setProdPoints('');
            }
        }
    };

    const handleSaveProduct = async () => {
        if (!prodName.trim() || !prodPrice || !prodPoints) return alert("Faltan datos");
        setIsProcessing(true);
        try {
            const formData = new FormData();
            formData.append('name', prodName);
            formData.append('price', prodPrice);
            formData.append('points', prodPoints);
            formData.append('points_earned', prodPoints);
            formData.append('description', prodDescription || (idToEdit ? '' : 'Producto Rápido'));
            formData.append('is_visible', isVisible ? '1' : '0');
            
            if (prodImage) {
                formData.append('image', prodImage);
            }

            if (idToEdit) {
                formData.append('_method', 'PUT');
                // ¡BORRAMOS EL @ts-ignore AQUÍ!
                await updateProduct(idToEdit, formData);
                showToast(`Producto actualizado`, 'success');
            } else {
                // ¡BORRAMOS EL @ts-ignore AQUÍ TAMBIÉN!
                await createProduct(formData);
                showToast(`Producto creado`, 'success');
            }

            handleCancelEdit();
            onRulesChange(); 
        } catch (error) { 
            console.error(error);
            showToast("Error al guardar", 'error'); 
        } finally { 
            setIsProcessing(false); 
        }
    };
    
    const handleDeletePack = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation(); 
        if (!window.confirm("¿Eliminar este Pack?")) return;
        try {
            await deletePack(id);
            showToast("Pack eliminado", 'success');
            onRulesChange();
        } catch (error) { 
            console.error(error); // <--- AGREGA ESTO
            showToast("Error al eliminar", 'error'); 
        }
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
        } catch (error) { 
            console.error(error); // <--- AGREGA ESTO
            showToast("Error al cambiar estado", 'error'); 
        }
    };

    // =========================================================================
    // RENDER
    // =========================================================================
    
    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredPacks = packs.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full min-h-[600px] relative">
            
            {/* Toast */}
            <div className={`absolute top-4 right-4 z-[60] transition-all duration-500 ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border border-gray-100 bg-white min-w-[280px] border-l-4 ${toast.type === 'success' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                    <p className="text-sm font-bold text-gray-800">{toast.message}</p>
                </div>
            </div>

            {/* --- MODAL DETALLE --- */}
            {viewProduct && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden max-h-[90vh] flex flex-col md:flex-row relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setViewProduct(null)} className="absolute top-4 right-4 z-20 p-2 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-full transition-colors"><X className="w-5 h-5"/></button>

                        <div className="w-full md:w-1/2 bg-gray-50 p-8 flex items-center justify-center relative border-b md:border-b-0 md:border-r border-gray-100">
                            {viewProduct.image_url ? (
                                <img src={viewProduct.image_url} alt={viewProduct.name} className="w-full h-auto max-h-[400px] object-contain drop-shadow-md mix-blend-multiply" />
                            ) : (
                                <div className="text-gray-300 flex flex-col items-center"><Package className="w-40 h-40 mb-4 opacity-50"/><p className="text-sm font-medium text-gray-400">Sin imagen disponible</p></div>
                            )}
                        </div>

                        <div className="w-full md:w-1/2 p-8 flex flex-col overflow-y-auto bg-white">
                            <h2 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">{viewProduct.name}</h2>
                            <div className="mb-4"><span className="text-4xl font-black text-gray-900 tracking-tight">S/ {Number(viewProduct.price).toFixed(2)}</span></div>
                            <div className="mb-2"><span className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-bold border border-green-100"><CheckCircle className="w-4 h-4 fill-green-200 text-green-600"/> Por esta compra ganas {getPoints(viewProduct).toFixed(2)} puntos.</span></div>
                            <div className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500">
                                {viewProduct.stock && viewProduct.stock > 0 ? (
                                    <span className="text-green-600 flex items-center gap-1.5 font-bold"><CheckCircle className="w-4 h-4"/> En stock ({viewProduct.stock} disponibles)</span>
                                ) : (
                                    <span className="text-red-500 flex items-center gap-1.5 font-bold"><Ban className="w-4 h-4"/> Agotado</span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8 pb-6 border-b border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Tipo de producto</p>
                                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Tag className="w-3.5 h-3.5 text-blue-500"/> {viewProduct.type === 'course' ? 'Curso / Servicio' : 'Producto Físico'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Unidad de medida</p>
                                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Box className="w-3.5 h-3.5 text-purple-500"/> {viewProduct.unit_type || 'Unidad'}</p>
                                </div>
                            </div>

                            <button onClick={() => { onAddProduct(viewProduct); setViewProduct(null); showToast("Producto agregado al carrito", 'success'); }} className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2 active:scale-[0.98] mb-8">
                                <ShoppingCart className="w-5 h-5"/> Agregar al carrito
                            </button>

                            <div>
                                <h3 className="text-base font-bold text-gray-900 mb-2">Descripción del producto</h3>
                                <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{viewProduct.description || "Sin descripción detallada."}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER DE GESTIÓN (CREACIÓN RÁPIDA) */}
            <div className="catalog-header bg-gray-50 p-5 border-b border-gray-200 min-h-[88px] flex flex-col justify-center transition-colors duration-300" style={{ backgroundColor: idToEdit ? '#fffbeb' : '#f9fafb' }}>
                
                {activeTab === 'catalog' && (
                    <>
                        <div className="flex items-center justify-between mb-3"> 
                            <div className="flex items-center gap-2">
                                {idToEdit ? <Pencil className="w-4 h-4 text-amber-600" /> : <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />}
                                <h3 className={`text-xs font-bold uppercase tracking-wider ${idToEdit ? 'text-amber-700' : 'text-gray-500'}`}>
                                    {idToEdit ? 'Editando Producto' : 'Creación Rápida / Manual'}
                                </h3> 
                            </div>
                            {idToEdit && (
                                <button onClick={handleCancelEdit} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 font-medium">
                                    <Ban className="w-3 h-3"/> Cancelar
                                </button>
                            )}
                        </div>

                        {/* FILA 1: Nombre */}
                        <div className="flex flex-col gap-3 mb-3">
                            <input type="text" placeholder="Nombre Producto" className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-green-500" value={prodName} onChange={(e) => setProdName(e.target.value)} />
                        </div>

                        {/* FILA 2: Precio, Puntos, Visibilidad, Botón */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-3">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">S/</span>
                                <input type="number" placeholder="Precio" className="w-full border border-gray-300 rounded-xl pl-8 pr-2 py-2 text-sm outline-none focus:border-green-500" value={prodPrice} onChange={(e) => handlePriceChange(e.target.value)} />
                            </div>

                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-amber-500 font-bold">Pts</span>
                                <input type="number" placeholder="Pts" className="w-full border border-amber-200 bg-amber-50 rounded-xl pl-8 pr-2 py-2 text-sm outline-none focus:border-amber-500 font-bold text-amber-700" value={prodPoints} onChange={(e) => setProdPoints(e.target.value)} />
                            </div>

                            <button onClick={() => setIsVisible(!isVisible)} className={`px-3 rounded-xl border transition-all flex items-center justify-center ${isVisible ? 'bg-white border-green-200 text-green-600 hover:bg-green-50' : 'bg-gray-100 border-gray-300 text-gray-400 hover:bg-gray-200'}`} title={isVisible ? "Visible" : "Oculto"}>
                                {isVisible ? <Eye className="w-4 h-4"/> : <EyeOff className="w-4 h-4"/>}
                            </button>

                            <button onClick={handleSaveProduct} disabled={isProcessing} className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors min-w-[80px] ${idToEdit ? 'bg-amber-600 hover:bg-amber-700' : 'bg-gray-900 hover:bg-black'}`}>
                                {isProcessing ? '...' : (idToEdit ? 'Guardar' : 'Crear')}
                            </button>
                        </div>

                        {/* FILA 3 (NUEVA): Descripción e Imagen */}
                        <div className="flex gap-2 items-center">
                            <input 
                                type="text" 
                                placeholder="Descripción (opcional)" 
                                className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-green-500"
                                value={prodDescription}
                                onChange={(e) => setProdDescription(e.target.value)}
                            />

                            <div className="relative">
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    id="catalog-img-upload" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setProdImage(e.target.files[0]);
                                        }
                                    }}
                                />
                                <label 
                                    htmlFor="catalog-img-upload" 
                                    className={`cursor-pointer flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors whitespace-nowrap ${
                                        prodImage 
                                        ? 'bg-emerald-100 border-emerald-500 text-emerald-700' 
                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    {prodImage ? <ImageIcon className="w-4 h-4"/> : <Camera className="w-4 h-4"/>}
                                    <span className="text-xs font-medium hidden sm:inline">{prodImage ? 'Foto Lista' : 'Subir Foto'}</span>
                                </label>
                            </div>
                            
                            {prodImage && (
                                <button onClick={() => { setProdImage(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><X className="w-4 h-4"/></button>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'packs' && (
                    <div className="flex items-center justify-between w-full">
                        <div>
                            <h3 className="text-sm font-bold text-purple-900 flex items-center gap-2"><Layers className="w-4 h-4"/> Gestión de Packs</h3>
                            <p className="text-xs text-purple-600 mt-0.5">Crea packs con lógica de puntos personalizada.</p>
                        </div>
                        <button onClick={onSaveCartAsPack} className="bg-purple-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-purple-700 shadow-md shadow-purple-100 flex items-center gap-2 transition-all active:scale-95">
                            <Save className="w-4 h-4"/> Guardar Carrito como Pack
                        </button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('catalog')} className={`flex-1 py-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 min-w-[100px] transition-colors ${activeTab === 'catalog' ? 'text-green-600 bg-white border-b-2 border-green-500' : 'text-gray-400 bg-gray-50 hover:bg-gray-100'}`}><Package className="w-4 h-4"/> Catálogo</button>
                <button onClick={() => setActiveTab('packs')} className={`flex-1 py-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 min-w-[100px] transition-colors ${activeTab === 'packs' ? 'text-purple-600 bg-white border-b-2 border-purple-500' : 'text-gray-400 bg-gray-50 hover:bg-gray-100'}`}><Layers className="w-4 h-4"/> Packs</button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto max-h-[600px] custom-scrollbar relative">
                
                {/* 1. CATÁLOGO */}
                {activeTab === 'catalog' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Buscar producto..." className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-100 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                        {loading ? <div className="text-center py-10 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto"/> Cargando...</div> : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {filteredProducts.map(product => {
                                    const safePoints = getPoints(product);
                                    const isHidden = product.is_visible === false || product.is_visible === 0;

                                    return (
                                        <div key={product.id} onClick={() => onAddProduct(product)} className={`group border rounded-xl p-3 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between h-auto relative ${isHidden ? 'bg-gray-50 border-dashed border-gray-300' : 'bg-white border-gray-100 hover:border-green-500'}`}>
                                            <div className="absolute top-2 right-2 flex gap-1 z-10">
                                                <button onClick={(e) => { e.stopPropagation(); setViewProduct(product); }} className="p-1.5 bg-gray-100 text-blue-500 rounded-full opacity-0 group-hover:opacity-100 hover:bg-blue-100 hover:text-blue-700 transition-all" title="Ver Detalles"><Info className="w-3.5 h-3.5"/></button>
                                                <button onClick={(e) => handleEditProductClick(e, product)} className="p-1.5 bg-gray-100 text-gray-400 rounded-full opacity-0 group-hover:opacity-100 hover:bg-amber-100 hover:text-amber-600 transition-all" title="Editar"><Pencil className="w-3.5 h-3.5"/></button>
                                            </div>
                                            
                                            <div className="flex gap-3 mb-2">
                                                <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
                                                    {product.image_url ? (
                                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = ''; e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('fallback'); }} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300"><Package className="w-6 h-6"/></div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={`text-xs sm:text-sm font-bold leading-tight mb-1 line-clamp-2 ${isHidden ? 'text-gray-500' : 'text-gray-700 group-hover:text-green-700'}`}>{product.name}</h4>
                                                    {isHidden && <span className="text-[9px] bg-gray-200 text-gray-500 px-1.5 rounded inline-flex items-center gap-1"><EyeOff className="w-3 h-3"/> Oculto</span>}
                                                </div>
                                            </div>
                                            
                                            <div className="mt-1 flex items-end justify-between border-t pt-2 border-dashed border-gray-100">
                                                <div><div className="text-[10px] text-gray-400 uppercase">Precio</div><div className="font-mono font-bold text-gray-900">S/ {Number(product.price).toFixed(2)}</div></div>
                                                <div className="text-right mx-2"><div className="text-[10px] text-gray-400 uppercase">Pts</div><div className="font-bold text-amber-600">{safePoints.toFixed(2)}</div></div>
                                                <div className="bg-green-50 text-green-700 p-1.5 rounded-lg group-hover:bg-green-500 group-hover:text-white transition-colors"><Plus className="w-4 h-4"/></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* 2. PACKS */}
                {activeTab === 'packs' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                         <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Buscar pack..." className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-100 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                        {filteredPacks.length === 0 ? (
                            <div className="text-center py-10 flex flex-col items-center justify-center"><Layers className="w-12 h-12 text-gray-200 mb-2"/><p className="text-gray-400 text-sm">No hay packs registrados.</p><p className="text-xs text-purple-500 mt-2 max-w-[200px]">Agrega productos al carrito y dale al botón de arriba "Guardar Carrito como Pack".</p></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredPacks.map(pack => {
                                    const isActive = pack.status !== 'inactive'; 
                                    return (
                                    <div key={pack.id} onClick={() => isActive && onAddPack(pack)} className={`group border rounded-xl p-4 transition-all relative ${isActive ? 'border-gray-100 bg-white hover:border-purple-500 hover:shadow-md cursor-pointer' : 'border-gray-100 bg-gray-50 opacity-70 cursor-default'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1 pr-2"><h4 className="font-bold text-gray-800 group-hover:text-purple-700 leading-tight text-sm">{pack.name}</h4>{!isActive && <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 rounded mt-1 inline-block">INACTIVO</span>}</div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={(e) => handleTogglePack(e, pack.id)} className={`p-1.5 rounded-lg transition-colors ${isActive ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-200'}`} title={isActive ? "Desactivar" : "Activar"}>{isActive ? (<span>ON</span>) : (<span>OFF</span>)}</button>
                                                <button onClick={(e) => handleEditClick(e, pack)} className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar"><Layers className="w-3.5 h-3.5"/></button>
                                                <button onClick={(e) => handleDeletePack(e, pack.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">X</button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end mt-3 border-t border-dashed border-gray-100 pt-2">
                                            <div><p className="text-[10px] text-gray-400 uppercase">Precio Pack</p><p className="font-mono font-bold text-base text-gray-900">S/ {Number(pack.total_pack_price).toFixed(2)}</p></div>
                                            <div className="text-right"><p className="text-[10px] text-gray-400 uppercase">Puntos</p><p className="font-bold text-purple-600 text-sm">{Number(pack.total_pack_points).toFixed(2)} pts</p></div>
                                        </div>
                                    </div>
                                )})}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};