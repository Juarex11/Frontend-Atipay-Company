// URL base de tu API (ajusta si usas otro puerto, pero este es el estándar de Laravel)
const API_URL = 'http://127.0.0.1:8000/api';

// Función auxiliar para obtener el token del almacenamiento
const getAuthHeaders = () => {
    const token = localStorage.getItem('token'); 
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}` // Inyectamos el token aquí
    };
};

// 1. Obtener lista de usuarios (GET)
export const getUsersForSelector = async () => {
    try {
        const response = await fetch(`${API_URL}/users?limit=1000&status=active`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error('Error al cargar usuarios');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error en getUsersForSelector:', error);
        throw error;
    }
};

// 2. Registrar Compra Manual (POST)
interface ManualPurchaseData {
    user_id: number;
    amount: number;
    description: string;
}

export const storeManualPurchase = async (data: ManualPurchaseData) => {
    try {
        const response = await fetch(`${API_URL}/admin/manual-purchase`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || 'Error al registrar la compra');
        }

        return responseData;
    } catch (error) {
        console.error('Error en storeManualPurchase:', error);
        throw error;
    }
};