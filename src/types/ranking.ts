export interface RankingUser {
  id: number;
  username: string;
  email: string;
  commission_amount: string;
  accumulated_points: number;
  level: number;
}

export interface CurrentUserRanking {
  id: number;
  username: string;
  email: string;
  position: number;
  commission_amount: string;
  accumulated_points: number;
}

export interface RankingResponse {
  ranking: RankingUser[];
  current_user_ranking: CurrentUserRanking | null;
}

export interface RankingTableProps {
  ranking: RankingUser[];
  currentUserRanking: CurrentUserRanking | null;
  loading: boolean;
  error: string;
  title: string;
  description: string;
  limit: number | null;
  showLevel?: boolean;
}
