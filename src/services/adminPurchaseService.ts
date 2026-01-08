/* eslint-disable @typescript-eslint/no-explicit-any */
const API_URL = 'http://127.0.0.1:8000/api'; 

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// --- INTERFACES ---
export interface Product {
    id: number;
    name: string;
    price: number | string;
    points: number | string;
    points_earned?: number | string;
    stock?: number;
    image_path?: string;
    image_url?: string;
    type?: string;
    description?: string;
    is_visible?: boolean | number;
    unit_type?: string; 
}

export interface ManualPurchaseData {
    user_id: number;
    amount: number;
    description: string;
    points?: number;
    payment_method?: 'cash' | 'wallet';
    image?: File | null; 
}

// --- INTERFAZ ACTUALIZADA ---
export interface PrivatePackData {
    user_id: number;
    name: string;
    price: number;
    points: number;
    description: string;
    image?: File | null; 
    existing_image_url?: string | null; // Envío de URL como texto
}

export interface ConversionRule {
    id: number;
    name: string;
    amount_required: number;
    points_awarded: number;
    is_active: boolean;
}

export interface CreatePackData {
    name: string;
    conversion_money: number;
    conversion_points: number;
    products: number[]; 
    manual_distributions?: Record<number, number>; 
}

export interface Pack {
    image_url: string | undefined;
    id: number;
    name: string;
    conversion_factor_money: number;
    conversion_factor_points: number;
    total_pack_price: number;
    total_pack_points: number;
    status?: 'active' | 'inactive';
    products?: Product[];
    image_path?: string;
    description?: string;
}

// --- API CALLS: USUARIOS Y PRODUCTOS ---

