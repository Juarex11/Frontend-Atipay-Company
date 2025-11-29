import { API_ROUTES } from '../config/api.routes';

export interface AuthResponse {
  token: string;
  expires_in: number;
  role: 'admin' | 'partner';
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  referralCode?: string;
}

export const loginUser = async (usernameOrEmail: string, password: string): Promise<AuthResponse> => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  console.log('Iniciando solicitud de login a:', apiUrl + '/login');

  try {
    const response = await fetch(apiUrl + '/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        username: usernameOrEmail,
        password: password,
      })
    });

    const responseData = await response.json();

    if (!response.ok) {
      // El backend devuelve el error en 'error' o 'message'
      const errorMsg = responseData.error || responseData.message || 'Error en la autenticación';
      throw new Error(errorMsg);
    }

    console.log('Datos de la respuesta:', responseData);
    return responseData as AuthResponse;
  } catch (error) {
    console.error('Error en la solicitud de login:', error);
    throw error;
  }
};

export const registerUser = async (data: RegisterData): Promise<AuthResponse> => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const response = await fetch(apiUrl + '/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      first_name: data.firstName, // Asegúrate que el backend espera 'first_name' y 'last_name'
      last_name: data.lastName,
      reference_code: data.referralCode,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Error de red o respuesta no válida.' }));
    throw new Error(errorBody.message || `Error en la petición: ${response.statusText}`);
  }

  return response.json() as Promise<AuthResponse>;
};

// Obtener URL base desde variable de entorno o usar default para desarrollo
const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Helper para obtener headers con el token actual
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Objeto 'api' que simula ser Axios pero usa fetch (para no romper tu estándar)
const api = {
  get: async (endpoint: string) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error: any = new Error(`Error GET ${endpoint}`);
      error.status = response.status;
      error.statusCode = response.status;
      throw error;
    }
    const data = await response.json();
    return { data, status: response.status };
  },

  post: async (endpoint: string, body: any) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error: any = new Error(`Error POST ${endpoint}`);
      error.status = response.status;
      error.statusCode = response.status;
      throw error;
    }
    const data = await response.json();
    return { data, status: response.status };
  }
};

// Exportamos 'api' por defecto para que se vaya el error rojo en los componentes
export default api;
