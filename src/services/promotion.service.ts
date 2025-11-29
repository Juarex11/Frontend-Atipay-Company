import { API_ROUTES } from '@/config/api.routes';
import { getAuthHeaders, redirectToLogin } from '@/lib/auth';

export const TOKEN_EXPIRED_MESSAGE = 'Sesión expirada. Por favor, inicia sesión nuevamente.';

export interface Promotion {
  id: string;
  name: string;
  percentaje: number;
  atipay_price_promotion: number;
  points_earned: number;
  duration_months: number;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

const handleUnauthorized = () => {
  redirectToLogin();
  return Promise.reject(new Error(TOKEN_EXPIRED_MESSAGE));
};

export const getPromotions = async (): Promise<Promotion[]> => {
  try {
    const headers = getAuthHeaders();
    if (headers instanceof Error) {
      return handleUnauthorized();
    }

    const response = await fetch(API_ROUTES.PROMOTIONS.BASE, { headers });

    if (response.status === 401) {
      return handleUnauthorized();
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || 'Error al obtener las promociones';
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in getPromotions:', error);
    
    if (error instanceof Error) {
      if (error.message === TOKEN_EXPIRED_MESSAGE) {
        return handleUnauthorized();
      }
      throw error;
    }
    
    throw new Error('Error de conexión. Por favor, verifica tu conexión a internet.');
  }
};

export const getPromotionById = async (id: string): Promise<Promotion> => {
  try {
    const headers = getAuthHeaders();
    const response = await fetch(API_ROUTES.PROMOTIONS.BY_ID(id), { headers });

    if (response.status === 401) {
      return handleUnauthorized();
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al obtener la promoción');
    }

    return response.json();
  } catch (error) {
    console.error('Error in getPromotionById:', error);
    throw error;
  }
};

export const createPromotion = async (promotionData: Omit<Promotion, 'id' | 'created_at' | 'updated_at'>): Promise<Promotion> => {
  try {
    const headers = getAuthHeaders();
    const response = await fetch(API_ROUTES.PROMOTIONS.BASE, {
      method: 'POST',
      headers,
      body: JSON.stringify(promotionData),
    });

    if (response.status === 401) {
      return handleUnauthorized();
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al crear la promoción');
    }

    return response.json();
  } catch (error) {
    console.error('Error in createPromotion:', error);
    throw error;
  }
};

export const updatePromotion = async (id: string, promotionData: Partial<Promotion>): Promise<Promotion> => {
  try {
    const headers = getAuthHeaders();
    const response = await fetch(API_ROUTES.PROMOTIONS.BY_ID(id), {
      method: 'PUT',
      headers,
      body: JSON.stringify(promotionData),
    });

    if (response.status === 401) {
      return handleUnauthorized();
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al actualizar la promoción');
    }

    return response.json();
  } catch (error) {
    console.error('Error in updatePromotion:', error);
    throw error;
  }
};

export const deletePromotion = async (id: string): Promise<void> => {
  try {
    const headers = getAuthHeaders(null); // No content-type for DELETE
    const response = await fetch(API_ROUTES.PROMOTIONS.BY_ID(id), {
      method: 'DELETE',
      headers,
    });

    if (response.status === 401) {
      return handleUnauthorized();
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al eliminar la promoción');
    }
  } catch (error) {
    console.error('Error in deletePromotion:', error);
    throw error;
  }
};
