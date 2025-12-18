import { API_BASE_URL } from '../config';
import type { RankingResponse } from '../types/ranking';

interface ErrorResponse {
  message?: string;
  [key: string]: unknown;
}

interface ApiError extends Error {
  response?: Response;
  errorData?: ErrorResponse;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: ApiError = new Error(errorData.message || 'Error en la solicitud');
    error.response = response;
    error.errorData = errorData;
    throw error;
  }
  
  if (response.status === 204) {
    return {} as T;
  }
  
  return response.json();
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// 1. Aceptamos el argumento 'page' (default = 1).
// 2. Cambiamos la URL a '/admin/ranking' (la nueva ruta que creamos).
export const getSalesRanking = async (
  page: number = 1, 
  view: 'global' | 'mine' = 'global',
  search: string = '' // Parámetro de búsqueda opcional
): Promise<RankingResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/admin/ranking?page=${page}&view=${view}&search=${search}`, 
    { headers: getAuthHeaders() }
  );
  
  return handleResponse<RankingResponse>(response);
};