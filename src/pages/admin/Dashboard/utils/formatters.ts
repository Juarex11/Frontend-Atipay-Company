import type { StatusType, KYCStatusType, PriorityType, PaymentMethod } from '../types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(amount);
};

export const getStatusColor = (status: StatusType): string => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "suspended":
      return "bg-red-100 text-red-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getKYCStatusColor = (status: KYCStatusType): string => {
  switch (status) {
    case "verified":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
  }
};

export const getUserStatusText = (status: StatusType): string => {
  if (status === "active") return "Activo";
  if (status === "suspended") return "Suspendido";
  return "Pendiente";
};

export const getKycStatusText = (status: KYCStatusType): string => {
  if (status === "verified") return "Verificado";
  if (status === "pending") return "Pendiente";
  return "Rechazado";
};

export const getPaymentMethodText = (method: PaymentMethod): string => {
  if (method === "bank_transfer") return "Transferencia";
  if (method === "crypto") return "Crypto";
  return "PayPal";
};

export const getPriorityText = (priority: PriorityType): string => {
  if (priority === "high") return "Alta";
  if (priority === "normal") return "Normal";
  return "Baja";
};

export const getPriorityColor = (priority: PriorityType): string => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800";
    case "normal":
      return "bg-blue-100 text-blue-800";
    case "low":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-blue-100 text-blue-800";
  }
};
