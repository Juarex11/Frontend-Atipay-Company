import { getAuthToken } from '../utils/auth';

export interface DepositRequest {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  payment_method: 'deposit';
  status: 'pending' | 'approved' | 'rejected' | 'canceled' | 'expired';
  deposit_status: 'pending' | 'approved' | 'rejected' | 'expired';
  deposit_proof_path: string | null;
  deposit_validated_by: number | null;
  deposit_validated_at: string | null;
  deposit_admin_comment: string | null;
  admin_message: string | null;
  request_date: string;
  request_time: string;
  created_at: string;
  updated_at: string;
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    points_earned: number;
    stock: number;
    image_url: string;
  };
  user?: {
    id: number;
    username: string;
    email: string;
    phone_number: string;
  };
}

const API_BASE = 'https://back.mibolsillo.site/api';

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
  };
};

export const DepositService = {
  /**
   * Crear solicitud de compra con método de pago "deposit"
   */
  async createDepositRequest(productId: number, quantity: number): Promise<{
    success: boolean;
    message: string;
    data?: DepositRequest;
    error?: string;
  }> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No autenticado');
      }

      const response = await fetch(`${API_BASE}/products/purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: quantity,
          payment_method: 'deposit',
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: responseData.message || responseData.error || 'Error al crear solicitud de depósito',
          error: responseData.error,
        };
      }

      return {
        success: true,
        message: responseData.message || 'Solicitud de depósito creada exitosamente',
        data: responseData,
      };
    } catch (error) {
      console.error('Error creating deposit request:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  },

  /**
   * Subir comprobante de pago para una solicitud de depósito
   */
  async uploadDepositProof(depositId: number, file: File): Promise<{
    success: boolean;
    message: string;
    data?: DepositRequest;
    error?: string;
  }> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No autenticado');
      }

      // Validar que sea imagen
      if (!file.type.startsWith('image/')) {
        return {
          success: false,
          message: 'El archivo debe ser una imagen',
        };
      }

      // Validar tamaño (máximo 4MB)
      if (file.size > 4 * 1024 * 1024) {
        return {
          success: false,
          message: 'La imagen no debe pesar más de 4MB',
        };
      }

      const formData = new FormData();
      formData.append('proof', file);

      const response = await fetch(`${API_BASE}/deposits/${depositId}/upload-proof`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: responseData.message || responseData.error || 'Error al subir comprobante',
          error: responseData.error,
        };
      }

      return {
        success: true,
        message: responseData.message || 'Comprobante subido exitosamente',
        data: responseData.data || responseData,
      };
    } catch (error) {
      console.error('Error uploading deposit proof:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  },

  /**
   * Obtener todas las solicitudes de depósito del usuario autenticado
   */
  async getMyDepositRequests(): Promise<{
    success: boolean;
    message: string;
    data?: DepositRequest[];
    error?: string;
  }> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No autenticado');
      }

      const response = await fetch(`${API_BASE}/deposits/my-requests`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.message || 'Error al obtener solicitudes',
          error: errorData.error,
        };
      }

      const data = await response.json();

      return {
        success: true,
        message: 'Solicitudes obtenidas exitosamente',
        data: Array.isArray(data) ? data : data.data || [],
      };
    } catch (error) {
      console.error('Error fetching deposit requests:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  },

  /**
   * Obtener estado de una solicitud específica
   */
  async getDepositStatus(depositId: number): Promise<{
    success: boolean;
    message: string;
    data?: DepositRequest;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/deposits/my-requests`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        return {
          success: false,
          message: 'Error al obtener estado',
        };
      }

      const requests = await response.json();
      const deposit = Array.isArray(requests)
        ? requests.find((r: DepositRequest) => r.id === depositId)
        : requests.data?.find((r: DepositRequest) => r.id === depositId);

      if (!deposit) {
        return {
          success: false,
          message: 'Solicitud no encontrada',
        };
      }

      return {
        success: true,
        message: 'Estado obtenido exitosamente',
        data: deposit,
      };
    } catch (error) {
      console.error('Error fetching deposit status:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  },

  /**
   * Cancelar una solicitud de depósito
   */
  async cancelDepositRequest(depositId: number): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No autenticado');
      }

      // Por ahora no hay endpoint de cancelación en el backend
      // Este método puede ser implementado después
      return {
        success: false,
        message: 'Funcionalidad no disponible aún',
      };
    } catch (error) {
      console.error('Error canceling deposit request:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  },
};

export default DepositService;
