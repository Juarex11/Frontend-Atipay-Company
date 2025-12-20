// src/services/adminPurchaseService.ts

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
    type?: string;
    description?: string;
}

export interface ManualPurchaseData {
    user_id: number;
    amount: number;
    description: string;
    points?: number;
    payment_method?: 'cash' | 'wallet';
    image?: File | null; 
}

export interface PrivatePackData {
    user_id: number;
    name: string;
    price: number;
    points: number;
    description: string;
    image?: File | null; 
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
    id: number;
    name: string;
    conversion_factor_money: number;
    conversion_factor_points: number;
    total_pack_price: number;
    total_pack_points: number;
    status?: 'active' | 'inactive';
    products?: Product[];
}

// --- API CALLS ---

export const getUsersForSelector = async () => {
    const response = await fetch(`${API_URL}/users?limit=1000&status=active`, { method: 'GET', headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Error usuarios');
    const data = await response.json();
    return Array.isArray(data) ? data : (data.data || []);
};

export const getProductsForSelector = async () => {
    const response = await fetch(`${API_URL}/products?status=active`, { method: 'GET', headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Error productos');
    const data = await response.json();
    return Array.isArray(data) ? data : (data.data || []);
};

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
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Error venta');
    return result;
};

export const annulPurchase = async (purchaseId: number) => {
    const response = await fetch(`${API_URL}/admin/manual-purchase/${purchaseId}/annul`, { method: 'POST', headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error anular');
    return data;
};

export const assignPrivatePack = async (data: PrivatePackData) => {
    const formData = new FormData();
    formData.append('user_id', data.user_id.toString());
    formData.append('name', data.name);
    formData.append('price', data.price.toString());
    formData.append('points', data.points.toString());
    formData.append('description', data.description);
    if (data.image) formData.append('image', data.image);

    const response = await fetch(`${API_URL}/admin/products/assign-private`, { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Accept': 'application/json' }, 
        body: formData 
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Error pack privado');
    return result;
};

// --- REGLAS ---
export const getConversionRules = async (onlyActive = true) => {
    const endpoint = onlyActive ? '/admin/conversion-rules/active' : '/admin/conversion-rules';
    const response = await fetch(`${API_URL}${endpoint}`, { method: 'GET', headers: getAuthHeaders() });
    const data = await response.json();
    return Array.isArray(data) ? data : [];
};

export const createConversionRule = async (data: Partial<ConversionRule>) => {
    const response = await fetch(`${API_URL}/admin/conversion-rules`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return response.json();
};

export const updateConversionRule = async (id: number, data: Partial<ConversionRule>) => {
    const response = await fetch(`${API_URL}/admin/conversion-rules/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return response.json();
};

export const deleteConversionRule = async (id: number) => {
    const response = await fetch(`${API_URL}/admin/conversion-rules/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    return response.json();
};

// --- PACKS ---
export const getPacks = async () => {
    const response = await fetch(`${API_URL}/admin/packs`, { method: 'GET', headers: getAuthHeaders() });
    const data = await response.json();
    return Array.isArray(data) ? data : [];
};

export const createPack = async (data: CreatePackData) => {
    const response = await fetch(`${API_URL}/admin/packs`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || result.message || 'Error crear pack');
    return result;
};

export const updatePack = async (id: number, data: CreatePackData) => {
    const response = await fetch(`${API_URL}/admin/packs/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || result.message || 'Error actualizar pack');
    return result;
};

export const deletePack = async (id: number) => {
    const response = await fetch(`${API_URL}/admin/packs/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Error eliminar pack');
    return result;
};

export const togglePackStatus = async (id: number) => {
    const response = await fetch(`${API_URL}/admin/packs/${id}/toggle`, { method: 'PATCH', headers: getAuthHeaders() });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Error cambiar estado');
    return result;
};

// --- PRODUCTOS ---
export const createProduct = async (data: { name: string; price: number; points: string | number; description?: string; image?: File | null }) => {
    const token = localStorage.getItem('token'); 
    const headers: Record<string, string> = { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` };
    let body;
    const integerPoints = parseInt(data.points.toString());

    if (data.image) {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('price', data.price.toString());
        formData.append('points', data.points.toString());
        formData.append('points_earned', integerPoints.toString());
        formData.append('description', data.description || '');
        formData.append('stock', '100'); 
        formData.append('category_id', '1'); 
        formData.append('type', 'product'); 
        formData.append('image', data.image);
        body = formData;
    } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({
            name: data.name,
            price: data.price,
            points: data.points,
            points_earned: integerPoints,
            description: data.description || 'Producto creado desde admin',
            stock: 100, category_id: 1, type: 'product'
        });
    }

    const response = await fetch(`${API_URL}/products`, { method: 'POST', headers: headers, body: body });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.errors) throw new Error(Object.values(errorData.errors).flat().join('\n')); 
        throw new Error(errorData.message || `Error del servidor`);
    }
    return await response.json();
};