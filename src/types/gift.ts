export interface Gift {
  id: number; // Cambiado a number porque el backend envía ID numérico (1, 2...)
  name: string;
  description: string;
  redeem_points: number; // Ajustado para coincidir con tu BD (antes era points)
  stock: number;
  image_url: string | null; // Ajustado a snake_case de tu BD (antes era imageUrl)
  created_at?: string; // Opcional, snake_case
  updated_at?: string; // Opcional, snake_case
  
  // Mantenemos estos opcionales por si alguna parte vieja del código los usa
  points?: number; 
  imageUrl?: string;
}