import { API_ROUTES } from '../config/api.routes';

// ===============================================================
// ===== INTERFACES EXISTENTES (SIN CAMBIOS) =====================
// ===============================================================

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role_id: number;
  status: string;
  atipay_money: number;
  accumulated_points: number;
  reference_code: string;
  referred_by: number | null;
  registration_date: string;
  registration_time: string;
  referral_url: string;
}

export interface Promotion {
  id: number;
  name: string;
  percentaje: number;
  atipay_price_promotion: number;
  duration_months: number;
  status: 'active' | 'inactive';
  duration_days?: number;
  min_amount?: number;
  max_amount?: number;
}

export interface Investment {
  id: number;
  user_id: number;
  promotion_id: number;
  amount: number;
  status: 'pending' | 'active' | 'completed' | 'rejected' | 'cancelled';
  admin_message: string | null;
  daily_earning: number;
  total_earning: number;
  already_earned: number;
  last_earned_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  user: User;
  promotion: Promotion;
  withdrawals: Array<{
    id: number;
    investment_id: number;
    amount: number;
    transferred_at: string;
    created_at: string;
    updated_at: string;
  }>;
}

export interface CreateInvestmentDto {
  promotion_id: number;
  amount: number;
  user_id?: number;
  receipt?: File;
  transfer?: {
    receiver_id: number;
    type: string;
    description: string;
    reference: string;
  };
  transfer_id?: number;
}

// ===============================================================
// ===== INICIO DEL NUEVO CÓDIGO (TAREA 1 - NIVEL 2) =============
// ===============================================================
/**
 * Define la ESTRUCTURA (el TIPO) de datos que esperamos recibir
 * de nuestro nuevo endpoint del backend:
 * /api/investments/admin/active-summary
 *
 * Agregamos 'export' para que ActiveInvestmentsPage.tsx pueda importarlo.
 */
export interface InvestmentSummary {
  id: number;
  usuario_nombre: string;
  usuario_email: string;

  promocion_nombre: string;
  monto_invertido: number;

  retorno_diario_calculado: number;
  retorno_total_estimated: number;
  retorno_total_generado: number;

  fecha_inicio: string;
  dias_transcurridos: number;
  dias_restantes: number;
  dias_totales: number;

  estado: string;

  ultimos_7_dias: {
    date: string;
    gain: number;
  }[];
}

// ===============================================================
// ===== FIN DE LA NUEVA INTERFAZ ================================
// ===============================================================


// ===============================================================
// ===== FUNCIONES EXISTENTES (SIN CAMBIOS) ======================
// ===============================================================

export const getInvestments = async (): Promise<Investment[]> => {
  const response = await fetch(API_ROUTES.INVESTMENTS.BASE, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al obtener las inversiones');
  }

  return response.json();
};

interface InvestmentsResponse {
  investments: Investment[];
  user: User;
  promotions: Array<{
    id: number;
    name: string;
    description: string;
    daily_interest: number;
    duration_days: number;
    min_amount: number;
    max_amount: number;
    created_at: string;
    updated_at: string;
  }>;
}

