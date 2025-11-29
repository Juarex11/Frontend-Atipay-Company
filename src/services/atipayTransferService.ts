import { API_BASE_URL } from "../config";
import { getAuthHeaders } from "../utils/auth";

interface ApiError extends Error {
  response?: Response;
  errorData?: any;
}

interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface CreateAtipayTransferDto {
  receiver_id: number;
  amount: number;
  type: 'investment' | 'withdrawal' | 'transfer';
  description?: string;
  reference?: string;
}

export interface AtipayTransfer {
  id: number;
  sender_id: number;
  receiver_id: number;
  amount: number;
  type: string;
  status: 'pending' | 'completed' | 'rejected';
  created_at: string;
  updated_at: string;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();
  
  if (!response.ok) {
    const error: ApiError = new Error(data.message || 'Error en la solicitud');
    error.response = response;
    error.errorData = data;
    throw error;
  }
  
  return data as T;
};

export const createAtipayTransfer = async (transferData: CreateAtipayTransferDto): Promise<ApiResponse<AtipayTransfer>> => {
  try {
    // Para inversiones, usamos el ID 1 como receptor del sistema
    const transferToProcess = {
      ...transferData,
      receiver_id: transferData.type === 'investment' ? 1 : transferData.receiver_id
    };

    console.log('Creando transferencia:', transferToProcess);
    
    const response = await fetch(`${API_BASE_URL}/atipay-transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(transferToProcess),
    });

    const result = await handleResponse<ApiResponse<AtipayTransfer>>(response);
    console.log('Transferencia creada:', result);
    return result;
  } catch (error) {
    console.error('Error creating Atipay transfer:', error);
    throw error;
  }
};
