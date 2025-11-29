import type { Transaction } from "@/types/transactions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, X, Clock, CheckCircle, XCircle, AlertCircle, CreditCard, Calendar, FileText, DollarSign, MessageSquare } from "lucide-react";
import { useState } from 'react';
import {
  getStatusColor,
  getStatusText,
  getTypeColor,
  formatCurrency
} from "@/utils/transactionUtils";
import { AtipayCoin } from "@/components/ui/AtipayCoin";

// Componente de modal para mostrar detalles de la transacción
const TransactionDetailsModal = ({
  transaction,
  isOpen,
  onClose
}: {
  transaction: TransactionWithPaymentMethod;
  isOpen: boolean;
  onClose: () => void
}) => {
  if (!isOpen) return null;

  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 p-6 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              {getStatusIcon()}
              Detalles de la Transacción
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-green-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Método de pago
              </p>
              <p className="font-medium capitalize">{transaction.payment_method_name || transaction.method || 'No especificado'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 flex items-center justify-end gap-2">
                <Calendar className="w-4 h-4" />
                Fecha
              </p>
              <p className="font-medium">
                {new Date(transaction.date).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Descripción
              </span>
              <span className="font-medium">{transaction.description}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Monto
              </span>
              <div className="flex items-center gap-1">
                <AtipayCoin size="sm" className="w-4 h-4" />
                <span className={`font-medium ${getTypeColor(transaction.type)}`}>
                  {transaction.type === 'withdrawal' ? '-' : '+'}
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600 flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Estado:</span>
                  <Badge className={getStatusColor(transaction.status)}>
                    {getStatusText(transaction.status)}
                  </Badge>
                </div>
              </span>
            </div>

            {transaction.admin_message && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500 flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <span className="font-medium">Mensaje del administrador:</span>{' '}
                    {transaction.admin_message}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-300 hover:bg-gray-100"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};

// Tipo extendido para incluir información del método de pago
interface TransactionWithPaymentMethod extends Omit<Transaction, 'reference'> {
  reference?: string; // Hacer reference opcional ya que la API no lo envía
  user_payment_method_id?: number;
  payment_method_name?: string;
}

interface TransactionsTableProps {
  transactions: TransactionWithPaymentMethod[];
}

export const TransactionsTable = ({ transactions }: TransactionsTableProps) => {
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithPaymentMethod | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Función para obtener el color del método de pago
  const getMethodColor = (methodName: string): string => {
    const method = methodName.toLowerCase();
    if (method.includes('yape')) return 'bg-purple-50 text-purple-700';
    if (method.includes('plin')) return 'bg-orange-50 text-orange-700';
    if (method.includes('bcp') || method.includes('banco')) return 'bg-blue-50 text-blue-700';
    if (method.includes('bbva')) return 'bg-blue-50 text-blue-700';
    if (method.includes('interbank')) return 'bg-yellow-50 text-yellow-700';
    if (method.includes('scotiabank')) return 'bg-red-50 text-red-700';
    if (method.includes('bonificación') || method.includes('bonus')) return 'bg-green-50 text-green-700';
    return 'bg-gray-50 text-gray-700'; // color por defecto
  };

  const handleViewClick = (transaction: TransactionWithPaymentMethod) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };
  return (
    <>
      <Table>
        <TableHeader className="bg-[#3EB363] text-white">
          <TableRow>
            <TableHead>Descripción</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            // Create a unique key by combining ID and reference (or another unique field)
            const uniqueKey = `${transaction.id}_${transaction.reference || transaction.date}`;
            return (
              <TableRow key={uniqueKey}>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {transaction.description}
                    </div>
                    {transaction.fee > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(transaction.fee)}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{new Date(transaction.date).toLocaleDateString("es-ES", { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(transaction.date).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${getMethodColor(transaction.payment_method_name || transaction.method || '')}`}>
                      <CreditCard className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {transaction.payment_method_name || transaction.method || 'Método desconocido'}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <AtipayCoin size="sm" className="w-4 h-4" />
                    <span className={`font-medium text-base ${getTypeColor(transaction.type)}`}>
                      {transaction.type === "withdrawal" ? "-" : "+"}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(transaction.status)}>
                    {getStatusText(transaction.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewClick(transaction)}
                    className="hover:bg-green-50 hover:text-green-700"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};
