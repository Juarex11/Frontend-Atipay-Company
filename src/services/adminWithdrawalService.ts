const API_BASE_URL = 'https://api.atipaycompany.com/api';

export interface AdminWithdrawal {
  id: string;
  user_id: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  amount: number;
  method: 'yape' | 'plin' | 'bcp' | 'interbank' | 'bbva' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  reference_code?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export const adminWithdrawalService = {
  // Get all withdrawals
  async getAllWithdrawals(): Promise<AdminWithdrawal[]> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/withdrawals`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(e => {
        console.error('Error parsing JSON response:', e);
        return null;
      });

      if (!response.ok) {
        console.error('Error response from server:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        throw new Error(data?.message || 'Error al obtener las solicitudes de retiro');
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error in getAllWithdrawals:', error);
      throw error;
    }
  },

  // Get withdrawal by ID
  async getWithdrawalById(id: string): Promise<AdminWithdrawal> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/withdrawals/${id}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al obtener los detalles del retiro');
    }

    return response.json();
  },

  // Update withdrawal status
  async updateWithdrawalStatus(
    id: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string
  ): Promise<AdminWithdrawal> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/withdrawals/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        status,
        ...(rejectionReason && { rejection_reason: rejectionReason }),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al actualizar el estado del retiro');
    }

    return response.json();
  },
};
