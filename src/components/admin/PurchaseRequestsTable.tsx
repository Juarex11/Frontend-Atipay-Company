/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Check,
  X,
  Loader2,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
  Search,
  ListFilter,
} from "lucide-react";
import { AtipayCoin } from "@/components/ui/AtipayCoin";
import { useToast } from "@/components/ui/use-toast";
import { ProductService } from "@/services/product.service";
import ProofViewer from "@/components/ProofViewer";
import { PurchaseDetailsModal } from "./PurchaseDetailsModal";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- UTILIDADES ---

const fixUrl = (url: string | null | undefined) => {
  if (!url) return null;

  // Si ya viene con https/https, revisamos si es localhost
  if (url.startsWith("https")) {
    return url.replace("https://localhost", "https://back.mibolsillo.site");
  }

  // Si viene solo la ruta relativa (/storage/...), le pegamos tu dominio
  return `https://back.mibolsillo.site/storage/${url.replace(/^\/storage\//, "")}`;
};

// Formatea fecha de forma segura (evita Invalid Date)
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return "-";
  }
};

const formatTime = (dateString: string | null | undefined) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return "";
  }
};

// --- INTERFACES ---

interface ApiPurchaseRequest {
  id: string | number;
  product_id: string | number;
  quantity: number;
  status: string;
  created_at: string;
  updated_at: string;
  request_date: string;
  request_time: string;
  deposit_proof_path?: string | null;
  deposit_status?: string; // Leemos el estado del depósito de la API
  user: {
    id: string | number;
    name: string;
    username: string;
    email: string;
    phone_number?: string;
  };
  product: {
    id: string | number;
    name: string;
    description: string;
    price: number;
    points_earned: number;
    image_url?: string;
    type?: string;
    status?: string;
  };
  payment_method: string;
  admin_message?: string | null;
  user_id?: string | number;
}

export interface PurchaseRequest {
  id: string | number;
  product_id: string | number;
  quantity: number;
  status: "pending" | "approved" | "rejected" | string;
  created_at: string;
  updated_at: string;
  request_date?: string;
  request_time?: string;
  deposit_proof_path?: string | null;
  deposit_status?: string;
  user: {
    id: string | number;
    name: string;
    email: string;
    username?: string;
    phone_number?: string;
  };
  product: {
    id: string | number;
    name: string;
    description: string;
    price: number;
    points_earned: number;
    image: string;
    type: string;
    status: string;
    stock: number;
    unit_type: string;
    points_to_redeem: number;
  };
  user_id?: string | number;
  payment_method: string;
  admin_message?: string | null;
}

// --- COMPONENTE PRINCIPAL ---

