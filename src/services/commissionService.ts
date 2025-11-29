import { API_BASE_URL } from '../config';

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
