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

export const getSalesRanking = async (): Promise<RankingResponse> => {
  const response = await fetch(`${API_BASE_URL}/affiliate/ranking`, {
    headers: getAuthHeaders(),
  });
  
  return handleResponse<RankingResponse>(response);
};
