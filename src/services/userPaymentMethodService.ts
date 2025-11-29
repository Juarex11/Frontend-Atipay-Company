import { API_BASE_URL } from "../config";
import { getAuthHeaders } from "../utils/auth";

export interface UserPaymentMethod {
  id: number;
  user_id: number;
  payment_method_id: number;
  data: Record<string, string>;
  method: {
    id: number;
    name: string;
    fields: string[];
  };
}

export interface CreateUserPaymentMethodDto {
  payment_method_id: number;
  data: Record<string, string>;
}

export interface UpdateUserPaymentMethodDto extends Omit<CreateUserPaymentMethodDto, 'payment_method_id'> {
  id: number;
  payment_method_id: number;
}

export const createUserPaymentMethod = async (data: CreateUserPaymentMethodDto): Promise<UserPaymentMethod> => {
  console.log('Creating user payment method with API URL:', API_BASE_URL);
  console.log('Request data:', data);

  const response = await fetch(`${API_BASE_URL}/user/payment-methods`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });

  console.log('API response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('API error response:', errorData);
    throw new Error(errorData.message || 'Error al crear el método de pago del usuario');
  }

  const responseData = await response.json();
  console.log('API success response:', responseData);
  return responseData.data;
};

export const updateUserPaymentMethod = async (id: number, data: Omit<UpdateUserPaymentMethodDto, 'id'>): Promise<UserPaymentMethod> => {
  const response = await fetch(`${API_BASE_URL}/user/payment-methods/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      payment_method_id: data.payment_method_id,
      data: data.data
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al actualizar el método de pago');
  }

  const responseData = await response.json();
  return responseData.data;
};

export const deleteUserPaymentMethod = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/user/payment-methods/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al eliminar el método de pago del usuario');
  }
};

export const getUserPaymentMethods = async (): Promise<UserPaymentMethod[]> => {
  const response = await fetch(`${API_BASE_URL}/user/payment-methods`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al obtener los métodos de pago del usuario');
  }

  const responseData = await response.json();

  // The API returns the data directly as an array
  if (Array.isArray(responseData)) {
    return responseData;
  }

  return [];
};
