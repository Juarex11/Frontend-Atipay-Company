/**
 * Obtiene el token de autenticación del almacenamiento local
 * @returns El token de autenticación o null si no existe
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Verifica si el usuario está autenticado
 * @returns true si el usuario está autenticado, false en caso contrario
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

/**
 * Obtiene los headers de autenticación
 * @returns Objeto con los headers de autenticación
 * @throws {Error} Si no hay un token de autenticación
 */
export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No se encontró el token de autenticación');
  }
  
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};
