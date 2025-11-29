import { createContext } from 'react';
import type { Product, CartItem } from '@/components/store/types/store.types';

export interface CartContextType {
  readonly cart: ReadonlyArray<Readonly<CartItem>>;
  addToCart: (product: Readonly<Product>, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartItemCount: () => number;
  getCartTotal: () => number;
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);
