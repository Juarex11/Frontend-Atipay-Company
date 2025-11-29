export interface InvestmentPlan {
  id: string;
  name: string;
  percentaje: number;
  atipay_price_promotion: number;
  duration_months: number;
  status: 'active' | 'inactive';
  minAmount?: number;
  maxAmount?: number;
  duration?: number;
  durationDays?: number;
  returnRate?: number;
  dailyInterest?: number;
  features?: string[];
  color?: string;
  highlightColor?: string;
  promotionEligible?: boolean;
  popular?: boolean;
}

export type InvestmentStatus = 'pending' | 'active' | 'completed' | 'rejected' | 'cancelled';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Investment {
  id: number;
  user_id: number;
  promotion_id: number;
  amount: number;
  status: InvestmentStatus;
  created_at: string;
  updated_at: string;
  admin_message: string | null;
  daily_earning: number;
  total_earning: number;
  already_earned: number;
  last_earned_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  start_date: string;
  end_date: string;
  user: User;
  promotion: {
    id: number;
    name: string;
    percentaje: number;
    atipay_price_promotion: number;
    duration_months: number;
    status: 'active' | 'inactive';
    minAmount: number;
    maxAmount: number;
    duration: number;
    durationDays: number;
    returnRate: number;
    dailyInterest: number;
    features: string[];
    color: string;
    highlightColor: string;
    promotionEligible: boolean;
    popular: boolean;
  };
  withdrawals: Array<{
    id: number;
    investment_id: number;
    amount: number;
    transferred_at: string;
  }>;
  // Computed fields for UI
  currentValue?: number;
  expectedReturn?: number;
  progress?: number;
  dailyReturn?: number;
}