export const getUsersForSelector = async () => {
    const response = await fetch(`${API_URL}/users?limit=1000&status=active`, { method: 'GET', headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Error usuarios');
    const data = await response.json();
    return Array.isArray(data) ? data : (data.data || []);
};

export const getProductsForSelector = async () => {
    const response = await fetch(`${API_URL}/products?status=active&show_hidden=1`, { method: 'GET', headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Error productos');
    const data = await response.json();
    return Array.isArray(data) ? data : (data.data || []);
};

// --- VENTAS ---

export const storeManualPurchase = async (data: ManualPurchaseData) => {
    const formData = new FormData();
    formData.append('user_id', data.user_id.toString());
    formData.append('amount', data.amount.toString());
    formData.append('description', data.description);
    if (data.points !== undefined) formData.append('points', data.points.toString());
    if (data.payment_method) formData.append('payment_method', data.payment_method);
    if (data.image) formData.append('image', data.image);

    const response = await fetch(`${API_URL}/admin/manual-purchase`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Accept': 'application/json' },
        body: formData,
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let msg = errorData.message || 'Error venta';
        if(msg.includes('too large') || msg.includes('2048')) msg = '⚠️ La imagen es muy pesada (Máx 2MB).';
        throw new Error(msg);
    }
    return await response.json();
};

export const annulPurchase = async (purchaseId: number) => {
    const response = await fetch(`${API_URL}/admin/manual-purchase/${purchaseId}/annul`, { method: 'POST', headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error anular');
    return data;
};

// --- PACKS PRIVADOS (CORREGIDO Y OPTIMIZADO) ---

export const assignPrivatePack = async (data: PrivatePackData) => {
    const formData = new FormData();
    formData.append('user_id', data.user_id.toString());
    formData.append('name', data.name);
    formData.append('price', data.price.toString());
    formData.append('points_earned', data.points.toString()); 
    formData.append('description', data.description);
    
    // CORRECCIÓN IMPORTANTE: Cambiado de 'pack' a 'product' para pasar la validación
    formData.append('type', 'product'); 
    formData.append('stock', '1');
    formData.append('is_visible', '1');

    // LÓGICA DE IMAGEN V2: Cero descargas en frontend
    if (data.image instanceof File) {
        // Opción A: Subida manual
        formData.append('image', data.image);
    } 
    else if (data.existing_image_url) {
        // Opción B: Enviar URL como texto para que el backend copie el archivo localmente
        formData.append('existing_image_url', data.existing_image_url);
    }

    const response = await fetch(`${API_URL}/products`, { 
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json', // Evita redirecciones y errores de CORS
        },
        body: formData
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        let errorMsg = result.message || result.error || 'Error al asignar pack privado';
        if (result.errors) {
            errorMsg = Object.values(result.errors).flat().join('\n');
        }
        throw new Error(errorMsg);
    }
    return result;
};

// --- REGLAS DE CONVERSIÓN ---

export const getConversionRules = async (onlyActive = true) => {
    const endpoint = onlyActive ? '/admin/conversion-rules/active' : '/admin/conversion-rules';
    const response = await fetch(`${API_URL}${endpoint}`, { method: 'GET', headers: getAuthHeaders() });
    const data = await response.json();
    return Array.isArray(data) ? data : [];
};

export const createConversionRule = async (data: Partial<ConversionRule>) => {
    const response = await fetch(`${API_URL}/admin/conversion-rules`, { 
        method: 'POST', 
        headers: getAuthHeaders(), 
        body: JSON.stringify(data) 
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Error al crear la regla');
    return result;
};

// --- PACKS ---

export const getPacks = async () => {
    const response = await fetch(`${API_URL}/admin/packs`, { method: 'GET', headers: getAuthHeaders() });
    const data = await response.json();
    return Array.isArray(data) ? data : [];
};

export const createPack = async (data: any) => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 
        'Accept': 'application/json', 
        'Authorization': `Bearer ${token}` 
    };

    let body;
    if (data instanceof FormData) {
        body = data;
    } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(data); 
    }

    const response = await fetch(`${API_URL}/admin/packs`, { 
        method: 'POST', 
        headers: headers, 
        body: body 
    });

    if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        let msg = result.error || result.message || 'Error crear pack';
        if (result.errors) msg = Object.values(result.errors).flat().join('\n');
        if (msg.includes('too large') || msg.includes('2048')) msg = '⚠️ La imagen es muy pesada (Máx 2MB).';
        throw new Error(msg);
    }
    return await response.json();
};

export const updatePack = async (id: number, data: any) => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 
        'Accept': 'application/json', 
        'Authorization': `Bearer ${token}` 
    };

    let method = 'PUT';
    let body;

    if (data instanceof FormData) {
        method = 'POST'; 
        body = data;
        if (!body.has('_method')) {
            body.append('_method', 'PUT');
        }
    } else {
        method = 'PUT';
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}/admin/packs/${id}`, { 
        method: method, 
        headers: headers, 
        body: body 
    });

    const result = await response.json();
    
    if (!response.ok) {
        const errorMsg = result.errors 
            ? Object.values(result.errors).flat().join('\n') 
            : (result.error || result.message || 'Error actualizar pack');
        throw new Error(errorMsg);
    }
    return result;
};

// --- PRODUCTOS ---

export const createProduct = async (data: any) => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 
        'Accept': 'application/json', 
        'Authorization': `Bearer ${token}` 
    };

    let body: FormData;

    if (data instanceof FormData) {
        body = data;
        if (!body.has('stock')) body.append('stock', '100');
        if (!body.has('type')) body.append('type', 'product');
        if (!body.has('category_id')) body.append('category_id', '1');
    } else {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            const value = data[key];
            if (value !== null && value !== undefined) {
                if (key === 'image' && value instanceof File) {
                    formData.append('image', value);
                } else if (typeof value === 'boolean') {
                    formData.append(key, value ? '1' : '0');
                } else {
                    formData.append(key, String(value));
                }
            }
        });
        if (!formData.has('stock')) formData.append('stock', '100');
        if (!formData.has('category_id')) formData.append('category_id', '1');
        if (!formData.has('type')) formData.append('type', 'product');
        if (!formData.has('points_earned') && formData.has('points')) {
             formData.append('points_earned', formData.get('points') as string);
        }
        body = formData;
    }

    const response = await fetch(`${API_URL}/products`, { 
        method: 'POST', 
        headers: headers, 
        body: body 
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.message || 'Error del servidor';
        if (errorData.errors) {
             errorMessage = Object.values(errorData.errors).flat().join('\n'); 
        }
        if (errorMessage.includes('greater than 2048') || errorMessage.includes('too large')) {
            throw new Error('⚠️ La imagen es muy pesada (Máx 2MB).');
        }
        throw new Error(errorMessage);
    }
    return await response.json();
};

export const createQuickProduct = async (name: string, price: number) => {
    return createProduct({
        name,
        price,
        points: (price / 3).toFixed(2), 
        description: 'Producto Rápido',
        stock: 100,
        type: 'product'
    });
};

export const updateProduct = async (id: number, data: any) => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const formData = new FormData();
    formData.append('_method', 'PUT'); 

    Object.keys(data).forEach(key => {
        const value = data[key];
        if (value !== null && value !== undefined) {
            if (key === 'image') {
                if (value instanceof File) formData.append('image', value);
            } 
            else if (typeof value === 'boolean') {
                formData.append(key, value ? '1' : '0');
            }
            else {
                formData.append(key, String(value));
            }
        }
    });

    if (!formData.has('type')) formData.append('type', 'product');

    const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'POST', 
        headers: headers,
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.errors) throw new Error(Object.values(errorData.errors).flat().join('\n'));
        throw new Error(errorData.message || 'Error al actualizar');
    }

    return await response.json();
};

export const deleteProduct = async (id: number) => {
    const response = await fetch(`${API_URL}/products/${id}`, { 
        method: 'DELETE', 
        headers: getAuthHeaders() 
    });
    
    if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || result.message || 'Error al eliminar producto');
    }
    return await response.json();
};

export const deletePack = async (id: number) => {
    const response = await fetch(`${API_URL}/admin/packs/${id}`, { 
        method: 'DELETE', 
        headers: getAuthHeaders() 
    });
    
    if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || result.message || 'Error al eliminar pack');
    }
    return await response.json();
};
export const deleteConversionRule = async (id: number | string) => {
    const response = await fetch(`${API_URL}/admin/conversion-rules/${id}`, { 
        method: 'DELETE', 
        headers: getAuthHeaders() 
    });
    
    if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || 'Error al eliminar regla');
    }
    return await response.json();
};
