import { API_ROUTES } from '../config/api.routes';

// Types
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected';

export interface Withdrawal {
  id: number;
  user_id: number;
  method: 'yape' | 'plin' | 'bcp' | 'interbank' | 'bbva' | 'other';
  holder: string;
  phone_number: string | null;
  account_number: string | null;
  amount: number;
  commission: number;
  net_amount: number;
  status: WithdrawalStatus;
  date: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateWithdrawalData {
  method: 'yape' | 'plin' | 'bcp' | 'interbank' | 'bbva' | 'other' | 'transferencia_electronica';
  holder: string;
  phone_number?: string;
  account_number?: string;
  amount: number;
}

export interface UpdateWithdrawalStatusData {
  status: 'approved' | 'rejected';
  rejection_reason?: string;
}

// Service methods
export const withdrawalService = {
  // Create a new withdrawal request
  async createWithdrawal(data: CreateWithdrawalData): Promise<Withdrawal> {
    console.log('Sending withdrawal data:', JSON.stringify(data, null, 2));
    const response = await fetch(API_ROUTES.WITHDRAWALS.BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorData: { message?: string; errors?: Record<string, string[]> } = {};
      try {
        errorData = await response.json();
      } catch (e) {
        console.error('Failed to parse error response:', e);
      }

      console.error('Withdrawal error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        requestData: data
      });

      // Include validation errors in the error message
      let errorMessage = errorData.message || 'Error al crear la solicitud de retiro';
      if (errorData.errors) {
        errorMessage += '\n' + Object.entries(errorData.errors)
          .map(([field, messages]) => `- ${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('\n');
      }

      throw new Error(errorMessage);
    }

    return response.json();
  },

  // Get all withdrawals (admin only)
  async getAllWithdrawals(): Promise<Withdrawal[]> {
    const response = await fetch(API_ROUTES.WITHDRAWALS.BASE, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener las solicitudes de retiro');
    }

    return response.json();
  },

  // Helper function to handle token refresh
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(API_ROUTES.AUTH.REFRESH_TOKEN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refreshToken', data.refresh_token);
      }
      return data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Clear tokens and redirect to login on refresh failure
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }
  },

  // Get current user's withdrawals
  async getMyWithdrawals(): Promise<Withdrawal[]> {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/withdrawals/my', {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 'Error al obtener los retiros del usuario',
        );
      }

      const responseData = await response.json();
      // Ensure we return an array of withdrawals
      return Array.isArray(responseData) ? responseData : [];
    } catch (error) {
      console.error('Error in getMyWithdrawals:', error);
      if (error instanceof Error && error.message.includes('token')) {
        window.location.href = '/login';
      }
      throw error;
    }
  },

  // Get withdrawal by ID
  async getWithdrawalById(id: string): Promise<Withdrawal> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.');
    }

    try {
      const response = await fetch(API_ROUTES.WITHDRAWALS.BY_ID(id), {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al obtener el retiro');
      }

      return response.json();
    } catch (error) {
      console.error('Error in getWithdrawalById:', error);
      if (error instanceof Error &&
        (error.message.includes('No se encontró el token') ||
          error.message.includes('sesión ha expirado'))) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      throw error;
    }
  },

  // Update withdrawal status (admin only)
  async updateWithdrawalStatus(id: string, data: UpdateWithdrawalStatusData): Promise<Withdrawal> {
    const endpoint = data.status === 'approved'
      ? API_ROUTES.WITHDRAWALS.APPROVE(id)
      : API_ROUTES.WITHDRAWALS.REJECT(id);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al actualizar el estado del retiro');
    }

    return response.json();
  },
};
