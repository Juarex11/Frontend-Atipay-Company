export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "partner";
  status: "active" | "pending" | "suspended";
  points?: number;
  balance: number; // Saldo disponible del usuario
  createdAt: string;
  updatedAt: string;
  profile?: UserProfile;
}

export interface UserProfile {
  phone?: string;
  country?: string;
  documentNumber?: string;
  documentType?: "dni" | "passport" | "other";
  birthDate?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  totalInvested: number;
  totalEarnings: number;
  availableBalance: number;
  points: number;
  referralCode: string;
  referredBy?: string;
}

// Authentication API types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  referralCode?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
  referralCode?: string;
}

// Investments
export interface Investment {
  id: string;
  userId: string;
  amount: number;
  type: "basic" | "premium" | "vip";
  status: "active" | "completed" | "cancelled";
  startDate: string;
  endDate?: string;
  expectedReturn: number;
  currentReturn: number;
  duration: number; // in days
  createdAt: string;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number; // percentage
  duration: number; // in days
  isActive: boolean;
  features: string[];
}

// Affiliates
export interface Affiliate {
  id: string;
  referrerId: string;
  referredId: string;
  level: number;
  commission: number;
  status: "active" | "inactive";
  createdAt: string;
}

export interface AffiliateStats {
  totalReferrals: number;
  activeReferrals: number;
  totalCommissions: number;
  monthlyCommissions: number;
  levels: {
    level: number;
    count: number;
    commission: number;
  }[];
}

// Transactions
export interface Transaction {
  id: string;
  userId: string;
  type:
  | "deposit"
  | "withdrawal"
  | "investment"
  | "return"
  | "commission"
  | "purchase";
  amount: number;
  status: "pending" | "completed" | "failed" | "cancelled";
  description: string;
  reference?: string;
  createdAt: string;
  completedAt?: string;
}

// Store
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  pointsPrice?: number;
  category: string;
  imageUrl: string;
  inStock: boolean;
  isDigital: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  usePoints: boolean;
}

export interface Order {
  id: string;
  userId: string;
  items: {
    product: Product;
    quantity: number;
    price: number;
    pointsUsed: number;
  }[];
  totalAmount: number;
  totalPoints: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  shippingAddress?: string;
  createdAt: string;
  deliveredAt?: string;
}

// Promotions
export interface Promotion {
  id: string;
  title: string;
  description: string;
  type: "bonus" | "discount" | "points_multiplier";
  value: number; // percentage or fixed amount
  minInvestment?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  createdAt: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalUsers: number;
  totalInvestments: number;
  totalTransactions: number;
  totalRevenue: number;
  monthlyGrowth: number;
  activeInvestments: number;
  pendingWithdrawals: number;
  newUsersThisMonth: number;
}

export interface UserDashboardData {
  user: User;
  investments: Investment[];
  recentTransactions: Transaction[];
  affiliateStats: AffiliateStats;
  availablePromotions: Promotion[];
}

// API Response wrappers
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

// Search and filter types
export interface SearchFilters {
  search?: string;
  category?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}
