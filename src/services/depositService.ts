import { getAuthToken } from '../utils/auth';

// Asegúrate de que esta URL sea la correcta para tu backend
const API_BASE = 'https://api.atipaycompany.com/api'; 

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

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
  };
};

export const DepositService = {

  /**
   * Obtener información de la cuenta bancaria del sistema
   * CORREGIDO: Ahora soporta { bank_info: "..." }
   */
  async getBankInfo(): Promise<{
    success: boolean;
    message: string;
    data?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/system/bank-info`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: responseData.message || 'Error al obtener información bancaria',
          error: responseData.error,
        };
      }

      // ===> AQUÍ ESTÁ LA CORRECCIÓN <===
      // Buscamos el texto exacto para que React no falle
      let bankText = '';

      if (typeof responseData === 'string') {
        bankText = responseData;
      } else if (responseData && typeof responseData === 'object') {
        // Tu backend devuelve { bank_info: "..." }, así que buscamos esa clave
        if (responseData.bank_info) {
          bankText = responseData.bank_info;
        } else if (responseData.value) {
          bankText = responseData.value;
        } else if (responseData.data) {
          bankText = responseData.data;
        } else {
          // Si no encuentra nada conocido, convierte el objeto a texto para no romper la app
          bankText = JSON.stringify(responseData);
        }
      }

      return {
        success: true,
        message: 'Información obtenida exitosamente',
        data: bankText, 
      };
    } catch (error) {
      console.error('Error fetching bank info:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  },

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
      const response = await fetch(`${API_BASE}/products/purchase`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
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
          message: responseData.message || responseData.error || 'Error al crear solicitud',
          error: responseData.error,
        };
      }

      return {
        success: true,
        message: responseData.message || 'Solicitud creada exitosamente',
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
      if (!file.type.startsWith('image/')) {
        return {
          success: false,
          message: 'El archivo debe ser una imagen',
        };
      }

      if (file.size > 5 * 1024 * 1024) {
        return {
          success: false,
          message: 'La imagen no debe pesar más de 5MB',
        };
      }

      const formData = new FormData();
      formData.append('proof', file);

      const response = await fetch(`${API_BASE}/deposits/${depositId}/upload-proof`, {
        method: 'POST',
        headers: {
          // No incluimos Content-Type para que el navegador ponga el boundary correcto
          'Authorization': `Bearer ${getAuthToken()}`,
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
      // Reutilizamos getMyDepositRequests para buscar la solicitud
      const response = await DepositService.getMyDepositRequests();
      
      if (!response.success || !response.data) {
        return {
          success: false,
          message: 'Error al obtener estado',
        };
      }

      const deposit = response.data.find((r: DepositRequest) => r.id === depositId);

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
  async cancelDepositRequest(_depositId: number): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    return {
      success: false,
      message: 'Funcionalidad no disponible aún',
    };
  },
};

export default DepositService;