import { API_ROUTES } from '../config/api.routes';

interface Investment {
  id: string | number;
  user_id: string | number;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
  // Agrega más campos según lo que devuelva la API
}

interface DailyGain {
  id: string | number;
  investment_id: string | number;
  amount: number;
  date: string;
  created_at: string;
  updated_at: string;
}

interface CreateInvestmentData {
  amount: number;
  // Agrega más campos según lo que requiera la API
}

export const getInvestments = async (): Promise<Investment[]> => {
  const response = await fetch(API_ROUTES.INVESTMENTS.BASE, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al obtener las inversiones');
  }

  return response.json();
};

export const createInvestment = async (data: CreateInvestmentData): Promise<Investment> => {
  const response = await fetch(API_ROUTES.INVESTMENTS.BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Accept': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al crear la inversión');
  }

  return response.json();
};

export const getInvestmentDailyGains = async (investmentId: string | number): Promise<DailyGain[]> => {
  const response = await fetch(API_ROUTES.INVESTMENTS.DAILY_GAINS(investmentId), {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al obtener las ganancias diarias');
  }

  return response.json();
};

export const getPendingInvestments = async (): Promise<Investment[]> => {
  const response = await fetch(API_ROUTES.INVESTMENTS.PENDING, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al obtener las inversiones pendientes');
  }

  return response.json();
};

export const getActiveInvestments = async (): Promise<Investment[]> => {
  const response = await fetch(API_ROUTES.INVESTMENTS.ACTIVE, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al obtener las inversiones activas');
  }

  return response.json();
};

export const approveInvestment = async (investmentId: string | number): Promise<Investment> => {
  const response = await fetch(API_ROUTES.INVESTMENTS.APPROVE(investmentId), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al aprobar la inversión');
  }

  return response.json();
};

export const rejectInvestment = async (investmentId: string | number, reason?: string): Promise<Investment> => {
  const response = await fetch(API_ROUTES.INVESTMENTS.REJECT(investmentId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Accept': 'application/json',
    },
    body: reason ? JSON.stringify({ reason }) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al rechazar la inversión');
  }

  return response.json();
};
