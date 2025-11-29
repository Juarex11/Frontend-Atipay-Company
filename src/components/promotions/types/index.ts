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
  percentaje: string;  // string for form handling, will be converted to number for API
  atipay_price_promotion: string;  // string for form handling, will be converted to number for API
  duration_months: string;  // string for form handling, will be converted to number for API
  status: 'active' | 'inactive';
  points_earned: string;  // string for form handling, will be converted to number for API
}

export type PromotionStatus = 'all' | 'active' | 'inactive';

export interface PromotionsFilter {
  status: PromotionStatus;
  search: string;
  type: string;
}
