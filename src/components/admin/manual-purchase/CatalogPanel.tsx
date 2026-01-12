/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
// ✅ CORRECCIÓN: Agregados ChevronLeft y ChevronRight que faltaban
import {
  Search,
  Package,
  Plus,
  X,
  Edit,
  Trash2,
  Layers,
  Save,
  Camera,
  Upload,
  Eye,
  EyeOff,
  CheckSquare,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Product, Pack } from "../../../services/adminPurchaseService";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  deletePack,
} from "../../../services/adminPurchaseService";

// --- COMPONENTE DE ALERTA (DISEÑO BONITO) ---
const CustomAlert = ({
  type,
  title,
  message,
  onClose,
}: {
  type: "success" | "error" | "warning";
  title: string;
  message: string;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
    <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 transform transition-all animate-in zoom-in-95">
      <div className="flex flex-col items-center text-center space-y-4">
        <div
          className={`p-4 rounded-full ${type === "error" ? "bg-red-50 text-red-500" : type === "success" ? "bg-green-50 text-green-500" : "bg-amber-50 text-amber-500"}`}
        >
          {type === "error" && <X className="w-8 h-8" />}
          {type === "success" && <CheckCircle className="w-8 h-8" />}
          {type === "warning" && <AlertCircle className="w-8 h-8" />}
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${
            type === "error"
              ? "bg-red-500 hover:bg-red-600 shadow-red-500/30"
              : type === "success"
                ? "bg-green-500 hover:bg-green-600 shadow-green-500/30"
                : "bg-amber-500 hover:bg-amber-600"
          }`}
        >
          Entendido
        </button>
      </div>
    </div>
  </div>
);

// --- COMPONENTE DE CONFIRMACION (DISEÑO BONITO) ---
const ConfirmModal = ({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
    <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 transform transition-all animate-in zoom-in-95">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-4 rounded-full bg-red-50 text-red-500">
          <Trash2 className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-transform active:scale-95"
          >
            Sí, Eliminar
          </button>
        </div>
      </div>
    </div>
  </div>
);

interface CatalogPanelProps {
  products: Product[];
  packs: Pack[];
  loading: boolean;
  onAddProduct: (product: Product) => void;
  onAddPack: (pack: Pack) => void;
  onSaveCartAsPack: () => void;
  onRulesChange: () => void;
  onEditPack: (pack: Pack) => void;

  // Props de eliminación masiva
  isDeleteMode: boolean;
  setIsDeleteMode: (val: boolean) => void;
  selectedToDelete: { id: number; type: "product" | "pack" }[];
  onExecuteBulkDelete: () => void;
  onCancelDeleteMode: () => void;
}

const ITEMS_PER_PAGE = 8;

export const CatalogPanel = ({
  products,
  packs,
  loading,
  onAddProduct,
  onAddPack,
  onSaveCartAsPack,
  onRulesChange,
  onEditPack,
  isDeleteMode,
  setIsDeleteMode,
  selectedToDelete,
  onExecuteBulkDelete,
  onCancelDeleteMode,
}: CatalogPanelProps) => {
  const [activeTab, setActiveTab] = useState<"catalog" | "packs">("catalog");
  const [searchTerm, setSearchTerm] = useState("");
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  // Alertas Locales
  const [alertState, setAlertState] = useState<{
    show: boolean;
    type: "success" | "error" | "warning";
    title: string;
    msg: string;
  } | null>(null);
  const [confirmState, setConfirmState] = useState<{
    show: boolean;
    id: number;
    type: "product" | "pack";
  } | null>(null);

  const showAlert = (
    type: "success" | "error" | "warning",
    title: string,
    msg: string
  ) => {
    setAlertState({ show: true, type, title, msg });
  };

  // Estados Formularios Producto
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodPoints, setProdPoints] = useState("");
  const [prodVisible, setProdVisible] = useState(true);
  const [prodImage, setProdImage] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const prodFileInputRef = useRef<HTMLInputElement>(null);

  // Estados Edicion
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editPoints, setEditPoints] = useState("");
  const [editVisible, setEditVisible] = useState(true);
  const [editImage, setEditImage] = useState<File | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredPacks = packs.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentItems =
    activeTab === "catalog" ? filteredProducts : filteredPacks;
  const totalPages = Math.ceil(currentItems.length / ITEMS_PER_PAGE);
  const paginatedItems = currentItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Helper para saber si está seleccionado
  const isSelected = (id: number, type: "product" | "pack") => {
    return selectedToDelete.some(
      (item) => item.id === id && item.type === type
    );
  };

  // --- HANDLERS ---

  const handleSaveProduct = async () => {
    if (!prodName.trim() || !prodPrice || !prodPoints)
      return showAlert(
        "warning",
        "Faltan Datos",
        "Nombre, Precio y Puntos requeridos."
      );
    if (Number(prodPrice) < 0 || Number(prodPoints) < 0)
      return showAlert("error", "Valor Invalido", "No negativos.");
    setIsCreating(true);
    try {
      await createProduct({
        name: prodName,
        price: parseFloat(prodPrice),
        points: parseFloat(prodPoints),
        stock: 100,
        type: "product",
        description: "Producto Rapido",
        image: prodImage,
        is_visible: prodVisible,
      });
      setProdName("");
      setProdPrice("");
      setProdPoints("");
      setProdImage(null);
      setProdVisible(true);
      if (prodFileInputRef.current) prodFileInputRef.current.value = "";
      setShowQuickCreate(false);
      onRulesChange();
      showAlert("success", "Creado", "Producto agregado con exito.");
    } catch (error) {
      console.error(error);
      const err = error as any;
      showAlert("error", "Error", err.message || "Error al crear.");
    } finally {
      setIsCreating(false);
    }
  };

  // Abre el modal bonito en lugar del window.confirm
  const requestDelete = (id: number, type: "product" | "pack") => {
    setConfirmState({ show: true, id, type });
  };

  const confirmDelete = async () => {
    if (!confirmState) return;
    try {
      if (confirmState.type === "pack") {
        await deletePack(confirmState.id);
      } else {
        await deleteProduct(confirmState.id);
      }
      onRulesChange();
      showAlert(
        "success",
        "Eliminado",
        "El item ha sido eliminado correctamente."
      );
    } catch (error: any) {
      console.error("Error al eliminar:", error);
      const errorMsg = error.message || "";
      if (
        errorMsg.includes("404") ||
        errorMsg.includes("found") ||
        errorMsg.includes("encontrado")
      ) {
        onRulesChange();
        showAlert(
          "warning",
          "Aviso",
          "El item ya no existia, se ha actualizado la lista."
        );
      } else {
        showAlert("error", "Error", errorMsg || "No se pudo eliminar.");
      }
    } finally {
      setConfirmState(null);
    }
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditPrice(p.price.toString());
    const realPoints =
      p.points_earned !== undefined && p.points_earned !== null
        ? p.points_earned
        : p.points || 0;
    setEditPoints(realPoints.toString());
    setEditVisible(!!p.is_visible);
    setEditImage(null);
  };

  const saveEdit = async (id: number) => {
    if (Number(editPrice) < 0 || Number(editPoints) < 0)
      return showAlert("error", "Error", "No negativos.");
    try {
      const payload: any = {
        price: parseFloat(editPrice),
        points: parseFloat(editPoints),
        is_visible: editVisible,
      };
      if (editImage) payload.image = editImage;
      await updateProduct(id, payload);
      setEditingId(null);
      setEditImage(null);
      onRulesChange();
      showAlert("success", "Actualizado", "Producto editado correctamente.");
    } catch (error) {
      console.error(error);
      const err = error as any;
      showAlert("error", "Error", err.message || "No se pudo actualizar.");
    }
  };

  const getPackImage = (pack: any) => {
    let path = pack.image_url || pack.image_path || pack.image;
    if (!path) return null;
    if (typeof path === "string" && path.startsWith("http")) return path;
    path = path.replace("public/", "");
    return `http://127.0.0.1:8000/storage/${path}`;
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden relative">
      {alertState && (
        <CustomAlert
          type={alertState.type}
          title={alertState.title}
          message={alertState.msg}
          onClose={() => setAlertState(null)}
        />
      )}
      {confirmState && (
        <ConfirmModal
          title="¿Eliminar Item?"
          message="¿Estás seguro de que deseas eliminar este item permanentemente?"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {/* HEADER */}
      <div className="flex border-b border-gray-100 shrink-0 bg-white relative z-20">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === "catalog" ? "text-green-600 border-b-2 border-green-500 bg-green-50/50" : "text-gray-400 hover:text-gray-600"}`}
        >
          <Package className="w-4 h-4" /> Catalogo
        </button>
        <button
          onClick={() => setActiveTab("packs")}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === "packs" ? "text-purple-600 border-b-2 border-purple-500 bg-purple-50/50" : "text-gray-400 hover:text-gray-600"}`}
        >
          <Layers className="w-4 h-4" /> Packs
        </button>

        {/* BOTÓN MODO ELIMINAR */}
        <div className="border-l border-gray-100 flex items-center px-2">
          {!isDeleteMode ? (
            <button
              onClick={() => setIsDeleteMode(true)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors tooltip"
              title="Activar Eliminación Múltiple"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onCancelDeleteMode}
              className="p-2 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-xs font-bold px-3"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* BARRA DE ACCIÓN BORRADO */}
      {isDeleteMode && (
        <div className="bg-red-50 border-b border-red-100 p-3 flex justify-between items-center animate-in slide-in-from-top-2">
          <span className="text-xs font-bold text-red-600 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Selecciona items para eliminar
          </span>
          <button
            onClick={onExecuteBulkDelete}
            disabled={selectedToDelete.length === 0}
            className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Trash2 className="w-3 h-3" /> Eliminar ({selectedToDelete.length})
          </button>
        </div>
      )}

      {/* CONTENIDO */}
      <div className="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-5">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={
              activeTab === "catalog" ? "Buscar producto..." : "Buscar pack..."
            }
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-green-100 outline-none text-gray-700 font-medium placeholder-gray-400 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {activeTab === "catalog" && (
          <>
            {!isDeleteMode && (
              <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100">
                <div
                  className="flex justify-between items-center mb-3 cursor-pointer"
                  onClick={() => setShowQuickCreate(!showQuickCreate)}
                >
                  <h4 className="text-xs font-bold text-orange-600 uppercase flex items-center gap-2">
                    <Plus className="w-3 h-3" /> Creacion Rapida
                  </h4>
                  {showQuickCreate ? (
                    <X className="w-4 h-4 text-orange-400" />
                  ) : (
                    <Plus className="w-4 h-4 text-orange-400" />
                  )}
                </div>
                {showQuickCreate && (
                  <div className="animate-in slide-in-from-top-2 flex flex-col sm:flex-row gap-3 items-start">
                    <div
                      onClick={() => prodFileInputRef.current?.click()}
                      className="w-full sm:w-20 h-20 bg-white rounded-xl border-2 border-dashed border-orange-200 hover:border-orange-400 flex items-center justify-center cursor-pointer shrink-0 overflow-hidden relative group"
                    >
                      <input
                        type="file"
                        ref={prodFileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) =>
                          setProdImage(e.target.files?.[0] || null)
                        }
                      />
                      {prodImage ? (
                        <img
                          src={URL.createObjectURL(prodImage)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-6 h-6 text-orange-300 group-hover:text-orange-500 transition-colors" />
                      )}
                      {prodImage && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Edit className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 w-full space-y-3">
                      <div className="flex gap-2">
                        <input
                          value={prodName}
                          onChange={(e) => setProdName(e.target.value)}
                          placeholder="Nombre"
                          className="flex-1 p-2 rounded-lg border border-orange-200 text-sm focus:border-orange-400 outline-none"
                        />
                        <button
                          onClick={() => setProdVisible(!prodVisible)}
                          className={`p-2 rounded-lg border transition-all ${prodVisible ? "bg-green-50 border-green-200 text-green-600" : "bg-gray-100 border-gray-200 text-gray-400"}`}
                          title={prodVisible ? "Visible" : "Oculto"}
                        >
                          {prodVisible ? (
                            <Eye className="w-5 h-5" />
                          ) : (
                            <EyeOff className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-2 top-2 text-xs font-bold text-gray-400">
                            S/
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={prodPrice}
                            onChange={(e) => setProdPrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-6 p-2 rounded-lg border border-orange-200 text-sm focus:border-orange-400 outline-none"
                          />
                        </div>
                        <div className="relative flex-1">
                          <span className="absolute left-2 top-2 text-xs font-bold text-amber-500">
                            Pts
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={prodPoints}
                            onChange={(e) => setProdPoints(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-8 p-2 rounded-lg border border-orange-200 text-sm focus:border-orange-400 outline-none"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleSaveProduct}
                        disabled={isCreating}
                        className="w-full bg-orange-500 text-white px-4 py-2.5 rounded-lg font-bold text-xs hover:bg-orange-600 shadow-sm transition-colors"
                      >
                        {isCreating ? "..." : "Crear Producto"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* LISTA PRODUCTOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
              {loading ? (
                <p className="text-center text-gray-400 col-span-full py-4">
                  Cargando catalogo...
                </p>
              ) : (
                // @ts-ignore
                paginatedItems.map((product: Product) => {
                  const displayPoints =
                    product.points_earned !== undefined &&
                    product.points_earned !== null
                      ? Number(product.points_earned)
                      : Number(product.points || 0);
                  const selected = isSelected(product.id, "product");
                  return (
                    <div
                      key={product.id}
                      onClick={() => isDeleteMode && onAddProduct(product)}
                      className={`group bg-white border p-3 rounded-2xl transition-all flex flex-col justify-between relative overflow-hidden
                                        ${
                                          isDeleteMode
                                            ? selected
                                              ? "border-red-500 ring-2 ring-red-100 bg-red-50 cursor-pointer"
                                              : "border-gray-200 hover:border-red-300 cursor-pointer"
                                            : "border-gray-100 hover:border-green-200 hover:shadow-md"
                                        }
                                        ${!product.is_visible && editingId !== product.id ? "opacity-60 bg-gray-50" : ""}
                                    `}
                    >
                      {isDeleteMode && (
                        <div
                          className={`absolute top-2 right-2 z-10 p-1 rounded-full bg-white shadow-sm transition-transform ${selected ? "scale-110" : "scale-100"}`}
                        >
                          {selected ? (
                            <CheckCircle className="w-5 h-5 text-red-600 fill-red-100" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                      )}

                      {!product.is_visible && editingId !== product.id && (
                        <div className="absolute top-2 left-2 bg-gray-200 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
                          <EyeOff className="w-3 h-3" /> Oculto
                        </div>
                      )}

                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden relative ${!isDeleteMode ? "cursor-pointer" : ""} ${editingId === product.id ? "ring-2 ring-green-400" : ""}`}
                          onClick={() =>
                            !isDeleteMode &&
                            editingId === product.id &&
                            editFileInputRef.current?.click()
                          }
                        >
                          {editingId === product.id && editImage ? (
                            <img
                              src={URL.createObjectURL(editImage)}
                              className="w-full h-full object-cover"
                            />
                          ) : product.image_url ? (
                            <img
                              src={product.image_url}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-gray-300" />
                          )}
                          {editingId === product.id && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Upload className="w-4 h-4 text-white" />
                              <input
                                type="file"
                                ref={editFileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) =>
                                  setEditImage(e.target.files?.[0] || null)
                                }
                              />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h4
                              className="font-bold text-gray-800 text-sm truncate"
                              title={product.name}
                            >
                              {product.name}
                            </h4>
                            {editingId === product.id && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditVisible(!editVisible);
                                }}
                                className={`ml-2 p-1.5 rounded-lg border transition-all relative z-20 ${editVisible ? "bg-green-50 border-green-200 text-green-600" : "bg-gray-100 border-gray-200 text-gray-400"}`}
                                title={editVisible ? "Visible" : "Oculto"}
                              >
                                {editVisible ? (
                                  <Eye className="w-4 h-4" />
                                ) : (
                                  <EyeOff className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>

                          {/* --- INICIO DEL CAMBIO DEL BOTÓN --- */}
                          {editingId === product.id ? (
                            <div className="flex items-center gap-1 mt-1">
                              <input
                                type="number"
                                min="0"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className="w-16 text-xs border rounded px-1 font-bold"
                              />
                              <button
                                onClick={() => saveEdit(product.id)}
                                className="text-green-600 bg-green-50 px-2 py-1 rounded hover:bg-green-100 flex items-center gap-1 shadow-sm transition-all active:scale-95"
                              >
                                <CheckSquare className="w-3 h-3" />
                                <span className="text-[10px] font-bold">
                                  Guardar
                                </span>
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 font-medium">
                              S/ {Number(product.price).toFixed(2)}
                            </p>
                          )}
                          {/* --- FIN DEL CAMBIO --- */}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                        <div className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">
                          {editingId === product.id ? (
                            <input
                              type="number"
                              min="0"
                              value={editPoints}
                              onChange={(e) => setEditPoints(e.target.value)}
                              className="w-12 bg-transparent outline-none border-b border-amber-300"
                            />
                          ) : (
                            `+${displayPoints.toFixed(2)} pts`
                          )}
                        </div>
                        {!isDeleteMode && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEdit(product)}
                              className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                requestDelete(product.id, "product")
                              }
                              className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onAddProduct(product)}
                              className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-500 hover:text-white transition-colors ml-1"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {activeTab === "packs" && (
          <div className="space-y-4">
            {!isDeleteMode && (
              <div className="flex justify-between items-center bg-purple-50 p-4 rounded-xl border border-purple-100">
                <div>
                  <h3 className="text-sm font-bold text-purple-900">
                    Gestion de Packs
                  </h3>
                  <p className="text-xs text-purple-600 hidden sm:block">
                    Crea packs con logica.
                  </p>
                </div>
                <button
                  onClick={onSaveCartAsPack}
                  className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 shadow-md flex items-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" /> Nuevo Pack
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 pb-2">
              {/* @ts-ignore */}
              {paginatedItems.map((pack: Pack) => {
                const packImg = getPackImage(pack);
                const selected = isSelected(pack.id, "pack");
                return (
                  <div
                    key={pack.id}
                    onClick={() => isDeleteMode && onAddPack(pack)}
                    className={`bg-white border p-4 rounded-2xl flex items-center justify-between group transition-all relative overflow-hidden
                                        ${
                                          isDeleteMode
                                            ? selected
                                              ? "border-red-500 ring-2 ring-red-100 bg-red-50 cursor-pointer"
                                              : "border-gray-200 hover:border-red-300 cursor-pointer"
                                            : "border-gray-100 hover:border-purple-200 hover:shadow-md"
                                        }`}
                  >
                    {isDeleteMode && (
                      <div
                        className={`absolute top-2 right-2 z-10 p-1 rounded-full bg-white shadow-sm transition-transform ${selected ? "scale-110" : "scale-100"}`}
                      >
                        {selected ? (
                          <CheckCircle className="w-5 h-5 text-red-600 fill-red-100" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-4 w-full">
                      <div className="w-16 h-16 bg-purple-50 rounded-xl flex items-center justify-center text-purple-400 shrink-0 overflow-hidden border border-purple-100 relative">
                        {packImg ? (
                          <img
                            src={packImg}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                            alt={pack.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                              (
                                e.target as HTMLImageElement
                              ).nextElementSibling?.classList.remove("hidden");
                            }}
                          />
                        ) : null}
                        <Layers
                          className={`w-8 h-8 text-purple-300 ${packImg ? "hidden" : ""}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-gray-900 text-sm truncate">
                          {pack.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                            S/ {Number(pack.total_pack_price).toFixed(2)}
                          </span>
                          <span className="text-[10px] font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100">
                            {Number(pack.total_pack_points).toFixed(2)} pts
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 truncate">
                          {pack.products && pack.products.length > 0
                            ? `${pack.products.length} productos incluidos`
                            : "Sin productos"}
                        </p>
                      </div>
                    </div>

                    {!isDeleteMode && (
                      <div className="flex items-center gap-1 mt-0 shrink-0 ml-2">
                        <div className="flex items-center bg-gray-50 rounded-lg p-1 mr-2 border border-gray-100">
                          <button
                            onClick={() => onEditPack(pack)}
                            className="p-1.5 text-purple-400 hover:text-purple-600 hover:bg-white rounded-md transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => requestDelete(pack.id, "pack")}
                            className="p-1.5 text-red-300 hover:text-red-500 hover:bg-white rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => onAddPack(pack)}
                          className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center hover:bg-purple-700 shadow-md hover:shadow-purple-200 transition-all active:scale-95"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-4 py-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-gray-500">
              Pagina {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
