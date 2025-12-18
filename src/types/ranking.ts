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

// Actualizamos la respuesta para que coincida con la paginación de Laravel
export interface RankingResponse {
  data: RankingUser[];      
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
  // Lo dejamos opcional (?) por si alguna parte antigua del código lo busca, 
  // pero tu nuevo endpoint ya no lo envía.
  current_user_ranking?: CurrentUserRanking | null; 
}
// -------------------

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