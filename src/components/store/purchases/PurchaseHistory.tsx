import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  ShoppingBag,
  Package,
  UploadCloud,
  Search,
  ExternalLink,
  Clock
} from 'lucide-react';
import { productService } from '@/services/productService';
import type { PurchaseRequest } from '@/services/productService';
import { UploadProof } from '@/components/UploadProof';
import ProofViewer from '@/components/ProofViewer';
import { motion } from 'framer-motion';

/* ===========================
   Helpers: badges y utilidades
   =========================== */

const STATUS_BADGE_BASE = 'px-2 py-[2px] rounded-full text-[11px] font-semibold';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return <span className={`${STATUS_BADGE_BASE} bg-green-100 text-green-700`}>Aprobada</span>;
    case 'rejected':
      return <span className={`${STATUS_BADGE_BASE} bg-red-100 text-red-700`}>Rechazada</span>;
    default:
      return <span className={`${STATUS_BADGE_BASE} bg-yellow-100 text-yellow-700`}>Pendiente</span>;
  }
};

const getDepositStatusBadge = (status?: string | null) => {
  if (!status) return null;
  const base = 'px-2 py-[2px] rounded-full text-[10px] font-semibold';
  switch (status) {
    case 'approved':
      return <span className={`${base} bg-green-100 text-green-700`}>✓ Comprobante aprobado</span>;
    case 'rejected':
      return <span className={`${base} bg-red-100 text-red-700`}>✗ Comprobante rechazado</span>;
    case 'expired':
      return <span className={`${base} bg-gray-100 text-gray-700`}>⏰ Comprobante expirado</span>;
    case 'pending':
      return <span className={`${base} bg-blue-100 text-blue-700`}>⏳ En revisión</span>;
    default:
      return null;
  }
};

/* ===========================
   Componente principal
   =========================== */

