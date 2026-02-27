import { API_BASE_URL } from "../config";
import { getAuthHeaders } from "../utils/auth";

interface ApiError extends Error {
  response?: Response;
  errorData?: unknown;
}


// Tipos de métodos de pdo soportados
export type PaymentMethod =
  | "yape"
  | "plin"
  | "transferencia_bancaria"
  | "transferencia_electronica";

// Tipos nuevos alineados al backend actualizado
export interface CreateRechargeDto {
  full_names: string;
  amount: number;
  user_payment_method_id: string;
  proof_image: File;
}

export interface RawRecharge {
  id: number;
  user_id: number;
  full_names: string;
  amount: number;
  user_payment_method_id: string;
  status: "pending" | "approved" | "rejected";
  admin_message?: string | null;
  proof_image_url: string;
  request_date: string; // YYYY-MM-DD
  request_time: string; // HH:MM:SS
  processed_date?: string | null;
  processed_time?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Recharge {
  id: number;
  user_id: number;
  full_names: string;
  amount: number;
  user_payment_method_id: string;
  status: "pending" | "approved" | "rejected";
  admin_message?: string | null;
  proof_image_url: string;
  request_at: string; // ISO combinada
  processed_at?: string | null; // ISO combinada
  created_at?: string;
  updated_at?: string | null;
}

export interface CreateRechargeResponseWrapper {
  message?: string;
  data?: RawRecharge;
  [k: string]: unknown;
}

const combineDateTime = (d?: string, t?: string | null): string | undefined => {
  if (!d || !t) return undefined;
  // Backend usa formato con AM/PM, intentamos parse simple
  try {
    const iso = new Date(`${d} ${t}`);
    if (!isNaN(iso.getTime())) return iso.toISOString();
  } catch (error) {
    console.error('Error al combinar fecha y hora:', error);
  }
  return undefined;
};

export const normalizeRecharge = (raw: RawRecharge): Recharge => {
  return {
    id: raw.id,
    user_id: raw.user_id,
    full_names: raw.full_names,
    amount: raw.amount,
    user_payment_method_id: raw.user_payment_method_id,
    status: raw.status,
    admin_message: raw.admin_message ?? null,
    proof_image_url: raw.proof_image_url,
    request_at: combineDateTime(raw.request_date, raw.request_time) || raw.created_at || new Date().toISOString(),
    processed_at: combineDateTime(raw.processed_date || undefined, raw.processed_time || undefined) || raw.updated_at,
    created_at: raw.created_at,
    updated_at: raw.updated_at
  };
};

const handleResponse = async <T = unknown>(response: Response): Promise<T> => {
  console.log("Respuesta recibida:", {
    status: response.status,
    statusText: response.statusText,
    url: response.url,
    headers: Object.fromEntries(response.headers.entries()),
  });

  const responseText = await response.text();
  let responseData: unknown;
  
  try {
    responseData = responseText ? JSON.parse(responseText) : {};
  } catch (e) {
    console.error("Error parsing response:", e);
    responseData = {};
  }

  // If the response is not OK, handle the error
  if (!response.ok) {
    console.error("Error response:", {
      status: response.status,
      statusText: response.statusText,
      data: responseData,
    });

    let errorMessage = `Error en la solicitud: ${response.status} ${response.statusText}`;
    
    // Handle validation errors
    if (response.status === 422 && responseData && typeof responseData === 'object' && 'errors' in responseData) {
      const errors = (responseData as { errors?: Record<string, string | string[]> }).errors;
      if (errors) {
        const errorMessages = Object.entries(errors)
          .map(([field, errorMsgs]) => {
            const fieldName = field.replace(/_/g, ' ');
            const errorList = Array.isArray(errorMsgs) ? errorMsgs.join(', ') : String(errorMsgs);
            return `- ${fieldName}: ${errorList}`;
          })
          .join('\n');
        
        errorMessage = `Error de validación:\n${errorMessages}`;
      }
    } else if (responseData && typeof responseData === 'object' && 'message' in responseData && responseData.message) {
      errorMessage = String(responseData.message);
    }

    const error: ApiError = new Error(errorMessage);
    error.response = response;
    error.errorData = responseData;
    console.error("Error en handleResponse:", error);
    throw error;
  }

  // If we have a successful response, return the parsed data
  if (responseData && typeof responseData === 'object') {
    // Handle array responses
    if (Array.isArray(responseData)) {
      return responseData as T;
    }
    
    // Handle object responses with data property
    if ('data' in responseData) {
      return (responseData as { data: T }).data;
    }
    
    // Handle direct object responses
    return responseData as T;
  }
  
  // Handle primitive responses
  return responseData as T;
};

interface CreateRechargeResponse {
  message: string;
  data: {
    estado: string;
    full_names: string;
    amount: number;
    user_payment_method_id: string;
    user_id: number;
    request_date: string;
    request_time: string;
    id: number;
    proof_image_url: string;
  };
}

export const createRecharge = async (data: CreateRechargeDto): Promise<CreateRechargeResponse['data']> => {
  const formData = new FormData();
  
  // Append text fields
  formData.append('full_names', data.full_names);
  formData.append('amount', data.amount.toString());
  formData.append('user_payment_method_id', data.user_payment_method_id);
  
  // Append file if it exists
  if (data.proof_image) {
    formData.append('proof_image', data.proof_image, data.proof_image.name);
  }

  console.log('Sending FormData...');

  // Get the authorization header
  const authHeaders = getAuthHeaders();
  const headers = new Headers();
  
  // 1. Agregar el Token de Autorización
  const authToken = authHeaders && 'Authorization' in authHeaders 
    ? authHeaders['Authorization'] 
    : null;
    
  if (authToken) {
    headers.append('Authorization', authToken);
  }

  // 2. ¡ESTO ERA LO QUE FALTABA!
  // Le decimos a Laravel: "Por favor, respóndeme siempre en JSON, no me redirijas"
  headers.append('Accept', 'application/json');

  try {
    const response = await fetch(`${API_BASE_URL}/atipay-recharges`, {
      method: 'POST',
      headers, // Ahora incluye Authorization y Accept
      body: formData,
    });

    // ... El resto de tu código de manejo de respuesta se queda igual ...
    console.log('Response status:', response.status);
    
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      // Si falla aquí es porque Laravel devolvió HTML (error 500 o página de login)
      console.error('Failed to parse JSON:', parseError);
      throw new Error('El servidor no respondió con un formato válido. Posible error interno.');
    }
    
    if (!response.ok) {
      if (response.status === 422) {
        // Manejo de errores de validación de Laravel
        const errorMessage = responseData.errors 
          ? Object.values(responseData.errors).flat().join('\n')
          : responseData.message || 'Error de validación.';
        throw new Error(errorMessage);
      }
      throw new Error(responseData.message || `Error del servidor: ${response.status}`);
    }
    
    return responseData.data;

  } catch (error) {
    console.error('Error creating recharge:', error);
    throw error;
  }
};
export interface AdminRecharge extends Recharge {
  user: {
    id: number;
    username: string;
    email: string;
    phone_number: string;
    status: string;
    reference_code: string;
  };
  approver: {
    id: number;
    username: string;
    email: string;
  } | null;
  atipays_granted: number;
  approved_by?: number | null;
}