export function PurchaseRequestsTable() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | number | null>(
    null,
  );
  const [selectedRequest, setSelectedRequest] =
    useState<PurchaseRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const { toast } = useToast();

  // Visor de Imagen
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerData, setViewerData] = useState<{
    src: string | null;
    id?: string | number;
    productName?: string;
    date?: string;
    status?: string;
  } | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await ProductService.getPurchaseRequests();

      const formattedData = (data as unknown as ApiPurchaseRequest[]).map(
        (item) => {
          const productId = item.product?.id ? Number(item.product.id) : 0;
          const productImage = item.product?.image_url || "";

          // 1. Corrección de Fecha: Usamos created_at directo
          const finalDate = item.created_at;

          // 2. Corrección de Estado Visual:
          // Si la solicitud general ya no es "pending", el depósito asume ese estado
          // aunque la BD diga "pending".
          let finalDepositStatus = item.deposit_status || "pending";
          if (item.status === "rejected") finalDepositStatus = "rejected";
          if (item.status === "approved") finalDepositStatus = "approved";

          return {
            ...item,
            created_at: finalDate,
            deposit_proof_path: item.deposit_proof_path || null,
            deposit_status: finalDepositStatus,

            product: {
              id: productId,
              name: item.product?.name || "Producto desconocido",
              description: item.product?.description || "",
              price: item.product?.price || 0,
              points_earned: item.product?.points_earned || 0,
              image: productImage,
              type: item.product?.type || "product",
              status: item.product?.status || "active",
              stock: 0,
              unit_type: "unit",
              points_to_redeem: 0,
            },
            user: {
              id: item.user?.id || item.user_id || 0,
              name: item.user?.name || item.user?.username || "Usuario",
              email: item.user?.email || "",
            },
          } as PurchaseRequest;
        },
      );

      // Ordenar: Pendientes primero, luego fecha descendente
      formattedData.sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;

        const dateA = new Date(a.created_at).getTime() || 0;
        const dateB = new Date(b.created_at).getTime() || 0;
        return dateB - dateA;
      });

      setRequests(formattedData);
    } catch (error) {
      console.error("Error fetching purchase requests:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, paymentFilter]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        (req.user.name || "").toLowerCase().includes(searchLower) ||
        (req.user.email || "").toLowerCase().includes(searchLower) ||
        (req.product.name || "").toLowerCase().includes(searchLower);

      const matchesPayment =
        paymentFilter === "all" || req.payment_method === paymentFilter;
      const matchesStatus =
        statusFilter === "all" || req.status === statusFilter;

      return matchesSearch && matchesPayment && matchesStatus;
    });
  }, [requests, searchQuery, paymentFilter, statusFilter]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleApprove = async (id: string | number) => {
    // Si ya hay algo procesándose, ignora los clics adicionales
    if (processingId !== null) return;
    try {
      setProcessingId(id);
      await ProductService.approvePurchaseRequest(id);
      await fetchRequests();
      toast({
        title: "Aprobado",
        description: "Solicitud aprobada correctamente.",
        className: "bg-green-50 border-green-200 text-green-800",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo aprobar.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string | number) => {
    // Si ya hay algo procesándose, ignora los clics adicionales
    if (processingId !== null) return;

    try {
      setProcessingId(id);
      await ProductService.rejectPurchaseRequest(id, {
        admin_message: "Rechazado por admin",
      });
      await fetchRequests();
      toast({
        title: "Rechazado",
        description: "Solicitud rechazada.",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo rechazar.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenViewer = (request: PurchaseRequest) => {
    // Usamos la función de arriba para obtener la URL correcta
    const imageUrl = fixUrl(request.deposit_proof_path);

    setViewerData({
      src: imageUrl,
      id: request.id,
      productName: request.product.name,
      date: request.created_at, // Fecha de creación de la solicitud
      status: request.deposit_status, // Estado específico del depósito
    });

    setIsViewerOpen(true); // Abre el modal de la foto
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 border-green-200 hover:bg-green-100";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200 hover:bg-red-100";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "approved":
        return "Aprobado";
      case "rejected":
        return "Rechazado";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center h-64 items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* HEADER DE FILTROS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
        {/* BUSCADOR */}
        <div className="relative w-full lg:w-1/3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar usuario, email o producto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full bg-gray-50 border-gray-200 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
          {/* FILTRO ESTADO */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <div className="flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-gray-500" />
                <SelectValue placeholder="Estado" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">🟡 Pendientes</SelectItem>
              <SelectItem value="approved">🟢 Aprobados</SelectItem>
              <SelectItem value="rejected">🔴 Rechazados</SelectItem>
            </SelectContent>
          </Select>

          {/* FILTRO MÉTODO */}
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <SelectValue placeholder="Método" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los métodos</SelectItem>
              <SelectItem value="deposit">Depósito</SelectItem>
              <SelectItem value="atipay">Atipay</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TABLA DE CONTENIDO */}
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="w-[25%]">Producto</TableHead>
              <TableHead className="w-[15%]">Usuario</TableHead>
              <TableHead className="text-center">Cant.</TableHead>
              <TableHead className="text-center">Método</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-center">Fecha</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRequests.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-12 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Search className="h-6 w-6 text-gray-400" />
                    </div>
                    <p>No se encontraron resultados.</p>
                    {searchQuery && (
                      <p className="text-xs">Búsqueda: "{searchQuery}"</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRequests.map((request) => (
                <TableRow
                  key={request.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedRequest(request);
                    setIsModalOpen(true);
                  }}
                >
                  {/* CELDAS */}
                  <TableCell className="py-3">
                    <div className="flex items-center space-x-3">
                      {request.product?.image ? (
                        <img
                          src={request.product.image}
                          alt={request.product.name}
                          className="h-10 w-10 object-cover rounded-md border bg-gray-50"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-gray-100 rounded-md border flex items-center justify-center text-xs text-gray-400">
                          Sin img
                        </div>
                      )}
                      <span className="font-medium text-gray-900 line-clamp-2 text-sm">
                        {request.product?.name || "Producto"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 text-sm">
                        {request.user.name}
                      </span>
                      <span className="text-xs text-gray-500 truncate max-w-[140px]">
                        {request.user.email}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-center font-medium">
                    {request.quantity}
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={`capitalize ${
                        request.payment_method === "deposit"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : request.payment_method === "atipay"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : ""
                      }`}
                    >
                      {request.payment_method || "---"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 font-semibold">
                      <AtipayCoin size="xs" className="w-3.5 h-3.5" />
                      <span>
                        {(request.product?.price * request.quantity)?.toFixed(
                          2,
                        )}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge
                      className={`${getStatusBadgeStyles(request.status)} border shadow-sm`}
                    >
                      {getStatusText(request.status)}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-semibold text-gray-700 flex items-center gap-1 capitalize">
                        {formatDate(request.created_at)}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {formatTime(request.created_at)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        onClick={(e) => {
                          e.stopPropagation(); // Evita que se abra la fila entera

                          // LÓGICA INTELIGENTE:
                          if (
                            request.payment_method === "deposit" &&
                            request.deposit_proof_path
                          ) {
                            // Si es depósito y TIENE foto, abrimos el visor de imagen directamente
                            handleOpenViewer(request);
                          } else {
                            // Si es otro método o no tiene foto aún, abrimos los detalles generales
                            setSelectedRequest(request);
                            setIsModalOpen(true);
                          }
                        }}
                        // El título cambia dinámicamente para ayudar al admin
                        title={
                          request.deposit_proof_path
                            ? "Ver Comprobante"
                            : "Ver Detalles"
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {request.status === "pending" && (
                        <>
                          {/* Botón de Aprobar */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(request.id);
                            }}
                            disabled={processingId !== null}
                            title="Aprobar"
                          >
                            {processingId === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          {/* Botón de Rechazar */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(request.id);
                            }}
                            // 🟢 CAMBIO AQUÍ:
                            disabled={processingId !== null}
                            title="Rechazar"
                          >
                            {processingId === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <p className="text-sm text-gray-500">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
            {Math.min(currentPage * itemsPerPage, filteredRequests.length)} de{" "}
            {filteredRequests.length} resultados
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
            </Button>
            <div className="text-sm font-medium">
              Página {currentPage} de {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* MODALES */}
      <PurchaseDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        request={selectedRequest}
      />
      <ProofViewer
        open={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        data={viewerData}
      />
    </div>
  );
}

export default PurchaseRequestsTable;
