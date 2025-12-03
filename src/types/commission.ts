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
// =========================================================
//  NUEVAS INTERFACES PARA EL REPORTE (DASHBOARD ADMIN)
// =========================================================

// 1. Totales Generales (Las 3 tarjetas de arriba)
export interface DashboardTotals {
  total_general: string;
  total_pagadas: string;
  total_pendientes: string;
}

// 2. Gráfico por Mes
export interface MonthlyCommissionStat {
  year: number | null;
  month: number | null;
  total: string;
  pagadas: string;
  pendientes: string;
}

// 3. Info básica del Usuario (para reutilizar)
export interface CommissionUserBasic {
  id: number;
  username: string; // Ojo: en tu JSON sale 'username', no 'name'
  email: string;
  referral_url?: string;
}

// 4. Tabla de Top Usuarios
export interface UserCommissionStat {
  user_id: number;
  total: string;
  pagadas: string;
  pendientes: string;
  user: CommissionUserBasic;
}

// 5. Detalle extendido (Tu interfaz UnwithdrawnCommission + objetos de usuario)
export interface CommissionDetailItem extends UnwithdrawnCommission {
  user: CommissionUserBasic;
  referred_user: CommissionUserBasic;
}

// 6. RESPUESTA COMPLETA DEL API
export interface CommissionReportResponse {
  totales_generales: DashboardTotals;
  por_mes: MonthlyCommissionStat[];
  por_usuario: UserCommissionStat[];
  detalle: CommissionDetailItem[];
}