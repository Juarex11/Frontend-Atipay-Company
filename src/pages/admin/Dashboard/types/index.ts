export interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'suspended' | 'pending';
  totalInvested: number;
  totalEarnings: number;
  joinDate: string;
  lastActivity: string;
  referrals: number;
  kyc: 'verified' | 'pending' | 'rejected';
}

export interface Withdrawal {
  id: string;
  user: string;
  amount: number;
  method: 'bank_transfer' | 'crypto' | 'paypal' | 'yape' | 'plin' | 'bcp' | 'interbank' | 'bbva' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  reference_code?: string;
  created_at: string;
  updated_at: string;
  requestDate?: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface AnalyticsData {
  month: string;
  users: number;
  revenue: number;
  investments: number;
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalInvestments: number;
  pendingWithdrawals: number;
  monthlyRevenue: number;
  conversionRate: number;
  averageInvestment: number;
  totalCommissions: number;
}

export type StatusType = 'active' | 'suspended' | 'pending';
export type KYCStatusType = 'verified' | 'pending' | 'rejected';
export type PriorityType = 'high' | 'normal' | 'low';
export type PaymentMethod = 'bank_transfer' | 'crypto' | 'paypal';
