// src/services/adminPurchaseService.ts

// Asegúrate de que esta URL apunte a tu backend correcto
const API_URL = 'http://127.0.0.1:8000/api'; 

// --- HEADERS AUXILIAR (Para peticiones JSON normales) ---
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// --- INTERFACES ---
export interface ManualPurchaseData {
    user_id: number;
    amount: number;
    description: string;
    points?: number;
    payment_method?: 'cash' | 'wallet';
    image?: File | null; // <--- Agregamos soporte para imagen en la interfaz
}

export interface PrivatePackData {
    user_id: number;
    name: string;
    price: number;
    points: number;
    description: string;
    image?: File | null; // <--- Agregamos soporte para imagen
}

// ==========================================
// 1. OBTENER USUARIOS (Para el Select)
// ==========================================
export const getUsersForSelector = async () => {
    try {
        // Ajusta los filtros según necesites (ej: ?limit=1000&status=active)
        const response = await fetch(`${API_URL}/users?limit=1000&status=active`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) throw new Error('Error al cargar usuarios');
        
        const data = await response.json();
        // Si tu API devuelve { data: [...] }, retornamos data.data, si no data.
        return Array.isArray(data) ? data : (data.data || []);
    } catch (error) {
        console.error("Error getUsersForSelector:", error);
        throw error;
    }
};

// ==========================================
// 2. OBTENER PRODUCTOS (Para el Catálogo)
// ==========================================
export const getProductsForSelector = async () => {
    try {
        const response = await fetch(`${API_URL}/products?status=active`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) throw new Error('Error al cargar productos');

        const data = await response.json();
        return Array.isArray(data) ? data : (data.data || []);
    } catch (error) {
        console.error("Error getProductsForSelector:", error);
        throw error;
    }
};

// ==========================================
// 3. REGISTRAR COMPRA MANUAL (Venta Directa)
//    * ACTUALIZADO con FormData para Imagen *
// ==========================================
export const storeManualPurchase = async (data: ManualPurchaseData) => {
    const formData = new FormData();
    
    // Convertimos datos a FormData
    formData.append('user_id', data.user_id.toString());
    formData.append('amount', data.amount.toString());
    formData.append('description', data.description);
    
    if (data.points !== undefined) {
        formData.append('points', data.points.toString());
    }
    
    if (data.payment_method) {
        formData.append('payment_method', data.payment_method);
    }
    
    // Adjuntamos la imagen si existe
    if (data.image) {
        formData.append('image', data.image);
    }

    // Headers específicos para FormData (SIN Content-Type)
    const headers = { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Accept': 'application/json'
    };

    const response = await fetch(`${API_URL}/admin/manual-purchase`, {
        method: 'POST',
        headers: headers,
        body: formData,
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Error al procesar la venta.');
    return result;
};

// ==========================================
// 4. ANULAR VENTA (Revertir Dinero/Puntos)
// ==========================================
export const annulPurchase = async (purchaseId: number) => {
    try {
        const response = await fetch(`${API_URL}/admin/manual-purchase/${purchaseId}/annul`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al anular la venta');
        }

        return data;
    } catch (error) {
        console.error('Error en annulPurchase:', error);
        throw error;
    }
};

// ==========================================
// 5. CREAR PACK PRIVADO (Enviar a Tienda)
//    * ACTUALIZADO con FormData para Imagen *
// ==========================================
export const assignPrivatePack = async (data: PrivatePackData) => {
    const formData = new FormData();
    
    formData.append('user_id', data.user_id.toString());
    formData.append('name', data.name);
    formData.append('price', data.price.toString());
    formData.append('points', data.points.toString());
    formData.append('description', data.description);

    if (data.image) {
        formData.append('image', data.image);
    }

    const headers = { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Accept': 'application/json'
    };

    const response = await fetch(`${API_URL}/admin/products/assign-private`, { 
        method: 'POST',
        headers: headers,
        body: formData,
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Error al crear el pack privado.');
    return result;
};