// Validation functions for withdrawal operations

export const validateWithdrawalAddress = (method: string, address: string): string | null => {
  const value = address.trim();
  if (!value) return null;

  if (method === "yape" || method === "plin") {
    return /^\d{9}$/.test(value) ? null : "Debe contener exactamente 9 dígitos";
  }

  if (method === "bank") {
    return /^\d{20}$/.test(value) 
      ? null 
      : "CCI inválido: debe tener exactamente 20 dígitos";
  }

  if (method === "crypto") {
    const ethLike = /^0x[a-fA-F0-9]{40}$/;
    const tron = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
    return (ethLike.test(value) || tron.test(value)) 
      ? null 
      : "Dirección USDT inválida. Aceptamos: 0x… (ERC20/BEP20) o T… (TRC20)";
  }

  return null;
};

export const validateWithdrawalAmount = (
  amountStr: string, 
  availableBalance: number, 
  min: number, 
  max: number
): string | null => {
  const amount = Number(amountStr);
  
  if (!amountStr || isNaN(amount)) return "Ingresa un monto válido";
  if (amount <= 0) return "El monto debe ser mayor a 0";
  if (amount > availableBalance) return "No puedes retirar más que tu saldo disponible";
  if (amount < min) return `El mínimo para este método es S/. ${min.toFixed(2)}`;
  if (amount > max) return `El máximo para este método es S/. ${max.toFixed(2)}`;
  
  return null;
};

export const getWithdrawalLabel = (method: string): string => {
  const labels: Record<string, string> = {
    bank: "Número de cuenta bancaria",
    crypto: "Dirección de wallet USDT",
    yape: "Número telefónico Yape",
    plin: "Número telefónico Plin"
  };
  
  return labels[method] || "Información de cuenta";
};

export const getWithdrawalPlaceholder = (method: string): string => {
  const placeholders: Record<string, string> = {
    bank: "Ingresa tu número de cuenta con CCI",
    crypto: "Ingresa tu número de wallet...",
    yape: "Ingresa tu número vinculado a tu Yape",
    plin: "Ingresa tu número vinculado a tu Plin"
  };
  
  return placeholders[method] || "Ingrese los datos relacionados a su metodo de pago";
};

export const getWithdrawalDescription = (method: string): string => {
  const descriptions: Record<string, string> = {
    yape: "Debe ser un número telefónico peruano de 9 dígitos.",
    plin: "Debe ser un número telefónico peruano de 9 dígitos.",
    bank: "Ingresa tu CCI (20 dígitos, sin espacios ni guiones).",
    crypto: "Direcciones USDT soportadas: 0x… (ERC20/BEP20/Polygon) o T… (TRC20)."
  };
  
  return descriptions[method] || "";
};
