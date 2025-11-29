export type InvestmentStatus = 'active' | 'completed' | 'pending' | 'rejected' | 'approved' | 'cancelled';

export interface Investment {
  id: number;
  user_id: number;
  promotion_id: number;
  amount: number;
  status: InvestmentStatus;
  receipt_url: string;
  created_at: string;
  updated_at: string;
  total_gain: number;
  promotion: {
    id: number;
    name: string;
    description: string;
    min_amount: number;
    max_amount: number;
    daily_interest: number;
    duration_days: number;
    created_at: string;
    updated_at: string;
  };
  // Computed fields for UI
  currentValue?: number;
  expectedReturn?: number;
  startDate?: string;
  endDate?: string;
  progress?: number;
  dailyReturn?: number;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  duration: number;
  durationDays: number;
  returnRate: number;
  dailyInterest: number;
  features: string[];
  color: string;
}

export interface PerformanceData {
  month: string;
  value: number;
  profit: number;
}
