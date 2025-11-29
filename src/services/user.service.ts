import { API_BASE_URL } from "@/config";
import { getAuthHeaders } from "@/utils/auth";

export interface UserProfileApi {
  id: number;
  username: string;
  email: string;
  role_id: number;
  status: string;
  atipay_money: number;
  accumulated_points: number;
  withdrawable_balance: string;
  reference_code: string;
  referred_by: number | null;
  registration_date: string;
  registration_time: string;
  referral_url: string;
}

export interface UserProfileNormalized {
  id: number;
  username: string;
  email: string;
  roleId: number;
  status: string;
  atipayMoney: number;
  accumulatedPoints: number;
  withdrawableBalance: number;
  referenceCode: string;
  referredBy: number | null;
  referralUrl: string;
  registeredAt?: string;
}

const combineDateTime = (d?: string, t?: string) => {
  if (!d || !t) return undefined;
  try {
    const dt = new Date(`${d} ${t}`);
    if (!isNaN(dt.getTime())) return dt.toISOString();
  } catch (error) {
    console.error('Error combining date and time:', error);
  }
  return undefined;
};

const normalizeUser = (raw: UserProfileApi): UserProfileNormalized => ({
  id: raw.id,
  username: raw.username,
  email: raw.email,
  roleId: raw.role_id,
  status: raw.status,
  atipayMoney: raw.atipay_money,
  accumulatedPoints: raw.accumulated_points,
  withdrawableBalance: parseFloat(raw.withdrawable_balance) || 0,
  referenceCode: raw.reference_code,
  referredBy: raw.referred_by,
  referralUrl: raw.referral_url,
  registeredAt: combineDateTime(raw.registration_date, raw.registration_time),
});

export const getCurrentUserProfile =
  async (): Promise<UserProfileNormalized> => {
    const res = await fetch(`${API_BASE_URL}/user`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const data: UserProfileApi = await res.json();
    return normalizeUser(data);
  };
