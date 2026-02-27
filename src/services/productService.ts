import { API_ROUTES } from '@/config/api.routes';
import { getAuthHeaders } from '@/lib/auth';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  points_to_redeem: number;
  points_earned: number;
  unit_type: string;
  stock: number;
  status: 'active' | 'inactive';
  type: 'product' | 'service' | 'digital';
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseRequest {
  id: string;
  product_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'canceled' | 'expired';
  // payment_method can now include 'deposit' from backend
  payment_method: 'atipay' | 'points' | 'mixed' | 'deposit';
  amount: number;
  points_used: number;
  created_at: string;
  // FIX: Para soportar compras manuales, `product` puede ser opcional
  product?: Product;
  // FIX: Descripción opcional usada por compras manuales
  description?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  admin_message?: string;
  // Deposit-specific optional fields (may not exist for all purchases)
  deposit_proof_path?: string | null;
  deposit_status?: 'pending' | 'approved' | 'rejected' | 'expired';
  deposit_validated_by?: number | null;
  deposit_validated_at?: string | null;
  deposit_admin_comment?: string | null;
}

const getAuthHeadersWithContentType = (contentType: string = 'application/json'): Record<string, string> => {
  try {
    const headers = getAuthHeaders(contentType);
    return {
      ...headers,
      'Accept': 'application/json',
    };
  } catch (error) {
    console.warn('No se pudo obtener el token de autenticación:', error);
    // Devolver headers básicos sin autenticación
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };

    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    return headers;
  }
};

