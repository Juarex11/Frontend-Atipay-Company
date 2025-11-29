export interface UnwithdrawnCommission {
  id: number;
  user_id: number;
  referred_user_id: number;
  level: number;
  commission_amount: string;
  points_generated: number;
  source_type: string;
  month: number;
  year: number;
  withdrawn: number;
  locked: number;
}

export interface CommissionHistory {
  [key: string]: {
    total: number;
    comisiones: UnwithdrawnCommission[];
  };
}

export interface CommissionSummary {
  summary: {
    total_pendientes: number;
    total_retiradas: number;
  };
}
