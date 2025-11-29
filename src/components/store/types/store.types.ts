// Tipos para la tienda
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  pointsEarned?: number; // points_earned en la API (opcional)
  category: 'product' | 'service' | 'digital'; // type en la API
  imageUrl: string; // image_url en la API
  rating: number; // No disponible en la API actual
  reviews: number; // No disponible en la API actual
  inStock: boolean; // stock > 0
  isDigital: boolean; // type === 'digital'
  discount: number; // No disponible en la API actual
  featured: boolean; // No disponible en la API actual
  stock: number; // stock en la API
  unitType: string; // unit_type en la API
  // Campos específicos para cursos (usamos 'service' como tipo de curso)
  duration?: string; // No disponible en la API actual
  tutor?: string; // No disponible en la API actual
  details?: string; // No disponible en la API actual
  // Tipo para el frontend
  type: 'product' | 'course'; // 'course' cuando category === 'service'
};

export type CartItem = Product & {
  quantity: number;
};

export type CartSummary = {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
  hasPhysicalItems: boolean;
  estimatedDelivery: string;
};

// Constantes
export const TAX_RATE = 0.18; // 18% IGV en Perú
export const SHIPPING_COST = 15.00; // Costo de envío fijo en PEN
export const CART_STORAGE_KEY = 'atipay_cart';
