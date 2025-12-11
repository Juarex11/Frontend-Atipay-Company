
export interface GiftRedemptionInfo {
  can_redeem: boolean;
  has_reached_limit: boolean;
  remaining_redeems: number;
  max_redeem: number;
  used_redeems: number;
}

export interface Gift {
  id: string;
  name: string;
  description: string;
  redeem_points: number;
  stock: number;
  max_redeem: number;
  image_url: string;
  created_at?: string;
  updated_at?: string;
  redemption_info?: GiftRedemptionInfo;
}
