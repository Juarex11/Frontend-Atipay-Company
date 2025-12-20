// === CONFIGURACIÓN Y CONSTANTES ===
export const ATIPAY_ICON_SRC = "/assets/atipay_logo-moneda.png"; // <--- AGREGAR ESTO
export const STORAGE_KEY = 'admin_manual_purchase_history';

export const CONVERSION_RULES = [
    { id: 'r1', name: 'Abarrotes (Estándar)', factor: 300, points: 100 }, 
    { id: 'r2', name: 'Promo Emprendedor', factor: 200, points: 100 },    
    { id: 'r3', name: 'Solo Consumo', factor: 400, points: 50 },          
];

// === FUNCIONES DE AYUDA ===
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const safeParseFloat = (value: any): number => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
};

// === INTERFACES ===
export interface User {
    id: number;
    username: string; 
    email?: string;
    phone_number?: string; // Asegúrate de que esto siga así (phone_number)
    dni?: string;
    atipay_money?: number;
}

export interface Product {
    id: number | string;
    name: string;
    price: number | string; 
    points: number | string; 
    description?: string;
}

export interface CartItem {
    id: string;
    productId?: string | number;
    name: string;
    price: number;
    points: number;
    type: 'product' | 'loose'; 
    description?: string;
}

export interface TransactionLog {
    id: number;
    user_name: string;
    description: string;
    amount: number;
    points: number;
    payment_method: 'cash' | 'wallet'; 
    date: string; 
    time: string; 
}