import { API_BASE_URL } from '../config';
import type {CommissionHistoryItem, CommissionHistoryResponse, WithdrawalHistoryItem, WithdrawalHistoryResponse} from '../types/commission';

export interface TransactionHistoryItem {
  id: number;
  type: 'commission' | 'withdrawal';
  date: string;
  amount: string; // El backend suele enviar decimales como string
  status: string;
  // Estos campos vienen solo si es comisión
  level?: number;
  points?: number;
  source_type?: string;
  from_user?: string;
}

interface ErrorResponse {
  message?: string;
  [key: string]: unknown;
}

interface ApiError extends Error {
  response?: Response;
  errorData?: ErrorResponse;
}

export interface CommissionSetting {
  id?: number;
  level: number;
  percentage: number;
  created_at?: string;
  updated_at?: string;
}

export interface CommissionSummary {
  user: number;
  summary: {
    total_pendientes: number;
    total_retiradas: number;
    detalle_por_nivel: Array<{
      pendientes: string;
      retiradas: string;
      level: number;
    }>;
  };
}

export interface UnwithdrawnHistory {
  user: number;
  history: Array<{
    month: string;
    year: number;
    amount: string;
  }>;
}

export interface WithdrawResponse {
  success: boolean;
  message: string;
  amount?: string;
}

// === NUEVAS INTERFACES PARA EL REPORTE (ADMIN DASHBOARD) ===

export interface DashboardTotals {
  total_general: string;
  total_pagadas: string;
  total_pendientes: string;
}

export interface MonthlyCommissionStat {
  year: number | null;
  month: number | null;
  total: string;
  pagadas: string;
  pendientes: string;
}

export interface CommissionUserBasic {
  id: number;
  username: string;
  email: string;
  referral_url?: string;
}

export interface UserCommissionStat {
  user_id: number;
  total: string;
  pagadas: string;
  pendientes: string;
  user: CommissionUserBasic;
}

export interface CommissionDetailItem {
  id: number;
  user_id: number;
  referred_user_id: number;
  level: number;
  commission_amount: string;
  points_generated: number;
  source_type: string;
  month: number;
  year: number;
  withdrawn: number; // 0 o 1
  locked: number;
  user: CommissionUserBasic;
  referred_user: CommissionUserBasic;
}

export interface CommissionReportResponse {
  totales_generales: DashboardTotals;
  por_mes: MonthlyCommissionStat[];
  por_usuario: UserCommissionStat[];
  detalle: CommissionDetailItem[];
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: ApiError = new Error(errorData.message || 'Error en la solicitud');
    error.response = response;
    error.errorData = errorData;
    throw error;
  }
  
  // Para respuestas vacías (como en DELETE 204)
  if (response.status === 204) {
    return {} as T;
  }
  
  return response.json();
};

export const getCommissionSettings = async (): Promise<CommissionSetting[]> => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}/commissions/settings`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return handleResponse<CommissionSetting[]>(response);
};

// === FUNCIÓN PARA OBTENER EL HISTORIAL COMBINADO ===
export const getHistory = async (): Promise<TransactionHistoryItem[]> => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}/commissions/history`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  
  // Usamos tu helper handleResponse, pero extraemos la propiedad 'data'
  // porque tu backend devuelve { success: true, data: [...] }
  const jsonResponse = await handleResponse<{ success: boolean; data: TransactionHistoryItem[] }>(response);
  return jsonResponse.data;
};

export const createCommissionSetting = async (data: Omit<CommissionSetting, 'id' | 'created_at' | 'updated_at'>): Promise<CommissionSetting> => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}/commissions/settings`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  
  return handleResponse<CommissionSetting>(response);
};

export const deleteCommissionSetting = async (level: number): Promise<void> => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}/commissions/settings/${level}`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return handleResponse<void>(response);
};

export const getCommissionSummary = async (): Promise<CommissionSummary> => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}/commissions/network/summary`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return handleResponse<CommissionSummary>(response);
};

export const getUnwithdrawnHistory = async (): Promise<UnwithdrawnHistory> => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}/commissions/history/unwithdrawn`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return handleResponse<UnwithdrawnHistory>(response);
};

export const withdrawCommissions = async (): Promise<WithdrawResponse> => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}/commissions/withdraw`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return handleResponse<WithdrawResponse>(response);
};

//  NUEVA FUNCIÓN PARA OBTENER EL REPORTE GENERAL DE COMISIONES
export const getDashboardReport = async (): Promise<CommissionReportResponse> => {
  const token = localStorage.getItem('token');
  
  // Nota: Usamos la ruta exacta que validamos en Postman
  const response = await fetch(`${API_BASE_URL}/commissions/report`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    
  });
  
  
  return handleResponse<CommissionReportResponse>(response);
};
export const getMinPointsRequired = async (): Promise<number> => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/affiliate/min-points-required`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
        // Si hay error (ej. 404 o 500), devolvemos 0 para no romper la UI
        console.warn('No se pudo obtener la meta de puntos, usando valor por defecto.');
        return 0; 
    }

    const data = await response.json();
    // La API devuelve { "min_points": 20 }
    return data.min_points || 0; 
  } catch (error) {
    console.error("Error de red obteniendo puntos mínimos:", error);
    return 0;
  }
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// historial de comisiones 
export const getCommissionHistory = async (): Promise<CommissionHistoryItem[]> => {
  const response = await fetch(`${API_BASE_URL}/affiliate/commission-history`, {
    headers: getAuthHeaders(),
  });
  
  const result = await handleResponse<CommissionHistoryResponse>(response);
  return result.data;
};

// historial de retiros
export const getWithdrawalHistory = async (): Promise<WithdrawalHistoryItem[]> => {
  const response = await fetch(`${API_BASE_URL}/commissions/withdrawals/history`, {
    headers: getAuthHeaders(),
  });
  
  const result = await handleResponse<WithdrawalHistoryResponse>(response);
  if (!result.success || !result.history) {
    return [];
  }
  return result.history;
};