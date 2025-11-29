export interface Promotion {
  id: string;
  name: string;
  percentaje: number;
  atipay_price_promotion: number;
  points_earned: number;
  duration_months: number;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface PromotionFormData {
  name: string;
  percentaje: string;
  atipay_price_promotion: string;
  points_earned: string;
  duration_months: string;
  status: 'active' | 'inactive';
}

export interface PromotionsFilter {
  status: 'all' | 'active' | 'inactive';
  search: string;
  type: string;
}

export type CreatePromotionDTO = Omit<Promotion, 'id' | 'created_at' | 'updated_at'>;
