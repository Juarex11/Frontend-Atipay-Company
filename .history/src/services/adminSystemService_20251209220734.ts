// src/services/adminSystemService.ts

import { getAuthToken } from '../utils/auth';
 // Asegúrate de que esta ruta sea correcta

// Ajusta la URL base si usas variables de entorno, ej: import.meta.env.VITE_API_URL
const API_BASE = 'http://127.0.0.1:8000/api'; 

const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };
};

export const AdminSystemService = {
    
    /**
     * Obtener contadores para badges (Admin)
     */
    async getPendingCounts() {
        try {
            const response = await fetch(`${API_BASE}/admin/pending-counts`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            return { success: true, data };
        } catch (error) {
            return { success: false, error };
        }
    },

    /**
     * Obtener valor actual de puntos mínimos (Admin)
     */
    async getMinPointsSetting(): Promise<{ success: boolean; value: number }> {
        try {
            const response = await fetch(`${API_BASE}/admin/settings/min-points`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });
            
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.message || 'Error al obtener puntos');
            
            // La API devuelve { value: 93 }
            return { success: true, value: data.value };
        } catch (error) {
            console.error(error);
            return { success: false, value: 0 };
        }
    },

    /**
     * Actualizar puntos mínimos (Admin)
     */
    async updateMinPointsSetting(value: number): Promise<{ success: boolean; message: string }> {
        try {
            const response = await fetch(`${API_BASE}/admin/settings/min-points`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ value }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Error al actualizar');

            return { success: true, message: data.message };
        } catch (error) {
            return { 
                success: false, 
                message: error instanceof Error ? error.message : 'Error desconocido' 
                
            };
        }
    }
};