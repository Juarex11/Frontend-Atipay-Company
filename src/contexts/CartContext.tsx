import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useToast } from '@/components/ui/use-toast';
import type { Product, CartItem } from '@/components/store/types/store.types';
import { CartContext } from './cart-context';

interface CartProviderProps {
  readonly children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('atipay_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse cart from localStorage', error);
        localStorage.removeItem('atipay_cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('atipay_cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('atipay_cart');
    }
  }, [cart]);

  const addToCart = useCallback((product: Readonly<Product>, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);

      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prevCart, { ...product, quantity }];
    });

    toast({
      title: 'Producto agregado',
      description: `${quantity} ${quantity > 1 ? 'unidades' : 'unidad'} de ${product.name} se ha añadido al carrito`,
    });
  }, [toast]);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getCartItemCount = useCallback(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  const getCartTotal = useCallback(() => {
    return cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }, [cart]);

  const isInCart = useCallback((productId: string) => {
    return cart.some(item => item.id === productId);
  }, [cart]);

  const getItemQuantity = useCallback((productId: string) => {
    const item = cart.find(item => item.id === productId);
    return item ? item.quantity : 0;
  }, [cart]);

  const contextValue = useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItemCount,
    getCartTotal,
    isInCart,
    getItemQuantity,
  }), [
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItemCount,
    getCartTotal,
    isInCart,
    getItemQuantity,
  ]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

