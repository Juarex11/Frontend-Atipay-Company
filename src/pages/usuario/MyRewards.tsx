import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Calendar, Loader2, Trophy } from 'lucide-react';
import { API_BASE_URL } from '@/config';

// --- CORRECCIÓN DE TIPO: Acepta null explícitamente ---
const fixImageUrl = (url: string | null | undefined) => {
  if (!url) return undefined; // Retornamos undefined para que React sepa manejarlo
  
  // 1. Evitar URL doble (Ej: http://localhost.../http://localhost...)
  const lastHttpIndex = url.lastIndexOf("http");
  if (lastHttpIndex > 0) return url.substring(lastHttpIndex);
  
  // 2. Si ya es correcta
  if (url.startsWith("http")) return url;
  
  // 3. Si es relativa, limpiamos y pegamos el dominio
  // Quitamos '/api' si existe en la base url para tener solo el dominio
  const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${cleanPath}`;
};

interface Reward {
  id: number;
  level: number;
  name: string;
  image: string | null;
  message: string;
  claimed_at: string;
}

export default function MyRewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/my-rewards`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRewards(data);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRewards();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-emerald-600 w-8 h-8" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Trophy className="text-yellow-500 w-8 h-8" /> Mis Premios Ganados
        </h1>
        <p className="text-gray-500 mt-1">Aquí está la colección de tus logros desbloqueados.</p>
      </div>

      {rewards.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600">Aún no tienes premios</h3>
          <p className="text-gray-400">¡Sigue acumulando puntos para desbloquear el Nivel 1!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => {
            const finalImage = fixImageUrl(reward.image);

            return (
              <Card key={reward.id} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-white">
                <div className="h-56 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center relative overflow-hidden p-4">
                  {finalImage ? (
                    <img 
                      src={finalImage} 
                      alt={reward.name} 
                      className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110 drop-shadow-md" 
                    />
                  ) : (
                    <Gift className="w-20 h-20 text-emerald-200" />
                  )}
                  <Badge className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 border-0 font-bold px-3 py-1 shadow-sm z-10">
                    Nivel {reward.level}
                  </Badge>
                </div>

                <CardContent className="p-5">
                  <h3 className="font-bold text-xl text-gray-800 mb-2 group-hover:text-emerald-600 transition-colors">
                    {reward.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-3 leading-relaxed">
                    {reward.message || "¡Felicidades! Has desbloqueado este premio."}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-400 border-t pt-4 mt-auto">
                    <Calendar className="w-3 h-3" />
                    <span>Conseguido el: {new Date(reward.claimed_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}