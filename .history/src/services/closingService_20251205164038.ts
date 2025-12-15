import { API_BASE_URL } from '@/config';

// Interfaces basadas en la respuesta de tu Backend (MonthlyClosingController)
export interface MonthlyStatus {
  current_points: number;
  min_points: number;
  qualified: boolean;
  month_name?: string; 
}

export interface MonthlyHistoryItem {
  month: number;
  year: number;
  points: number;
}

// 1. Obtener el Semáforo (Status actual del cierre)
export const getMonthlyStatus = async (): Promise<MonthlyStatus> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/monthly-points/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
        // Si el backend devuelve error (ej. 401 o 500), lo capturamos aquí
        const errorText = await response.text();
        throw new Error(`Error fetching status: ${response.status} - ${errorText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error en getMonthlyStatus:', error);
    throw error;
  }
};

// 2. Obtener el Historial para el Gráfico Anual
export const getMonthlyHistory = async (): Promise<MonthlyHistoryItem[]> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/monthly-points/history`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error fetching history: ${response.status} - ${errorText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error en getMonthlyHistory:', error);
    throw error;
  }
};