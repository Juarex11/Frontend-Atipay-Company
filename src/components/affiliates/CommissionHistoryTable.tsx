import { useEffect, useState } from "react";
// Asegúrate de que esta ruta apunte a tu servicio real
import {
  getHistory,
  TransactionHistoryItem,
} from "@/services/commissionService";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowUpRight, ArrowDownLeft, FileText } from "lucide-react";

export default function CommissionHistoryTable() {
  const [history, setHistory] = useState<TransactionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getHistory();
        setHistory(data);
      } catch (error) {
        console.error("Error al cargar el historial:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Función para generar la descripción según el tipo de dato
  const getDescription = (item: TransactionHistoryItem) => {
    if (item.type === "withdrawal") {
      return "Retiro de ganancias a billetera";
    }

    // Traducción de tipos de origen
    const typeMap: Record<string, string> = {
      purchase: "Compra",
      investment: "Inversión",
    };
    const source = typeMap[item.source_type || ""] || item.source_type;

    return (
      <div className="flex flex-col">
        <span className="font-medium text-gray-700">
          Comisión Nivel {item.level}
        </span>
        <span className="text-xs text-gray-500">
          Por {source} de{" "}
          <span className="font-semibold">{item.from_user || "Usuario"}</span>
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12 text-green-600">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No hay registros de movimientos aún.</p>
        <p className="text-sm mt-1">
          Las comisiones y retiros aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="w-[140px]">Fecha</TableHead>
              <TableHead className="w-[100px]">Tipo</TableHead>
              <TableHead>Detalle</TableHead>
              <TableHead className="text-right">Puntos</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-center w-[120px]">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((item, index) => (
              <TableRow
                key={`${item.type}-${item.id}-${index}`}
                className="hover:bg-gray-50/50 transition-colors"
              >
                <TableCell className="whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(item.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  {item.type === "commission" ? (
                    <Badge
                      variant="secondary"
                      className="bg-green-50 text-green-700 border-green-100 hover:bg-green-100"
                    >
                      <ArrowDownLeft className="w-3 h-3 mr-1" /> Ingreso
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100"
                    >
                      <ArrowUpRight className="w-3 h-3 mr-1" /> Retiro
                    </Badge>
                  )}
                </TableCell>

                <TableCell>{getDescription(item)}</TableCell>

                <TableCell className="text-right font-medium">
                  {item.type === "commission" && item.points ? (
                    <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs font-semibold">
                      +{item.points} pts
                    </span>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </TableCell>

                <TableCell
                  className={`text-right font-bold text-sm ${item.type === "commission" ? "text-green-600" : "text-red-500"}`}
                >
                  {item.type === "commission" ? "+" : "-"}
                  {formatCurrency(Number(item.amount))}
                </TableCell>

                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className="text-gray-500 border-gray-200 font-normal"
                  >
                    {item.status === "approved" || item.status === "completed"
                      ? "Completado"
                      : item.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