const PurchaseHistory: React.FC = () => {
  const [purchases, setPurchases] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [currentTab, setCurrentTab] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>(''); // '' | 'deposit' | 'atipay'

  // Modals
  const [selectedForUpload, setSelectedForUpload] = useState<PurchaseRequest | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerData, setViewerData] = useState<{
    src: string | null;
    id?: string | number;
    productName?: string;
    date?: string;
    status?: string;
  } | null>(null);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

  // Construye URL absoluta y corrige localhost -> 127.0.0.1:8000
  function makeFullUrl(path?: string | null) {
    if (!path) return null;
    if (path.includes('localhost')) {
      return path.replace('localhost', '127.0.0.1:8000');
    }
    if (path.startsWith('http')) return path;
    const clean = path.startsWith('/') ? path : `/${path}`;
    if (clean.startsWith('/storage')) return `${API_BASE}${clean}`;
    return `${API_BASE}/storage${clean}`;
  }

  // Abre visor con objeto completo
  function openProof(purchase: PurchaseRequest) {
    const url = makeFullUrl(purchase.deposit_proof_path);
    setViewerData({
      src: url,
      id: purchase.id,
      productName: purchase.product.name,
      date: purchase.created_at,
      status: purchase.deposit_status || purchase.status,
    });
    setViewerOpen(true);
  }

  // Carga compras inicial
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const data = await productService.getMyPurchaseHistory();
        setPurchases(data || []);
        setError(null);
      } catch (err) {
        console.error('Error cargando historial:', err);
        setError('No se pudo cargar el historial de compras. Intenta más tarde.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Contadores por pestaña
  const counts = useMemo(() => ({
    all: purchases.length,
    pending: purchases.filter(p => p.status === 'pending').length,
    approved: purchases.filter(p => p.status === 'approved').length,
    rejected: purchases.filter(p => p.status === 'rejected').length,
  }), [purchases]);

  // Filtrado (tabs + search + método)
  const filteredPurchases = useMemo(() => {
    return purchases
      .filter(p => (currentTab === 'all' ? true : p.status === currentTab))
      .filter(p => p.product.name.toLowerCase().includes(search.toLowerCase()))
      .filter(p => paymentFilter ? p.payment_method === paymentFilter : true);
  }, [purchases, currentTab, search, paymentFilter]);

  // Estados UI: loading / error / vacío
  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-gray-600 text-sm">Cargando historial de compras...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-semibold text-red-600">Error</h3>
        <p className="text-gray-600 mt-2">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">Reintentar</Button>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <ShoppingBag className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">No tienes compras aún</h3>
        <p className="text-gray-600 mt-1">Explora nuestros productos y realiza tu primera compra.</p>
      </div>
    );
  }

  /* ===========================
     Render principal
     =========================== */
  return (
    <div className="space-y-6">

      {/* Modales */}
      {selectedForUpload && (
        <UploadProof
          purchase={selectedForUpload}
          onClose={() => setSelectedForUpload(null)}
          onSuccess={async () => {
            setSelectedForUpload(null);
            // recargar compras
            try {
              const data = await productService.getMyPurchaseHistory();
              setPurchases(data || []);
            } catch (err) {
              console.error('Error recargando compras:', err);
            }
          }}
        />
      )}

      <ProofViewer open={viewerOpen} onClose={() => setViewerOpen(false)} data={viewerData} />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Historial de Compras</h2>
          <p className="text-sm text-gray-500 mt-1">Administra tus comprobantes y el estado de tus compras</p>
        </div>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-3 p-4 border rounded-lg bg-white/60 shadow-sm">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />   
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-md pl-9 pr-3 py-2 text-sm w-64"
          />
        </div>

        {/* Filtro método de pago: deposit / atipay */}
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="border px-3 py-2 rounded-md text-sm"
        >
          <option value="">Todos los métodos</option>
          <option value="deposit">Depósito Bancario</option>
          <option value="atipay">Pago con Atipay</option>
        </select>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Info destacado */}
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>Formato: JPG/PNG · Máx 5MB · Solo Depósito / Atipay</span>
        </div>
      </div>

      {/* Tabs con contadores */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="all">Todas ({counts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pendientes ({counts.pending})</TabsTrigger>
          <TabsTrigger value="approved">Aprobadas ({counts.approved})</TabsTrigger>
          <TabsTrigger value="rejected">Rechazadas ({counts.rejected})</TabsTrigger>
        </TabsList>

        <TabsContent value={currentTab} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPurchases.map((purchase, i) => (
              <motion.div
                key={purchase.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: i * 0.04 }}
              >
                <Card className="relative overflow-hidden border-gray-200 hover:shadow-lg transition-shadow duration-200">
                  {/* Visual status border */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-[4px] ${
                      purchase.status === 'approved' ? 'bg-green-500' :
                      purchase.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-400'
                    }`}
                  />

                  <CardHeader className="bg-gray-50 border-b pl-6">
                    <CardTitle className="flex justify-between items-start gap-2">
                      <div className="pr-2 w-3/4">
                        <span className="text-sm font-semibold block truncate">{purchase.product.name}</span>
                        <div className="mt-1 flex gap-2 flex-wrap">
                          {getStatusBadge(purchase.status)}
                          {purchase.payment_method === 'deposit' && purchase.deposit_status && getDepositStatusBadge(purchase.deposit_status)}
                        </div>
                      </div>

                      <div className="text-right w-1/4">
                        {/* small date */}
                        <div className="text-xs text-gray-400">
                          {purchase.created_at ? new Date(purchase.created_at).toLocaleDateString() : ''}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-4 pl-6 pr-6 pb-6">
                    <div className="flex items-start gap-4">
                      {/* imagen o placeholder */}
                      {purchase.product.image_url ? (
                        <img
                          src={purchase.product.image_url}
                          alt={purchase.product.name}
                          className="h-16 w-16 object-cover rounded-md shadow-sm"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {/* Metodo de pago (map a texto bonito) */}
                        <p className="text-xs text-gray-600">
                          Método de pago:{' '}
                          <span className="font-medium text-gray-800">
                            {purchase.payment_method === 'deposit' ? 'Depósito Bancario' : purchase.payment_method === 'atipay' ? 'Pago con Atipay' : purchase.payment_method}
                          </span>
                        </p>

                        {/* Puntos ya no se muestra (no existe) */}

                        {/* Sección deposit / comprobante */}
                        {purchase.payment_method === 'deposit' && (
                          <div className="mt-3">
                            {!purchase.deposit_proof_path ? (
                              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-xs text-yellow-800 font-semibold">⚠ Comprobante pendiente</p>
                                <p className="text-xs text-yellow-700 mt-1">Sube una foto clara del voucher. Asegúrate que se vea el monto, la fecha y el número de operación.</p>
                                <div className="mt-3">
                                  <Button
                                    onClick={() => setSelectedForUpload(purchase)}
                                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white text-xs flex items-center gap-2"
                                  >
                                    <UploadCloud className="w-4 h-4" />
                                    Subir comprobante
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                                <p className="text-xs text-green-700 font-semibold">✓ Comprobante subido</p>
                                <div className="mt-2 flex items-center justify-center gap-3">
                                  <button
                                    onClick={() => openProof(purchase)}
                                    className="text-xs text-green-700 hover:underline flex items-center gap-1"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Ver comprobante
                                  </button>
                                  {/* descarga directa (si quieres habilitar) */}
                                  <a
                                    href={makeFullUrl(purchase.deposit_proof_path) || undefined}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-gray-600 hover:underline"
                                  >
                                    Abrir en nueva pestaña
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Método atipay (informativo) */}
                        {purchase.payment_method === 'atipay' && (
                          <div className="mt-3">
                            <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg">
                              <p className="text-xs text-blue-700 font-semibold">Pago con Atipay</p>
                              <p className="text-xs text-gray-600 mt-1">El pago se procesó mediante Atipay.</p>
                            </div>
                          </div>
                        )}

                        {/* Mensaje admin (si hay) */}
                        {purchase.admin_message && (
                          <div className="mt-3 p-2 bg-gray-50 rounded-md border">
                            <p className="text-xs text-gray-700">
                              <span className="font-semibold">Mensaje del administrador:</span> {purchase.admin_message}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PurchaseHistory;
