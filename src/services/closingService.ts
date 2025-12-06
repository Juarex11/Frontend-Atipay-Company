import { API_BASE_URL } from '@/config';

// Interfaces (Tipos de datos que vienen del backend)
export interface MonthlyStatus {
  current_points: number;
  min_points: number;
  qualified: boolean;
}

export interface MonthlyHistoryItem {
  month: number;
  year: number;
  points: number;
}

// 1. Función para obtener el estado actual (Semáforo)
export const getMonthlyStatus = async (): Promise<MonthlyStatus | null> => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No token found');

  try {
    const response = await fetch(`${API_BASE_URL}/monthly-points/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
        console.warn("No se pudo obtener el status mensual:", response.status);
        return null; // Retornamos null para no romper la app si falla
    }

    return response.json();
  } catch (error) {
    console.error('Error en getMonthlyStatus:', error);
    return null;
  }
};

// 2. Función para obtener el historial (Gráfico)
export const getMonthlyHistory = async (): Promise<MonthlyHistoryItem[]> => {
  const token = localStorage.getItem('token');
  if (!token) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/monthly-points/history`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) return []; // Si falla, devolvemos array vacío para no romper nada

    return response.json();
  } catch (error) {
    console.error('Error en getMonthlyHistory:', error);
    return [];
  }
};