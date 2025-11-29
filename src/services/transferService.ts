import { API_ROUTES } from '../config/api.routes';

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  balance?: number;
  created_at: string;
  updated_at: string;
}

export interface Transfer {
  id: number;
  sender_id: number;
  receiver_id: number;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'not_evaluated';
  created_at: string;
  updated_at: string;
  sender?: User;
  receiver?: User;
  admin_message?: string;
}

export interface CreateTransferDto {
  receiver_id: number;
  amount: number;
}

function getAuthHeaders(): { [key: string]: string } {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.');
  }
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
}

export interface ApiTransfer {
  id: number;
  sender: string;
  receiver: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'not_evaluated';
  date: string;
  time: string;
}

export interface ApiTransferResponse {
  id: number;
  sender_id: number;
  sender_username: string;
  receiver_id: number;
  receiver_username: string;
  amount: string;
  status: 'pending' | 'approved' | 'rejected' | 'not_evaluated';
  registration_date: string;
  registration_time: string;
}

export const getSentTransfers = async (): Promise<ApiTransferResponse[]> => {
  try {
    const response = await fetch(API_ROUTES.TRANSFERS.SENT, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('No autorizado - Por favor inicia sesión nuevamente');
      }
      const responseText = await response.text();
      let errorData: Record<string, unknown> = {};
      if (responseText?.trim().startsWith('{')) {
        const parsed = JSON.parse(responseText);
        if (parsed && typeof parsed === 'object') errorData = parsed;
      }
      const message = (errorData as { message?: string }).message || `Error al obtener transferencias enviadas: ${response.status} ${response.statusText}`;
      throw new Error(message);
    }
    const responseData = await response.json();
    // Handle both array and object with data property
    const transfers = Array.isArray(responseData) 
      ? responseData 
      : responseData?.data 
        ? Array.isArray(responseData.data) 
          ? responseData.data 
          : [responseData.data]
        : [];
    
    // Define the raw transfer data interface
    interface RawTransferData {
      id: number;
      sender_id: number;
      sender_username?: string;
      receiver_id: number;
      receiver_username?: string;
      amount?: string;
      status?: 'pending' | 'approved' | 'rejected' | 'not_evaluated';
      registration_date?: string;
      registration_time?: string;
    }

    // Ensure we have valid ApiTransferResponse objects
    return (transfers as RawTransferData[]).map(transfer => ({
      id: transfer.id,
      sender_id: transfer.sender_id,
      sender_username: transfer.sender_username || `Usuario ${transfer.sender_id}`,
      receiver_id: transfer.receiver_id,
      receiver_username: transfer.receiver_username || `Usuario ${transfer.receiver_id}`,
      amount: transfer.amount || '0.00',
      status: transfer.status || 'pending',
      registration_date: transfer.registration_date || '',
      registration_time: transfer.registration_time || '',
    }));
  } catch (error) {
    throw (error instanceof Error ? error : new Error('Fallo desconocido al obtener transferencias enviadas'));
  }
};

interface ReceivedTransferResponse {
  id: number;
  sender: string;
  receiver: string;
  amount: string;
  status: 'pending' | 'approved' | 'rejected' | 'not_evaluated';
  created_at?: string;
  updated_at?: string;
}

export const getReceivedTransfers = async (): Promise<Transfer[]> => {
  try {
    const response = await fetch(API_ROUTES.TRANSFERS.RECEIVED, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('No autorizado - Por favor inicia sesión nuevamente');
      }
      const errorData: unknown = await response.json().catch(() => ({}));
      const message = (errorData as { message?: string }).message || 'Error al obtener transferencias recibidas';
      throw new Error(message);
    }
    
    const responseData: { message: string; data: ReceivedTransferResponse[] } = await response.json();
    
    // Transform the response to match the Transfer type
    return responseData.data.map(transfer => ({
      id: transfer.id,
      sender_id: 0, // Not provided in the response
      receiver_id: 0, // Not provided in the response
      amount: parseFloat(transfer.amount) || 0,
      status: transfer.status || 'pending',
      created_at: transfer.created_at || new Date().toISOString(),
      updated_at: transfer.updated_at || new Date().toISOString(),
      // Include additional fields that might be needed
      sender: {
        id: 0,
        name: transfer.sender,
        username: transfer.sender,
        email: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      receiver: {
        id: 0,
        name: transfer.receiver,
        username: transfer.receiver,
        email: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }));
  } catch (error) {
    throw (error instanceof Error ? error : new Error('Fallo desconocido al obtener transferencias recibidas'));
  }
};

export const getTransferDetails = async (transferId: number): Promise<Transfer> => {
  try {
    const response = await fetch(API_ROUTES.TRANSFERS.DETAILS(transferId), {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('No autorizado - Por favor inicia sesión nuevamente');
      }
      const errorData: unknown = await response.json().catch(() => ({}));
      const message = (errorData as { message?: string }).message || 'Error al obtener detalles de la transferencia';
      throw new Error(message);
    }
    return await response.json();
  } catch (error) {
    throw (error instanceof Error ? error : new Error('Fallo desconocido al obtener detalles de la transferencia'));
  }
};

export const createTransfer = async (transferData: CreateTransferDto): Promise<Transfer> => {
  try {
    const response = await fetch(API_ROUTES.TRANSFERS.BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify(transferData),
    });
    if (!response.ok) {
      const errorData: unknown = await response.json().catch(() => ({}));
      const message = (errorData as { message?: string }).message || 'Error al crear la transferencia';
      throw new Error(message);
    }
    return await response.json();
  } catch (error) {
    throw (error instanceof Error ? error : new Error('Fallo desconocido al crear transferencia'));
  }
};

export const approveTransfer = async (transferId: number): Promise<Transfer> => {
  try {
    const response = await fetch(API_ROUTES.TRANSFERS.APPROVE(transferId), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) {
      const errorData: unknown = await response.json().catch(() => ({}));
      const message = (errorData as { message?: string }).message || 'Error al aprobar la transferencia';
      throw new Error(message);
    }
    return await response.json();
  } catch (error) {
    throw (error instanceof Error ? error : new Error('Fallo desconocido al aprobar transferencia'));
  }
};

export const rejectTransfer = async (transferId: number): Promise<Transfer> => {
  try {
    const response = await fetch(API_ROUTES.TRANSFERS.REJECT(transferId), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) {
      const errorData: unknown = await response.json().catch(() => ({}));
      const message = (errorData as { message?: string }).message || 'Error al rechazar la transferencia';
      throw new Error(message);
    }
    return await response.json();
  } catch (error) {
    throw (error instanceof Error ? error : new Error('Fallo desconocido al rechazar transferencia'));
  }
};