export const getRecharges = async (): Promise<AdminRecharge[]> => {
  const response = await fetch(`${API_BASE_URL}/atipay-recharges`, {
    headers: {
      ...getAuthHeaders(),
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al obtener las solicitudes de recarga');
  }

  const data: Array<{
    id: number;
    user_id: number;
    full_names: string;
    amount: number;
    user_payment_method_id: number | string;
    status: "pending" | "approved" | "rejected";
    admin_message?: string | null;
    proof_image_url: string;
    request_date?: string;
    request_time?: string;
    processed_date?: string | null;
    processed_time?: string | null;
    user?: {
      id: number;
      username: string;
      email: string;
      phone_number?: string;
      status?: string;
      reference_code?: string;
    };
    approver?: {
      id: number;
      username: string;
      email: string;
    } | null;
    atipays_granted?: number;
    approved_by?: number | null;
  }> = await response.json();

  return data.map((recharge) => ({
    id: recharge.id,
    user_id: recharge.user_id,
    full_names: recharge.full_names,
    amount: recharge.amount,
    user_payment_method_id: recharge.user_payment_method_id.toString(),
    status: recharge.status,
    admin_message: recharge.admin_message || undefined,
    proof_image_url: recharge.proof_image_url,
    request_at: recharge.request_date ? `${recharge.request_date}T${recharge.request_time || '00:00:00'}` : new Date().toISOString(),
    processed_at: recharge.processed_date ? `${recharge.processed_date}T${recharge.processed_time || '00:00:00'}` : undefined,
    created_at: recharge.request_date,
    updated_at: recharge.processed_date,
    user: {
      id: recharge.user?.id || 0,
      username: recharge.user?.username || '',
      email: recharge.user?.email || '',
      phone_number: recharge.user?.phone_number || '',
      status: recharge.user?.status || '',
      reference_code: recharge.user?.reference_code || ''
    },
    approver: recharge.approver ? {
      id: recharge.approver.id,
      username: recharge.approver.username,
      email: recharge.approver.email
    } : null,
    atipays_granted: recharge.atipays_granted || 0,
    approved_by: recharge.approved_by
  }));
};



export const getMyRecharges = async (): Promise<Recharge[]> => {
  const response = await fetch(`${API_BASE_URL}/atipay-recharges/my`, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al obtener las solicitudes de recarga');
  }

  const data: RawRecharge[] = await response.json();
  return data.map(recharge => ({
    id: recharge.id,
    user_id: recharge.user_id,
    full_names: recharge.full_names,
    amount: recharge.amount,
    user_payment_method_id: recharge.user_payment_method_id.toString(),
    status: recharge.status,
    admin_message: recharge.admin_message || undefined,
    proof_image_url: recharge.proof_image_url,
    request_at: recharge.request_date ? `${recharge.request_date}T${recharge.request_time || '00:00:00'}` : new Date().toISOString(),
    processed_at: recharge.processed_date ? `${recharge.processed_date}T${recharge.processed_time || '00:00:00'}` : undefined,
    created_at: recharge.request_date,
    updated_at: recharge.processed_date
  }));
};

export interface RechargeDetail extends AdminRecharge {
  user: {
    id: number;
    username: string;
    email: string;
    phone_number: string;
    role_id: number;
    status: string;
    atipay_money: number;
    accumulated_points: number;
    reference_code: string;
    referred_by: number | null;
    registration_date: string;
    registration_time: string;
    referral_url: string;
  };
  payment_method?: {
    id: number;
    type: string;
    details: string;
    is_default: boolean;
  };
}

export const getRechargeById = async (id: number): Promise<RechargeDetail> => {
  const response = await fetch(`${API_BASE_URL}/atipay-recharges/${id}`, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al obtener los detalles de la recarga');
  }

  const data = await response.json();
  
  return {
    id: data.id,
    user_id: data.user_id,
    full_names: data.full_names,
    amount: data.amount,
    user_payment_method_id: data.user_payment_method_id.toString(),
    status: data.status,
    admin_message: data.admin_message || undefined,
    proof_image_url: data.proof_image_url,
    request_at: data.request_date ? `${data.request_date}T${data.request_time || '00:00:00'}` : new Date().toISOString(),
    processed_at: data.processed_date ? `${data.processed_date}T${data.processed_time || '00:00:00'}` : undefined,
    created_at: data.request_date,
    updated_at: data.processed_date,
    user: {
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      phone_number: data.user.phone_number || '',
      role_id: data.user.role_id,
      status: data.user.status,
      atipay_money: data.user.atipay_money || 0,
      accumulated_points: data.user.accumulated_points || 0,
      reference_code: data.user.reference_code || '',
      referred_by: data.user.referred_by || null,
      registration_date: data.user.registration_date,
      registration_time: data.user.registration_time,
      referral_url: data.user.referral_url || ''
    },
    approver: data.approver ? {
      id: data.approver.id,
      username: data.approver.username,
      email: data.approver.email
    } : null,
    atipays_granted: data.atipays_granted || 0,
    approved_by: data.approved_by || null
  };
}

export interface ApproveRechargeResponse {
  message: string;
  data: RechargeDetail;
}

export const approveRecharge = async (id: number): Promise<ApproveRechargeResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/atipay-recharges/${id}/approve`,
    {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al aprobar la recarga');
  }

  return response.json();
};

export const rejectRecharge = async (
  id: number,
  reason: string
): Promise<Recharge> => {
  const token = localStorage.getItem("token");
  const response = await fetch(
    `${API_BASE_URL}/atipay-recharges/${id}/reject`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ admin_message: reason }),
    }
  );
  return handleResponse(response) as Promise<Recharge>;
};