export const productService = {
  // Get all products
  async getProducts(): Promise<Product[]> {
    try {
      const response = await fetch(API_ROUTES.PRODUCTS.BASE, {
        headers: getAuthHeadersWithContentType(),
      });

      if (!response.ok) {
        // Si el error es 401 (No autorizado), redirigir al login
        if (response.status === 401) {
          // Importar la función de redirección
          const { redirectToLogin } = await import('@/lib/auth');
          redirectToLogin();
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }

        // Para otros errores, intentar obtener el mensaje de error del servidor
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error https! Estado: ${response.status}`);
        } catch {
          // Ignoramos el error de parsing y lanzamos un mensaje genérico
          throw new Error(`Error al cargar los productos (${response.status} ${response.statusText})`);
        }
      }

      return response.json();
    } catch (error: unknown) {
      console.error('Error al obtener productos:', error);

      // Si el error es de autenticación, ya se manejó la redirección
      if (error instanceof Error && error.message.includes('No authentication token found') ||
        error instanceof Error && error.message.includes('Token expired')) {
        throw error;
      }

      // Para otros errores, lanzar un mensaje genérico
      throw new Error('No se pudieron cargar los productos. Por favor, inténtalo de nuevo más tarde.');
    }
  },

  // Get product by ID
  async getProductById(id: string): Promise<Product> {
    const response = await fetch(API_ROUTES.PRODUCTS.BY_ID(id), {
      headers: getAuthHeadersWithContentType(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }

    return response.json();
  },

  // Helper function to validate authentication
  async validateAuth(): Promise<string> {
    const token = localStorage.getItem('token');
    if (!token) {
      const { redirectToLogin } = await import('@/lib/auth');
      redirectToLogin();
      throw new Error('No estás autenticado. Por favor, inicia sesión.');
    }
    return token;
  },

  // Helper function to log form data
  logFormData(data: FormData): void {
    const formDataObj: Record<string, string | File | Blob> = {};
    data.forEach((value, key) => {
      formDataObj[key] = value;
    });
    console.log('Datos del formulario a enviar:', formDataObj);
  },

  // Helper function to handle API errors
  async handleApiError(response: Response): Promise<never> {
    if (response.status === 401) {
      const { redirectToLogin } = await import('@/lib/auth');
      redirectToLogin();
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    if (response.status === 403) {
      throw new Error('No tienes permiso para realizar esta acción.');
    }

    let errorMessage = `Error en la solicitud (${response.status} ${response.statusText})`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
        if (errorData.errors) {
          errorMessage += ' ' + Object.values(errorData.errors).flat().join(' ');
        }
      }
    } catch (parseError) {
      console.error('Error parsing error response:', parseError);
    }
    throw new Error(errorMessage);
  },

  // Create a new product (admin only)
  async createProduct(data: FormData): Promise<Product> {
    try {
      const token = await this.validateAuth();
      this.logFormData(data);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(API_ROUTES.PRODUCTS.BASE, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          credentials: 'include',
          mode: 'cors',
          redirect: 'error',
          signal: controller.signal,
          body: data,
        });

        clearTimeout(timeoutId);

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.redirected) {
          console.warn('Request was redirected to:', response.url);
          throw new Error('Redirección inesperada durante la solicitud');
        }

        if (!response.ok) {
          return this.handleApiError(response);
        }

        return response.json();
      } catch (error: unknown) {
        clearTimeout(timeoutId);
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new Error('La solicitud tardó demasiado tiempo. Por favor, verifica tu conexión e intenta de nuevo.');
          }
          throw error;
        }
        throw new Error('Ocurrió un error desconocido al intentar crear el producto');
      }
    } catch (error) {
      console.error('Error al crear el producto:', error);
      throw error instanceof Error
        ? error
        : new Error('Ocurrió un error inesperado al crear el producto');
    }
  },

  async updateProduct(id: string, data: FormData): Promise<Product> {
    
    // 1. EL TRUCO DE LARAVEL: Asegurar que _method = PUT esté presente
    if (!data.has('_method')) {
      data.append('_method', 'PUT');
    }

    // 2. Validar token usando tu helper existente
    const token = await this.validateAuth();

    // 3. Enviar como POST (para que pasen los archivos)
    const response = await fetch(API_ROUTES.PRODUCTS.BY_ID(id), {
      method: 'POST', // <--- IMPORTANTE: POST
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: data,
    });

    // 4. Manejo de errores consistente
    if (!response.ok) {
      return this.handleApiError(response);
    }

    return response.json();
  },

  async deleteProduct(id: string): Promise<void> {
    const response = await fetch(API_ROUTES.PRODUCTS.BY_ID(id), {
      method: 'DELETE',
      headers: getAuthHeadersWithContentType(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete product');
    }
  },

  async purchaseProduct(
    productId: string,
    paymentMethod: 'atipay' | 'points' | 'mixed' | 'deposit',
    quantity: number = 1
  ): Promise<{ message: string }> {
    const response = await fetch(API_ROUTES.PRODUCTS.PURCHASE, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        quantity: quantity,
        payment_method: paymentMethod,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to process purchase');
    }

    return response.json();
  },

  async getMyPurchaseRequests(): Promise<PurchaseRequest[]> {
    const response = await fetch(API_ROUTES.PRODUCTS.MY_PURCHASE_REQUESTS, {
      headers: getAuthHeadersWithContentType(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch purchase requests');
    }

    return response.json();
  },

  async getAllPurchaseRequests(): Promise<PurchaseRequest[]> {
    const response = await fetch(API_ROUTES.PRODUCTS.PURCHASE_REQUESTS, {
      headers: getAuthHeadersWithContentType(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch all purchase requests');
    }

    return response.json();
  },

  async approvePurchaseRequest(id: string): Promise<{ message: string }> {
    const response = await fetch(API_ROUTES.PRODUCTS.APPROVE_PURCHASE(id), {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to approve purchase request');
    }

    return response.json();
  },

  async rejectPurchaseRequest(id: string, adminMessage: string): Promise<{ message: string }> {
    const response = await fetch(API_ROUTES.PRODUCTS.REJECT_PURCHASE(id), {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ admin_message: adminMessage }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to reject purchase request');
    }

    return response.json();
  },

  async getMyPurchaseHistory(): Promise<PurchaseRequest[]> {
    const response = await fetch(API_ROUTES.PRODUCTS.MY_PURCHASE_REQUESTS, {
      headers: getAuthHeadersWithContentType(),
    });

    if (!response.ok) {
      throw new Error('No se pudo cargar el historial de compras');
    }

    return response.json();
  },
};
