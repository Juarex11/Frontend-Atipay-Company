export type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
export type TransactionType = 'investment' | 'withdrawal' | 'transfer';
export type PaymentMethod = 'yape' | 'plin' | 'tunki' | 'bcp' | 'interbank' | 'bbva' | 'other';

export interface Recharge {
  id: string;
  user_id: number;
  amount: number;
  method: PaymentMethod;
  type_usage: TransactionType;
  proof_image_url: string;
  status: TransactionStatus;
  approved_by?: number;
  rejected_by?: number;
  rejected_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Transfer {
  id: string;
  sender_id: number;
  receiver_id: number;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
  sender?: {
    id: number;
    name: string;
    email: string;
  };
  receiver?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface TransferCreateData {
  receiver_id: number;
  amount: number;
  type: TransactionType;
}

export interface RechargeCreateData {
  amount: number;
  method: PaymentMethod;
  type_usage: TransactionType;
  proof_image: File;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
