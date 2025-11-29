import type { Transaction } from "@/types/transactions";

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    completed: "Completada",
    pending: "Pendiente",
    failed: "Fallida",
    cancelled: "Cancelada",
    approved: "Aprobado",
    rejected: "Rechazado",
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "cancelled":
      return "bg-gray-100 text-gray-800";
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-blue-100 text-blue-800";
  }
};

export const getTypeColor = (type: string) => {
  switch (type) {
    case "withdrawal":
      return "text-red-600";
    case "deposit":
      return "text-green-600";
    case "investment":
      return "text-green-600";
    case "return":
      return "text-purple-600";
    case "commission":
      return "text-gold-600";
    default:
      return "text-gray-600";
  }
};

export const getTypeLabel = (type: string) => {
  switch (type) {
    case "withdrawal":
      return "Retiro";
    case "deposit":
      return "Depósito";
    case "investment":
      return "Inversión";
    case "return":
      return "Retorno";
    case "commission":
      return "Comisión";
    default:
      return type;
  }
};

export const getWithdrawalLabel = (method: string) => {
  if (method === "bank_transfer") return "Datos bancarios";
  if (method === "crypto") return "Dirección de wallet";
  return "Información de cuenta";
};

export const getWithdrawalPlaceholder = (method: string) => {
  if (method === "bank_transfer") return "IBAN, titular, banco...";
  if (method === "crypto") return "Dirección de wallet...";
  return "Email o ID de cuenta...";
};

export const filterTransactions = (
  transactions: Transaction[],
  filterType: string,
  filterStatus: string,
  searchTerm: string
) => {
  return transactions.filter((transaction) => {
    const matchesType = filterType === "all" || transaction.type === filterType;
    const matchesStatus =
      filterStatus === "all" || transaction.status === filterStatus;
    const matchesSearch =
      transaction.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });
};

export const calculateTransactionTotals = (transactions: Transaction[]) => {
  const totalEarnings = transactions
    .filter((t) => t.type === "return" || t.type === "commission")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter((t) => t.type === "withdrawal" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingWithdrawals = transactions
    .filter((t) => t.type === "withdrawal" && t.status === "pending")
    .reduce((sum, t) => sum + t.amount, 0);

  return { totalEarnings, totalWithdrawals, pendingWithdrawals };
};
