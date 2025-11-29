// Base API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// API Endpoints
export const API_ROUTES = {
  // Authentication
  AUTH: {
    LOGIN: `${API_BASE_URL}/login`,
    REGISTER: `${API_BASE_URL}/register`,
    LOGOUT: `${API_BASE_URL}/logout`,
    REFRESH_TOKEN: `${API_BASE_URL}/refresh-token`,
    USER: `${API_BASE_URL}/user`,
  },

  // Atipay Recharges
  RECHARGES: {
    BASE: `${API_BASE_URL}/atipay-recharges`,
    MY: `${API_BASE_URL}/atipay-recharges/my`,
    BY_ID: (id: string | number) => `${API_BASE_URL}/atipay-recharges/${id}`,
    APPROVE: (id: string | number) => `${API_BASE_URL}/atipay-recharges/${id}/approve`,
    REJECT: (id: string | number) => `${API_BASE_URL}/atipay-recharges/${id}/reject`,
  },

  // Atipay Transfers
  TRANSFERS: {
    BASE: `${API_BASE_URL}/atipay-transfers`,
    SENT: `${API_BASE_URL}/atipay-transfers/sent`,
    RECEIVED: `${API_BASE_URL}/atipay-transfers/received`,
    DETAILS: (id: string | number) => `${API_BASE_URL}/atipay-transfers/${id}`,
    APPROVE: (id: string | number) => `${API_BASE_URL}/atipay-transfers/${id}/approve`,
    REJECT: (id: string | number) => `${API_BASE_URL}/atipay-transfers/${id}/reject`,
  },

  // Commissions
  COMMISSIONS: {
    SETTINGS: `${API_BASE_URL}/commissions/settings`,
    SETTINGS_BY_LEVEL: (level: number) => `${API_BASE_URL}/commissions/settings/${level}`,
  },

  // Investments
  INVESTMENTS: {
    BASE: `${API_BASE_URL}/investments`,
    PENDING: `${API_BASE_URL}/investments/pending`,
    ACTIVE: `${API_BASE_URL}/investments/active`,
    DAILY_GAINS: (id: string | number) => `${API_BASE_URL}/investments/${id}/daily-gains`,
    MONTHLY_GAINS: (id: string | number) => `${API_BASE_URL}/investments/${id}/monthly-gains`,
    APPROVE: (id: string | number) => `${API_BASE_URL}/investments/${id}/approve`,
    REJECT: (id: string | number) => `${API_BASE_URL}/investments/${id}/reject`,
    CREATE: `${API_BASE_URL}/investments`,
    BY_ID: (id: string | number) => `${API_BASE_URL}/investments/${id}`,

    /**
     * Ruta del backend (admin) para obtener el resumen de inversiones activas.
     * Corresponde al endpoint: GET /api/investments/admin/active-summary
     */
    ACTIVE_SUMMARY_ADMIN: `${API_BASE_URL}/admin/investments/active-summary`,
  },

  // Investment Withdrawals
  INVESTMENT_WITHDRAWALS: {
    BASE: `${API_BASE_URL}/investment-withdrawals`,
    APPROVE: (id: string | number) => `${API_BASE_URL}/investment-withdrawals/${id}/approve`,
    REJECT: (id: string | number) => `${API_BASE_URL}/investment-withdrawals/${id}/reject`,
  },

  // Products
  PRODUCTS: {
    BASE: `${API_BASE_URL}/products`,
    BY_ID: (id: string | number) => `${API_BASE_URL}/products/${id}`,
    MY_PURCHASE_REQUESTS: `${API_BASE_URL}/products/my-purchase-requests`,
    PURCHASE: `${API_BASE_URL}/products/purchase`,
    PURCHASE_REQUESTS: `${API_BASE_URL}/products/purchase-requests`,
    APPROVE_PURCHASE: (id: string | number) => `${API_BASE_URL}/products/purchase-requests/${id}/approve`,
    REJECT_PURCHASE: (id: string | number) => `${API_BASE_URL}/products/purchase-requests/${id}/reject`,
  },

  // Promotions
  PROMOTIONS: {
    BASE: `${API_BASE_URL}/promotions`,
    BY_ID: (id: string | number) => `${API_BASE_URL}/promotions/${id}`,
    CREATE: `${API_BASE_URL}/promotions`,
    UPDATE: (id: string | number) => `${API_BASE_URL}/promotions/${id}`,
    DELETE: (id: string | number) => `${API_BASE_URL}/promotions/${id}`,
  },
// Referrals

REFERRALS: {
  NETWORK: `${API_BASE_URL}/referrals/my-network`,
  NETWORK_COUNT: `${API_BASE_URL}/referrals/my-network-count`,
  EARNINGS: `${API_BASE_URL}/referrals/earnings`,

  ADMIN_REFERRALS: {
    NETWORK_FOR_USER: (userId: number | string) =>
      `${API_BASE_URL}/admin/referrals/network/${userId}`,
    SEARCH_USERS: `${API_BASE_URL}/admin/search-users`,
  },

  },

  // Withdrawals
  WITHDRAWALS: {
    BASE: `${API_BASE_URL}/withdrawals`,
    MY: `${API_BASE_URL}/withdrawals/my`,
    BY_ID: (id: string | number) => `${API_BASE_URL}/withdrawals/${id}`,
    APPROVE: (id: string | number) => `${API_BASE_URL}/withdrawals/${id}/approve`,
    REJECT: (id: string | number) => `${API_BASE_URL}/withdrawals/${id}/reject`,
  },
} as const;


export type ApiRouteParams = string | number;

export type ApiRoute =
  | string
  | ((...args: ApiRouteParams[]) => string);

export type ApiRoutes = {
  [key: string]: ApiRoute | { [key: string]: ApiRoute };
};

export function getRoute(path: string, ...args: ApiRouteParams[]): string {
  const parts = path.split('.');
  let route: unknown = API_ROUTES;

  for (const part of parts) {
    if (typeof route === 'object' && route !== null && part in route) {
      route = (route as Record<string, unknown>)[part];
    } else {
      throw new Error(`Route not found: ${path}`);
    }
  }

  if (typeof route === 'function') {
    return route(...args);
  }

  if (typeof route === 'string') {
    return route;
  }

  throw new Error(`Invalid route type for path: ${path}`);
}