/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import {
  getUsersForSelector,
  getProductsForSelector,
  storeManualPurchase,
  annulPurchase,
  assignPrivatePack,
  getPacks,
  deleteProduct,
  deletePack,
} from "../../services/adminPurchaseService";

// ✅ Agregamos AlertCircle para el diseño del modal
import {
  History,
  Trash2,
  LayoutDashboard,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  X,
  AlertCircle,
} from "lucide-react";

import {
  ATIPAY_ICON_SRC,
  STORAGE_KEY,
  safeParseFloat,
} from "./manual-purchase/types";
import type { User, CartItem, TransactionLog } from "./manual-purchase/types";
import type { Product, Pack } from "../../services/adminPurchaseService";
import { CatalogPanel } from "./manual-purchase/CatalogPanel";
import { CartPanel } from "./manual-purchase/CartPanel";
import { CreatePackModal } from "./manual-purchase/CreatePackModal";

export const ManualPurchaseForm = () => {
  // --- DATOS ---
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);

  const [selectedUser, setSelectedUser] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "wallet">("cash");
  const [cart, setCart] = useState<CartItem[]>([]);

  // --- ESTADO DE EDICIÓN ---
  const [editingPack, setEditingPack] = useState<Pack | null>(null);

  // --- ESTADOS PARA ELIMINACIÓN MASIVA ---
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState<
    { id: number; type: "product" | "pack" }[]
  >([]);

  // 🔥 NUEVO: Estado para el modal bonito (reemplaza al window.confirm)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // --- UI & MODALES ---
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [itemToAnnul, setItemToAnnul] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showPackNameModal, setShowPackNameModal] = useState(false);

  const [showCreatePackModal, setShowCreatePackModal] = useState(false);

  // --- FORMULARIOS ---
  const [packNameInput, setPackNameInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [existingPackImageUrl, setExistingPackImageUrl] = useState<
    string | null
  >(null);

  // --- HISTORIAL ---
  const [history, setHistory] = useState<TransactionLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // --- CÁLCULOS ---
  const totalMoney = cart.reduce((acc, item) => acc + (item.price || 0), 0);
  const totalPoints = cart.reduce((acc, item) => acc + (item.points || 0), 0);
  const selectedUserData = users.find((u) => u.id.toString() === selectedUser);

  // --- CARGA DE DATOS ---
  const refreshAllData = useCallback(async () => {
    try {
      const [packsData, productsData] = await Promise.all([
        getPacks(),
        getProductsForSelector(),
      ]);

      setPacks(Array.isArray(packsData) ? packsData : []);
      setProducts(
        Array.isArray(productsData) ? productsData : productsData.data || []
      );
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [u, p] = await Promise.all([
          getUsersForSelector(),
          getProductsForSelector(),
        ]);
        setUsers(Array.isArray(u) ? u : u.data || []);
        setProducts(Array.isArray(p) ? p : p.data || []);

        await refreshAllData();
      } catch (error) {
        console.error(error);
        setErrorMsg("Error cargando datos iniciales.");
      } finally {
        setProductsLoading(false);
      }
    };
    loadData();
  }, [refreshAllData]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  // --- NUEVO: LÓGICA DE SELECCIÓN Y BORRADO (CON MODAL BONITO) ---
  const toggleSelectionForDelete = (id: number, type: "product" | "pack") => {
    setSelectedToDelete((prev) => {
      const exists = prev.find((item) => item.id === id && item.type === type);
      if (exists) {
        return prev.filter((item) => !(item.id === id && item.type === type));
      } else {
        return [...prev, { id, type }];
      }
    });
  };

  // Función que abre el modal (antes era executeBulkDelete con window.confirm)
  const handleRequestBulkDelete = () => {
    if (selectedToDelete.length === 0) return;
    setShowBulkDeleteConfirm(true);
  };

  // Función que ejecuta el borrado al confirmar en el modal
  const confirmBulkDelete = async () => {
    setLoading(true);
    setShowBulkDeleteConfirm(false); // Cierra modal
    try {
      await Promise.all(
        selectedToDelete.map((item) => {
          if (item.type === "product") return deleteProduct(item.id);
          if (item.type === "pack") return deletePack(item.id);
          return Promise.resolve();
        })
      );

      setSuccessMsg(
        `${selectedToDelete.length} elementos eliminados correctamente.`
      );
      setSelectedToDelete([]);
      setIsDeleteMode(false);
      await refreshAllData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (error) {
      console.error(error);
      setErrorMsg("Error al eliminar algunos elementos.");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS CARRITO ---
  const handleAddProduct = (product: Product) => {
    // 🔥 IMPORTANTE: Si es modo eliminar, solo seleccionamos.
    if (isDeleteMode) {
      toggleSelectionForDelete(product.id, "product");
      return;
    }

    const safePrice = safeParseFloat(product.price);
    const dbPoints = Number(product.points_earned);
    const legacyPoints = Number(product.points);
    const finalPoints =
      dbPoints > 0 ? dbPoints : legacyPoints > 0 ? legacyPoints : safePrice / 3;

    setCart([
      ...cart,
      {
        id: Date.now().toString(),
        productId: product.id,
        name: product.name,
        price: safePrice,
        points: finalPoints,
        type: "product",
      },
    ]);
  };

  const handleAddPack = (pack: Pack) => {
    if (isDeleteMode) {
      toggleSelectionForDelete(pack.id, "pack");
      return;
    }

    setCart([
      ...cart,
      {
        id: Date.now().toString(),
        name: `Pack: ${pack.name}`,
        price: Number(pack.total_pack_price),
        points: Number(pack.total_pack_points),
        type: "product",
        description: "Pack Predefinido",
      },
    ]);
  };

  const handleRemoveItem = (id: string) =>
    setCart((prev) => prev.filter((item) => item.id !== id));

  // --- MODALES ---
  const handleOpenPackModal = () => {
    setSuccessMsg(null);
    setErrorMsg(null);
    if (!selectedUser) return setErrorMsg("Selecciona un cliente.");
    if (cart.length === 0) return setErrorMsg("Carrito vacío.");

    let defaultName = `Pedido Especial para ${selectedUserData?.username || "Cliente"}`;
    let defaultImage = null;

    if (cart.length === 1) {
      const item = cart[0];
      defaultName = item.name.replace("Pack: ", "");
      const foundProduct = products.find((p) => p.id === item.productId);
      if (foundProduct && (foundProduct.image_url || foundProduct.image_path)) {
        defaultImage = foundProduct.image_url || foundProduct.image_path;
      }
      if (!defaultImage) {
        const foundPack = packs.find((p) => item.name.includes(p.name));
        if (foundPack && (foundPack.image_url || foundPack.image_path)) {
          defaultImage = foundPack.image_url || foundPack.image_path;
        }
      }
    }

    setPackNameInput(defaultName);
    setSelectedImage(null);
    setExistingPackImageUrl(defaultImage || null);

    setShowPackNameModal(true);
  };

  const handleEditPackSelect = (pack: Pack) => {
    if (isDeleteMode) return; // No editamos si estamos borrando
    setEditingPack(pack);
    setShowCreatePackModal(true);
  };

  // --- PROCESOS DE VENTA Y CREACIÓN (TUS FUNCIONES COMPLETAS) ---
  const handleCreatePack = async () => {
    if (!packNameInput.trim()) return alert("Ingresa un nombre.");
    setLoading(true);

    const itemDescription = cart
      .map((item) => `${item.name} (${item.points.toFixed(2)} pts)`)
      .join(", ");

    try {
      await assignPrivatePack({
        user_id: parseInt(selectedUser),
        name: packNameInput,
        price: totalMoney,
        points: totalPoints,
        description: itemDescription,
        image: selectedImage,
        existing_image_url: existingPackImageUrl,
      });
      setSuccessMsg(`¡Pack privado enviado a la tienda del usuario!`);
      setCart([]);
      setSelectedUser("");
      setShowPackNameModal(false);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (error) {
      console.error(error);
      const err = error as any;
      setErrorMsg(err.message || "Error creando pack.");
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateSubmit = () => {
    setSuccessMsg(null);
    setErrorMsg(null);
    if (!selectedUser) return setErrorMsg("Selecciona un cliente.");
    if (cart.length === 0) return setErrorMsg("Carrito vacío.");
    if (
      paymentMethod === "wallet" &&
      (selectedUserData?.atipay_money || 0) < totalMoney
    )
      return setErrorMsg(`Saldo insuficiente.`);
    setSelectedImage(null);
    setShowConfirmModal(true);
  };

  const handleFinalProcessSale = async () => {
    setLoading(true);
    const itemNames = cart.map((item) => item.name).join(", ");
    try {
      const response = await storeManualPurchase({
        user_id: parseInt(selectedUser),
        amount: totalMoney,
        description: itemNames,
        points: totalPoints,
        payment_method: paymentMethod,
        image: selectedImage,
      });

      const purchaseId = response.purchase
        ? response.purchase.id
        : response.purchase_id
          ? response.purchase_id
          : Date.now();

      const newLog: TransactionLog = {
        id: purchaseId,
        user_name: selectedUserData?.username || "Cliente",
        description: itemNames,
        amount: totalMoney,
        points: totalPoints,
        payment_method: paymentMethod,
        date: new Date().toLocaleDateString("es-ES"),
        time: new Date().toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setHistory((prev) => [newLog, ...prev].slice(0, 50));
      setSuccessMsg("¡Venta registrada!");
      if (paymentMethod === "wallet" && selectedUserData)
        selectedUserData.atipay_money =
          (selectedUserData.atipay_money || 0) - totalMoney;
      setCart([]);
      setSelectedUser("");
      setPaymentMethod("cash");
      setShowConfirmModal(false);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (error) {
      console.error(error);
      const err = error as any;
      setErrorMsg(err.message || "Error al procesar.");
    } finally {
      setLoading(false);
    }
  };

  const confirmAnnulment = async () => {
    if (!itemToAnnul) return;
    setLoading(true);
    try {
      await annulPurchase(itemToAnnul);
      setHistory((prev) => prev.filter((item) => item.id !== itemToAnnul));
      setSuccessMsg("Venta anulada y eliminada del historial.");
    } catch (error) {
      console.error("Error anulando:", error);
      setHistory((prev) => prev.filter((item) => item.id !== itemToAnnul));
      setSuccessMsg("Venta eliminada del registro local.");
    } finally {
      setLoading(false);
      setItemToAnnul(null);
    }
  };

  const previewImageSrc = selectedImage
    ? URL.createObjectURL(selectedImage)
    : existingPackImageUrl || null;

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12 min-h-[90vh] bg-gray-50/30 p-4 sm:p-6 rounded-3xl">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 hidden sm:block">
            <img
              src={ATIPAY_ICON_SRC}
              alt="Atipay"
              className="w-10 h-10 object-contain"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mb-1">
              <LayoutDashboard className="w-4 h-4" />
              <span>Panel Administrativo</span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <span className="text-gray-900">Punto de Venta</span>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Registro de Ventas
            </h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-7 space-y-6">
          <CatalogPanel
            products={products}
            packs={packs}
            loading={productsLoading}
            onAddProduct={handleAddProduct}
            onAddPack={handleAddPack}
            onSaveCartAsPack={() => {
              setEditingPack(null);
              setShowCreatePackModal(true);
            }}
            onRulesChange={refreshAllData}
            onEditPack={handleEditPackSelect}
            // --- PROPS NUEVAS ---
            isDeleteMode={isDeleteMode}
            setIsDeleteMode={setIsDeleteMode}
            selectedToDelete={selectedToDelete}
            onExecuteBulkDelete={handleRequestBulkDelete} // Usamos la nueva funcion del modal
            onCancelDeleteMode={() => {
              setIsDeleteMode(false);
              setSelectedToDelete([]);
            }}
          />
        </div>
        <div className="xl:col-span-5 space-y-6 sticky top-6">
          <CartPanel
            users={users}
            selectedUser={selectedUser}
            onSelectUser={setSelectedUser}
            cart={cart}
            onRemoveItem={handleRemoveItem}
            totalMoney={totalMoney}
            totalPoints={totalPoints}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            onSubmit={handleInitiateSubmit}
            onSendToStore={handleOpenPackModal}
            loading={loading}
            errorMsg={errorMsg}
            successMsg={successMsg}
          />
        </div>
      </div>

      {/* --- AQUÍ ESTÁ EL NUEVO MODAL BONITO --- */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 transform transition-all animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-red-50 text-red-500">
                <Trash2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">
                  ¿Eliminar Seleccionados?
                </h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Vas a eliminar permanentemente{" "}
                  <b>{selectedToDelete.length}</b> elementos. Esta acción no se
                  puede deshacer.
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmBulkDelete}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-transform active:scale-95"
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESTO DE TUS MODALES (HISTORIAL, VENTA, ETC) */}

      <div className="mt-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-gray-500" /> Historial Local
            </h3>
            {history.length > 0 && (
              <button
                onClick={() => setShowClearModal(true)}
                className="px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Limpiar
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 text-xs uppercase font-semibold">
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Descripción</th>
                  <th className="px-6 py-4 text-center">Fecha</th>
                  <th className="px-6 py-4 text-center">Método</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {history.length > 0 ? (
                  history.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {log.user_name}
                      </td>
                      <td
                        className="px-6 py-4 text-gray-600 truncate max-w-[200px]"
                        title={log.description}
                      >
                        {log.description}
                      </td>
                      <td className="px-6 py-4 text-center">{log.date}</td>
                      <td className="px-6 py-4 text-center">
                        {log.payment_method === "wallet" ? (
                          <span className="text-blue-600 font-bold">SALDO</span>
                        ) : (
                          <span className="text-green-600 font-bold">
                            EFECTIVO
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">
                        S/ {log.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setItemToAnnul(log.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-gray-400"
                    >
                      Sin transacciones recientes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODALES CONFIRMACIÓN */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6">
            <h3 className="font-bold text-xl mb-4 text-center">
              Confirmar Venta
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 border rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleFinalProcessSale}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      {itemToAnnul && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center">
            <h3 className="font-bold text-lg mb-2">¿Anular Venta?</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setItemToAnnul(null)}
                className="flex-1 py-2 border rounded-xl"
              >
                No
              </button>
              <button
                onClick={confirmAnnulment}
                className="flex-1 py-2 bg-red-600 text-white rounded-xl"
              >
                Sí, Anular
              </button>
            </div>
          </div>
        </div>
      )}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center">
            <h3 className="font-bold text-lg mb-4">¿Limpiar Historial?</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                className="flex-1 py-2 border rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setHistory([]);
                  setShowClearModal(false);
                }}
                className="flex-1 py-2 bg-gray-900 text-white rounded-xl"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR PACK PRIVADO */}
      {showPackNameModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in zoom-in-95">
          <div className="bg-white rounded-3xl w-full max-w-md p-0 shadow-2xl overflow-hidden">
            <div className="bg-blue-50 p-6 border-b border-blue-100 text-center">
              <h3 className="font-extrabold text-xl text-blue-900">
                Crear Pack para Usuario
              </h3>
              <p className="text-xs text-blue-600 mt-1">
                Este pack aparecerá en su tienda personal.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Nombre del Pack
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={packNameInput}
                  onChange={(e) => setPackNameInput(e.target.value)}
                  placeholder="Ej: Pedido Especial"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Imagen del Pack (Opcional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept="image/*"
                    onChange={(e) =>
                      e.target.files && setSelectedImage(e.target.files[0])
                    }
                  />
                  {previewImageSrc ? (
                    <div className="relative w-full h-32">
                      <img
                        src={previewImageSrc}
                        className="w-full h-full object-cover rounded-lg"
                        alt="Previsualización"
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedImage(null);
                          setExistingPackImageUrl(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <span className="text-xs font-bold">
                        Click para subir foto
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                  Resumen
                </p>
                <div className="flex justify-between text-sm">
                  <span>Precio Total:</span>
                  <span className="font-bold text-gray-900">
                    S/ {totalMoney.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Puntos Totales:</span>
                  <span className="font-bold text-green-600">
                    {totalPoints.toFixed(2)} pts
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowPackNameModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePack}
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  "Enviando..."
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Enviar a Tienda
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <CreatePackModal
        isOpen={showCreatePackModal}
        onClose={() => {
          setShowCreatePackModal(false);
          setEditingPack(null);
        }}
        packToEdit={editingPack}
        // Modificamos onSuccess para recibir la respuesta del servidor
        onSuccess={(response?: any) => {
          setShowCreatePackModal(false);
          setEditingPack(null);
          refreshAllData();

          // ✅ Lógica para el mensaje de tu jefe
          if (response?.action === "deleted") {
            setErrorMsg(
              "El pack se eliminó automáticamente al quedarse sin productos."
            );
          } else {
            setSuccessMsg(
              editingPack
                ? "Pack actualizado y totales recalculados"
                : "Pack creado exitosamente 🎉"
            );
          }

          setTimeout(() => {
            setSuccessMsg(null);
            setErrorMsg(null);
          }, 4000);
        }}
      />
    </div>
  );
};
