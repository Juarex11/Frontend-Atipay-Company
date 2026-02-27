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
  console.log('Iniciando solicitud de login a: https://back.mibolsillo.site/api/login');

  try {
    const response = await fetch('https://back.mibolsillo.site/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        username: usernameOrEmail, // Always send as username field
        password: password,
      })
    });

    const responseData = await response.json();

    if (!response.ok) {
  // Ahora intentará leer 'error' (que es lo que envía tu Laravel) o 'message'
  const errorMessage = responseData.error || responseData.message || 'Error desconocido en el servidor';
  throw new Error(errorMessage);
}
    console.log('Datos de la respuesta:', responseData);
    return responseData as AuthResponse;
  } catch (error) {
    console.error('Error en la solicitud de login:', error);
    throw error;
  }
};

export const registerUser = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await fetch(API_ROUTES.AUTH.REGISTER, {
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