export const getActiveInvestments = async (): Promise<InvestmentsResponse> => {
  try {

    const response = await fetch(API_ROUTES.INVESTMENTS.BASE, {
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

      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al obtener tus inversiones');
    }

    const responseData: InvestmentsResponse = await response.json();


    if (Array.isArray(responseData)) {
      return {
        investments: responseData.filter((inv: Investment) => inv.status === 'active' || inv.status === 'completed'),
        user: {} as User,
        promotions: []
      };
    }

    if (responseData && 'investments' in responseData) {
      if (!Array.isArray(responseData.investments)) {
        console.error('Invalid investments data format:', responseData);
        return { investments: [], user: responseData.user || {} as User, promotions: [] };
      }

      const filteredInvestments = responseData.investments.filter(
        (inv: Investment) => inv.status === 'active' || inv.status === 'completed'
      );

      console.log('Filtered investments:', filteredInvestments);

      return {
        ...responseData,
        investments: filteredInvestments
      };
    }

    console.error('Unexpected response format:', responseData);
    return { investments: [], user: {} as User, promotions: [] };
  } catch (error) {
    console.error('Error in getActiveInvestments:', error);
    throw error;
  }
};

export const getPendingInvestments = async (): Promise<Investment[]> => {
  const response = await fetch(API_ROUTES.INVESTMENTS.PENDING, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al obtener las inversiones pendientes');
  }

  return response.json();
};

export interface DailyGain {
  date: string;
  amount: number;
  investment_id: number;
  created_at: string;
  updated_at: string;
}

export const getInvestmentDailyGains = async (investmentId: number): Promise<DailyGain[]> => {
  try {
    const url = API_ROUTES.INVESTMENTS.DAILY_GAINS(investmentId);

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = errorData.message || JSON.stringify(errorData);
      } catch (e) {
        console.error('Error al parsear respuesta como JSON:', e);
        errorDetails = await response.text();
      }

      console.warn(`[${response.status}] Failed to get daily gains for investment ${investmentId}:`, {
        status: response.status,
        statusText: response.statusText,
        url,
        errorDetails
      });
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error getting daily gains for investment ${investmentId}:`, error);
    return [];
  }
};

const getAuthHeaders = (): { [key: string]: string } => {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('api_token') ||
    localStorage.getItem('access_token');

  if (!token) {
    console.warn("⚠ No se encontró token en localStorage");
    throw new Error('No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.');
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
  };
};

export const createInvestment = async (data: { promotion_id: number }): Promise<Investment> => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...getAuthHeaders()
  };

  try {
    console.log('Creando inversión con datos:', { promotion_id: data.promotion_id });

    const response = await fetch(API_ROUTES.INVESTMENTS.BASE, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        promotion_id: data.promotion_id
      })
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Error del servidor al crear inversión:', responseData);
      throw new Error(responseData.message || 'Error al crear la inversión');
    }

    console.log('Inversión creada exitosamente:', responseData);
    return responseData;

  } catch (error) {
    console.error('Error en createInvestment:', error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Error desconocido al crear la inversión');
  }
};

export const approveInvestment = async (id: number): Promise<void> => {
  try {
    const response = await fetch(API_ROUTES.INVESTMENTS.APPROVE(id), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
        `Failed to approve investment: ${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    console.error(`Error approving investment ${id}:`, error);
    throw error instanceof Error
      ? error
      : new Error('Unknown error occurred while approving investment');
  }
};

export interface RejectInvestmentData {
  admin_message: string;
}

export const rejectInvestment = async (id: number, reason: string): Promise<void> => {
  try {
    const response = await fetch(API_ROUTES.INVESTMENTS.REJECT(id), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify({ admin_message: reason } as RejectInvestmentData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
        `Failed to reject investment: ${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    console.error(`Error rejecting investment ${id}:`, error);
    throw error instanceof Error
      ? error
      : new Error('Unknown error occurred while rejecting investment');
  }
};

export interface WithdrawEarningsResponse {
  message: string;
  monto: number;
  nuevo_saldo: number;
}

export const withdrawEarnings = async (investmentId: number): Promise<WithdrawEarningsResponse> => {
  try {
    const response = await fetch(`${API_ROUTES.INVESTMENTS.BASE}/${investmentId}/withdraw`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 400) {
        throw new Error('Ya has retirado las ganancias de esta inversión o no hay fondos disponibles.');
      }
      
      throw new Error(
        errorData.message ||
        `No se pudo completar el retiro: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  } catch (error) {
    console.error(`Error retirando ganancias de la inversión ${investmentId}:`, error);
    throw error instanceof Error
      ? error
      : new Error('Ocurrió un error al procesar el retiro');
  }
};

// ===============================================================
// ===== INICIO DEL NUEVO CÓDIGO (TAREA 1 - NIVEL 2) =============
// ===============================================================

/**
 * Obtiene el resumen de inversiones activas (SOLO PARA ADMIN).
 * Llama al endpoint del backend que creamos:
 * /api/investments/admin/active-summary
 *
 * @returns {Promise<InvestmentSummary[]>} Una promesa que resuelve a un array de resúmenes de inversión.
 */
export const getActiveInvestmentsSummaryForAdmin = async (): Promise<InvestmentSummary[]> => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No hay token de autenticación');

  const response = await fetch(API_ROUTES.INVESTMENTS.ACTIVE_SUMMARY_ADMIN, {
  method: 'GET',
  headers: {
    ...getAuthHeaders(),
    'Accept': 'application/json',
  },
});

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al obtener el resumen de inversiones activas');
  }

  return response.json();
};
