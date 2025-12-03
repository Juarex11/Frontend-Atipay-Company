import { API_BASE_URL } from "@/config";
import { getAuthHeaders } from "@/lib/auth";

export interface ReferralUser {
  id: number;
  username: string;
  email: string;
  referral_url?: string;
  registration_date?: string;
  registration_time?: string;
  status?: string;
  created_at?: string;
  referrals_count?: number;
}

export interface ReferralNetworkResponse {
  success: boolean;
  user?: string; 
  data?: {
    [key: string]: ReferralUser[];
  };
}

class ReferralService {
  private readonly baseUrl = `${API_BASE_URL}/referrals`;

  // 📌 Red del usuario logueado
  async getReferralNetwork(): Promise<ReferralNetworkResponse> {
    const response = await fetch(`${this.baseUrl}/my-network`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Error al obtener la red de referidos");
    }

    return response.json();
  }

  // 📌 Obtener red de un usuario específico (ADMIN)
  async getNetworkForUser(userId: number): Promise<ReferralNetworkResponse> {
    const response = await fetch(
      `${API_BASE_URL}/admin/referrals/network/${userId}`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Error al obtener la red del usuario especificado");
    }

    return response.json();
  }

  // 🆕 📌 Listar usuarios disponibles (ADMIN)
  async getUsersList() {
    const response = await fetch(
      `${API_BASE_URL}/admin/users/list`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Error al obtener la lista de usuarios");
    }

    return response.json();
  }
}

export const referralService = new ReferralService();
