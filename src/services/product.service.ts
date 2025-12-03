import { API_ROUTES } from '../config/api.routes';
import { getAuthToken } from '../utils/auth';

export interface Product {
  id?: string | number;
  name: string;
  description: string;
  price: number;
  points_to_redeem: number;
  points_earned: number;
  unit_type: string;
  stock: number;
  status?: string;
  type: string;
  image?: File | string | null;
  // Some backend responses include `image_url` (full URL string).
  // Add it as optional so frontend components can safely read it.
  image_url?: string | null;
  duration?: string | null;
  tutor?: string | null;
}

interface PurchaseRequest {
  product_id: string | number;
  quantity: number;
  payment_method: string;
  use_points?: boolean;
}

interface RejectRequestData {
  admin_message: string;
}

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
  };
};


export const ProductService = {

  async getAllProducts(): Promise<Product[]> {
    try {
      const token = getAuthToken();

      if (!token) {
        window.location.href = '/login';
        return [];
      }

      const url = API_ROUTES.PRODUCTS.BASE;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      };

      const response = await fetch(url, {
        headers,
        credentials: 'include',
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return [];
      }

      if (!response.ok) {
        try {
          const errorText = await response.text();
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || `Error al cargar los productos: ${response.status} ${response.statusText}`);
        } catch {
          throw new Error(`Error al cargar los productos: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          throw new Error('No se pudo conectar al servidor. Por favor verifica tu conexión a internet.');
        }
        throw error;
      }
      throw new Error('Error desconocido al cargar los productos');
    }
  },

  async getProductById(id: string | number): Promise<Product> {
    try {
      const response = await fetch(API_ROUTES.PRODUCTS.BY_ID(id), {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch product with ID: ${id}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching product with ID ${id}:`, error);
      throw error;
    }
  },

  async createProduct(productData: Omit<Product, 'id'> | FormData): Promise<Product> {
    try {
      let formData: FormData;
      
      if (productData instanceof FormData) {
        formData = productData;
      } else {
        formData = new FormData();
        Object.entries(productData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formData.append(key, value as string | Blob);
          }
        });
      }

      const response = await fetch(API_ROUTES.PRODUCTS.BASE, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          // Don't set Content-Type when sending FormData, let the browser set it with the correct boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = 'Error al crear el producto';
        
        if (errorData.message) {
          // Translate common error messages to Spanish
          if (errorData.message.includes('The image field must not be greater than 2048 kilobytes')) {
            errorMessage = 'La imagen no debe pesar más de 2MB';
          } else if (errorData.message.includes('The image must be an image')) {
            errorMessage = 'El archivo debe ser una imagen válida';
          } else {
            errorMessage = errorData.message;
          }
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  async updateProduct(id: string | number, productData: Partial<Product> | FormData): Promise<Product> {
    try {
      let formData: FormData;
      
      if (productData instanceof FormData) {
        formData = productData;
      } else {
        formData = new FormData();
        // Append all fields to formData
        Object.entries(productData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value as string | Blob);
          }
        });
      }

      // For Laravel, we need to use POST with _method=PUT for file uploads
      const response = await fetch(`${API_ROUTES.PRODUCTS.BASE}/${id}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          // Let the browser set the content-type with the correct boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = 'Error al actualizar el producto';
        
        if (errorData.message) {
          // Translate common error messages to Spanish
          if (errorData.message.includes('The image field must not be greater than 2048 kilobytes')) {
            errorMessage = 'La imagen no debe pesar más de 2MB';
          } else if (errorData.message.includes('The image must be an image')) {
            errorMessage = 'El archivo debe ser una imagen válida';
          } else {
            errorMessage = errorData.message;
          }
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  async deleteProduct(id: string | number): Promise<{ success: boolean }> {
    try {
      const response = await fetch(API_ROUTES.PRODUCTS.BY_ID(id), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete product with ID: ${id}`);
      }

      return { success: true };
    } catch (error) {
      console.error(`Error deleting product with ID ${id}:`, error);
      throw error;
    }
  },

  async getPurchaseRequests(): Promise<Array<{
    id: string | number;
    product_id: string | number;
    quantity: number;
    status: string;
    created_at: string;
    updated_at: string;
    user: {
      id: string | number;
      name: string;
      email: string;
    };
    product: Product;
  }>> {
    try {
      const response = await fetch(API_ROUTES.PRODUCTS.PURCHASE_REQUESTS, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch purchase requests');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
      throw error;
    }
  },

  async getMyPurchaseRequests(): Promise<Array<{
    id: string | number;
    product_id: string | number;
    quantity: number;
    status: string;
    created_at: string;
    updated_at: string;
    product: Product;
  }>> {
    try {
      const response = await fetch(API_ROUTES.PRODUCTS.MY_PURCHASE_REQUESTS, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch my purchase requests');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching my purchase requests:', error);
      throw error;
    }
  },

  async createPurchaseRequest(data: PurchaseRequest): Promise<{ 
    success: boolean; 
    message: string; 
    data?: {
      id: string | number;
      product_id: string | number;
      quantity: number;
      status: string;
      created_at: string;
      updated_at: string;
    } | null
  }> {
    try {
      console.log('Sending purchase request to:', API_ROUTES.PRODUCTS.PURCHASE);
      console.log('Request data:', data);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.');
      }

      const response = await fetch(API_ROUTES.PRODUCTS.PURCHASE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          product_id: data.product_id,
          quantity: data.quantity,
          payment_method: data.payment_method,
        }),
      });

      const responseData = await response.json().catch(() => ({}));

      if (response.ok) {
        return {
          success: true,
          message: responseData.message || 'Solicitud de compra procesada correctamente',
          data: responseData
        };
      }

      return {
        success: false,
        message: responseData.message || responseData.error || 'Error al procesar la solicitud de compra',
        data: responseData
      };

    } catch (error) {
      console.error('Error creating purchase request:', error);
      if (error instanceof Error) {
        return {
          success: false,
          message: error.message,
          data: null
        };
      }
      return {
        success: false,
        message: 'Error desconocido al procesar la solicitud de compra',
        data: null
      };
    }
  },

  async approvePurchaseRequest(id: string | number): Promise<{
    success: boolean;
    message: string;
    data: {
      id: string | number;
      status: string;
      updated_at: string;
    };
  }> {
    try {
      const response = await fetch(API_ROUTES.PRODUCTS.APPROVE_PURCHASE(id), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to approve purchase request with ID: ${id}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error approving purchase request with ID ${id}:`, error);
      throw error;
    }
  },

  async rejectPurchaseRequest(id: string | number, data: RejectRequestData): Promise<{
    success: boolean;
    message: string;
    data: {
      id: string | number;
      status: string;
      admin_message: string;
      updated_at: string;
    };
  }> {
    try {
      const response = await fetch(API_ROUTES.PRODUCTS.REJECT_PURCHASE(id), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to reject purchase request with ID: ${id}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error rejecting purchase request with ID ${id}:`, error);
      throw error;
    }
  },
};

export default ProductService;
