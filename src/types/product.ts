export type ProductType = 'product' | 'course';

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  type: ProductType;
  image?: string;
  isActive: boolean;
  stock?: number;
  categories?: string[];
  createdAt?: string;
  updatedAt?: string;
}
