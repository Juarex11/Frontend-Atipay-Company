import { API_BASE_URL } from "@/config";
import { getAuthHeaders } from "@/lib/auth";

export interface ReferralUser {
  id: number;
  username: string;
  email: string;
  referral_url: string;
  registration_date: string; // formato: "2025-08-31"
  registration_time: string; // formato: "02:13:34 PM"
  status?: string;
  created_at?: string;
  referrals_count?: number;
}

export interface ReferralNetworkResponse {
  success: boolean;
  data: {
    [key: string]: ReferralUser[];
  };
}

class ReferralService {
  private readonly baseUrl = `${API_BASE_URL}/referrals`;

  async getReferralNetwork(): Promise<ReferralNetworkResponse> {
    const response = await fetch(`${this.baseUrl}/my-network`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener la red de referidos');
    }

    return response.json();
  }
}

export const referralService = new ReferralService();
