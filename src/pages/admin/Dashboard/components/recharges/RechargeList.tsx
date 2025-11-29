import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { AtipayCoin } from "@/components/ui/AtipayCoin";
import {
  approveRecharge,
  rejectRecharge,
  type Recharge,
} from "@/services/atipayRechargeService";
import { getUserPaymentMethods, type UserPaymentMethod } from "@/services/userPaymentMethodService";
import { toast } from "sonner";
import { DetailsModal } from "./components/DetailsModal";
import { DeleteModal } from "./components/DeleteModal";

interface RechargeListProps {
  recharges: Recharge[];
  onReload: () => void;
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

// Estilos de colores para los métodos de pago
const paymentMethodStyles: Record<string, string> = {
  "Yape": "bg-purple-100 text-purple-800 border-purple-200",
  "Plin": "bg-blue-100 text-blue-800 border-blue-200",
  "Transferencia bancaria": "bg-green-100 text-green-800 border-green-200",
  "Transferencia Bancaria": "bg-green-100 text-green-800 border-green-200",
  "BCP": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Interbank": "bg-orange-100 text-orange-800 border-orange-200",
  "BBVA": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Scotiabank": "bg-red-100 text-red-800 border-red-200",
  "Tunki": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Otro": "bg-gray-100 text-gray-800 border-gray-200",
  "Other": "bg-gray-100 text-gray-800 border-gray-200",
};

// Función para obtener los estilos del método de pago
const getPaymentMethodStyles = (methodName: string) => {
  return paymentMethodStyles[methodName] || "bg-gray-100 text-gray-800 border-gray-200";
};

export const RechargeList = ({ recharges, onReload }: RechargeListProps) => {
  const [detail, setDetail] = useState<Recharge | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Recharge | null>(null);
  const [userPaymentMethods, setUserPaymentMethods] = useState<UserPaymentMethod[]>([]);

  // Cargar métodos de pago del usuario para poder mostrar los nombres
  useEffect(() => {
    const loadUserPaymentMethods = async () => {
      try {
        const methods = await getUserPaymentMethods();
        setUserPaymentMethods(methods);
      } catch (error) {
        console.error('Error loading user payment methods:', error);
      }
    };

    loadUserPaymentMethods();
  }, []);

  // Función para obtener el nombre del método de pago
  const getPaymentMethodName = (userPaymentMethodId: string) => {
    const method = userPaymentMethods.find(m => m.id.toString() === userPaymentMethodId);
    return method?.method?.name || `Método ${userPaymentMethodId}`;
  };

  const handleApprove = async (id: number) => {
    setLoadingId(id);
    try {
      await approveRecharge(id);
      toast.success("Recarga aprobada");
      onReload();
    } catch (e) {
      const error = e as Error;
      toast.error(`Error al aprobar: ${error.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: number) => {
    setLoadingId(id);
    try {
      await rejectRecharge(id, "");
      toast.success("Recarga rechazada");
      setRejectTarget(null);
      onReload();
    } catch (e) {
      const error = e as Error;
      toast.error(`Error al rechazar: ${error.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader className="bg-[#3EB363] text-white">
          <TableRow>
            <TableHead className="text-white">Nombre completo</TableHead>
            <TableHead className="text-white">Monto</TableHead>
            <TableHead className="text-white">Método</TableHead>
            <TableHead className="text-white">Estado</TableHead>
            <TableHead className="text-white text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recharges.map((r) => (
            <TableRow key={r.id} className="hover:bg-gray-50">
              <TableCell
                title={r.full_names}
                className="max-w-[180px] truncate"
              >
                {r.full_names}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <AtipayCoin size="xs" className="w-3.5 h-3.5" />
                  <span>{r.amount.toFixed(2)}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={`${getPaymentMethodStyles(getPaymentMethodName(r.user_payment_method_id))} border text-xs font-medium px-2 py-1`}>
                  {getPaymentMethodName(r.user_payment_method_id)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={`${statusStyles[r.status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'} capitalize`}>
                  {statusLabels[r.status as keyof typeof statusLabels] || r.status}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDetail(r)}
                    className="cursor-pointer"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {r.status === "pending" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loadingId === r.id}
                        onClick={() => handleApprove(r.id)}
                        className="text-green-600 hover:text-green-700 cursor-pointer"
                      >
                        <CheckCircle className="h-6 w-6" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loadingId === r.id}
                        onClick={() => setRejectTarget(r)}
                        className="text-red-600 hover:text-red-700 cursor-pointer"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <DetailsModal
        detail={detail}
        open={!!detail}
        onClose={() => setDetail(null)}
        statusLabels={statusLabels}
        getPaymentMethodName={getPaymentMethodName}
      />
      <DeleteModal
        target={rejectTarget}
        open={!!rejectTarget}
        onCancel={() => setRejectTarget(null)}
        onConfirm={() => rejectTarget && handleReject(rejectTarget.id)}
        confirming={rejectTarget ? loadingId === rejectTarget.id : false}
      />
    </div>
  );
};
