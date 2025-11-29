const API_URL = 'http://127.0.0.1:8000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export interface PaymentMethod {
  id?: number;
  name: string;
  fields: string[];
}

export interface UserPaymentMethod {
  id: number;
  user_id: number;
  payment_method_id: number;
  data: Record<string, string>;
  method: PaymentMethod;
}

// Admin methods
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const headers = getAuthHeaders();

  try {
    const response = await fetch(`${API_URL}/payment-methods`, {
      headers: headers,
      credentials: 'include' // Include cookies if using session-based auth
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al obtener los métodos de pago (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // Check if data is an array or if we need to access a data property
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.data)) {
      return data.data;
    }

    return [];
  } catch (error) {
    console.error('Error in getPaymentMethods:', error);
    throw error; // Re-throw to be handled by the component
  }
};

export const createPaymentMethod = async (method: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod> => {
  const response = await fetch(`${API_URL}/payment-methods`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(method)
  });
  if (!response.ok) throw new Error('Error al crear el método de pago');
  const data = await response.json();
  return data.data;
};

export const updatePaymentMethod = async (id: number, method: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod> => {
  const response = await fetch(`${API_URL}/payment-methods/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(method)
  });
  if (!response.ok) throw new Error('Error al actualizar el método de pago');
  const data = await response.json();
  return data.data;
};

export const deletePaymentMethod = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/payment-methods/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Error al eliminar el método de pago');
};

// User payment methods
export const getUserPaymentMethods = async (): Promise<UserPaymentMethod[]> => {
  const response = await fetch(`${API_URL}/user/payment-methods`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Error al obtener los métodos de pago del usuario');
  const data = await response.json();
  return data.data || [];
};

export const createUserPaymentMethod = async (paymentMethodId: number, data: Record<string, string>): Promise<UserPaymentMethod> => {
  const response = await fetch(`${API_URL}/user/payment-methods`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ payment_method_id: paymentMethodId, data })
  });
  if (!response.ok) throw new Error('Error al crear el método de pago del usuario');
  const responseData = await response.json();
  return responseData.data;
};

export const updateUserPaymentMethod = async (id: number, paymentMethodId: number, data: Record<string, string>): Promise<UserPaymentMethod> => {
  const response = await fetch(`${API_URL}/user/payment-methods/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ payment_method_id: paymentMethodId, data })
  });
  if (!response.ok) throw new Error('Error al actualizar el método de pago del usuario');
  const responseData = await response.json();
  return responseData.data;
};

export const deleteUserPaymentMethod = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/user/payment-methods/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Error al eliminar el método de pago del usuario');
};
