import { API_BASE_URL } from '../config';
import { getMyRecharges } from './atipayRechargeService';
import { getUserProfile } from './userService';

interface ApiError extends Error {
  response?: Response;
  errorData?: any;
}

export interface WalletBalance {
  balance: number;
  currency: string;
  last_updated: string;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();
  
  if (!response.ok) {
    const error: ApiError = new Error(data.message || 'Error en la solicitud');
    error.response = response;
    error.errorData = data;
    throw error;
  }
  
  return data;
};

export const getWalletBalance = async (): Promise<WalletBalance> => {
  try {
    // Obtenemos el perfil del usuario que incluye el atipay_money
    const profile = await getUserProfile();
    
    return {
      balance: profile.atipay_money || 0,
      currency: 'PEN',
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error al obtener el saldo:', error);
    // En caso de error, intentamos con el método anterior como respaldo
    try {
      const recharges = await getMyRecharges();
      const approvedBalance = recharges
        .filter(recharge => recharge.status === 'approved')
        .reduce((sum, recharge) => sum + Number(recharge.amount), 0);
      
      return {
        balance: approvedBalance,
        currency: 'PEN',
        last_updated: new Date().toISOString()
      };
    } catch (fallbackError) {
      console.error('Error al obtener el saldo de respaldo:', fallbackError);
      return {
        balance: 0,
        currency: 'PEN',
        last_updated: new Date().toISOString()
      };
    }
  }
};

export const getTransactionHistory = async (params?: {
  page?: number;
  perPage?: number;
  type?: 'all' | 'credit' | 'debit';
}) => {
  const token = localStorage.getItem('token');
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.perPage) queryParams.append('per_page', params.perPage.toString());
  if (params?.type && params.type !== 'all') queryParams.append('type', params.type);
  
  const response = await fetch(`${API_BASE_URL}/wallet/transactions?${queryParams.toString()}`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return handleResponse(response);
};

export const transferToUser = async (receiverId: number, amount: number, type: 'investment' | 'withdrawal') => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}/atipay-transfers`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      receiver_id: receiverId,
      amount,
      type,
    }),
  });
  
  return handleResponse(response);
};

export const getTransferHistory = async (type: 'sent' | 'received') => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}/atipay-transfers/${type}`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return handleResponse(response);
};
