// Tipos de transacción soportados por la API
export type TransactionType = 'deposit' | 'withdrawal' | 'investment' | 'return' | 'commission' | 'transfer';

// Estados de transacción soportados por la API
export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'cancelled' | 'approved' | 'rejected';

// Métodos de pago soportados
export type PaymentMethod = 'yape' | 'plin' | 'transfer' | 'other' | 'bank_transfer' | 'crypto';

// Tipos de uso para transacciones
export type TransactionUsage = 'investment' | 'withdrawal' | 'transfer';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  reference: string;
  method: PaymentMethod;
  fee: number;
  category?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: number;
  receiver_id?: number;
  sender_id?: number;
  admin_message?: string;
  proof_image?: string;
  type_usage?: TransactionUsage;
}

export interface WithdrawalMethod {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  fee: string;
  time: string;
  min: number;
  max: number;
}

export interface EarningsData {
  month: string;
  investment: number;
  commission: number;
  total: number;
}
