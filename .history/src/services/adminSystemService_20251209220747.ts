// src/services/adminSystemService.ts

import { getAuthToken } from '../utils/auth'; 

// Ajusta la URL base si usas variables de entorno
const API_BASE = 'https://back.mibolsillo.site/api'; 

const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };
};

export const AdminSystemService = {
    
    // ... (Tus métodos anteriores: getPendingCounts y getMinPointsSetting se quedan igual) ...

    async getMinPointsSetting(): Promise<{ success: boolean; value: number }> {
        // ... (Tu código existente) ...
        try {
            const response = await fetch(`${API_BASE}/admin/settings/min-points`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al obtener puntos');
            return { success: true, value: data.value };
        } catch (error) {
            console.error(error);
            return { success: false, value: 0 };
        }
    },

    async updateMinPointsSetting(value: number): Promise<{ success: boolean; message: string }> {
         // ... (Tu código existente) ...
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
    },

    // =======================================================
    // ===> AGREGA ESTO AL FINAL (DENTRO DEL OBJETO) <===
    // =======================================================

    /**
     * Actualizar información de cuenta bancaria (Admin)
     * Payload: { value: string }
     */
    async updateBankInfo(info: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await fetch(`${API_BASE}/admin/settings/bank-info`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ value: info }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al actualizar cuenta bancaria');
            }

            return { success: true, message: data.message };
        } catch (error) {
            console.error("Error en updateBankInfo:", error);
            return { 
                success: false, 
                message: error instanceof Error ? error.message : 'Error desconocido' 
            };
        }
    }
};