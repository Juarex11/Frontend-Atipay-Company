import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card"; // Eliminado CardHeader y CardTitle por no usarse
import { Save, Trophy } from 'lucide-react'; // Eliminado Upload por no usarse
import { API_BASE_URL } from '@/config';
import { toast } from "sonner";

interface LevelReward {
  id: number;
  level: number;
  percentage: number;
  min_points: number;
  reward_text: string | null;
  reward_message: string | null;
  reward_image_path: string | null;
}

export default function RankRewardsManager() {
  const [levels, setLevels] = useState<LevelReward[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Estados temporales para edición
  const [formData, setFormData] = useState({
    min_points: '',
    reward_text: '',
    reward_message: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const token = localStorage.getItem('token');

  const fetchLevels = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/level-rewards`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      if(res.ok) {
        const data = await res.json();
        setLevels(data);
      }
    } catch (error) {
      console.error("Error cargando niveles:", error);
    }
  }, [token]);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  const startEditing = (level: LevelReward) => {
    setEditingId(level.id);
    setFormData({
      min_points: level.min_points?.toString() || '0',
      reward_text: level.reward_text || '',
      reward_message: level.reward_message || '',
    });
    setImageFile(null);
  };

  const handleSave = async (id: number) => {
    setLoading(true);
    const data = new FormData();
    data.append('min_points', formData.min_points);
    data.append('reward_text', formData.reward_text);
    data.append('reward_message', formData.reward_message);
    if (imageFile) {
        data.append('image', imageFile);
    }

    try {
        const res = await fetch(`${API_BASE_URL}/admin/level-rewards/${id}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: data
        });

        if (res.ok) {
            toast.success("Premio actualizado correctamente");
            setEditingId(null);
            fetchLevels();
        } else {
            toast.error("Error al guardar");
        }
    } catch (error) {
        console.error(error);
        toast.error("Error de conexión");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-100 rounded-xl">
            <Trophy className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Configuración de Premios por Nivel</h1>
            <p className="text-gray-500">Define los premios para tus niveles existentes (1, 2, 3...)</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {levels.map((level) => (
            <Card key={level.id} className={`border-l-4 ${level.reward_text ? 'border-l-emerald-500' : 'border-l-gray-300'} shadow-md`}>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Columna Izquierda: Info del Nivel */}
                        <div className="md:w-1/4 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                                <span className="text-2xl font-black text-emerald-600">{level.level}</span>
                            </div>
                            <h3 className="font-bold text-gray-700">Nivel {level.level}</h3>
                            <span className="text-xs text-gray-400">Comisión: {level.percentage}%</span>
                            
                            {/* Mostrar imagen actual si existe y no se está editando */}
                            {level.reward_image_path && editingId !== level.id && (
                                <img src={level.reward_image_path} alt="Premio" className="mt-4 w-20 h-20 object-contain" />
                            )}
                        </div>

                        {/* Columna Derecha: Formulario de Premio */}
                        <div className="flex-1">
                            {editingId === level.id ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500">Puntos Mínimos</label>
                                            <Input 
                                                type="number" 
                                                value={formData.min_points}
                                                onChange={e => setFormData({...formData, min_points: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500">Nombre del Premio</label>
                                            <Input 
                                                placeholder="Ej: Bono Yape S/ 50"
                                                value={formData.reward_text}
                                                onChange={e => setFormData({...formData, reward_text: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500">Mensaje de Felicitación</label>
                                        <Textarea 
                                            placeholder="¡Felicidades por alcanzar este nivel!"
                                            value={formData.reward_message}
                                            onChange={e => setFormData({...formData, reward_message: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500">Imagen del Regalo</label>
                                        <Input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={e => setImageFile(e.target.files?.[0] || null)}
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-end mt-4">
                                        <Button variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
                                        <Button 
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                                            onClick={() => handleSave(level.id)}
                                            disabled={loading}
                                        >
                                            <Save size={16} /> {loading ? 'Guardando...' : 'Guardar Cambios'}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col justify-center">
                                    {level.reward_text ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">
                                                    Meta: {level.min_points} pts
                                                </span>
                                                <h4 className="font-bold text-lg text-gray-800">🎁 {level.reward_text}</h4>
                                            </div>
                                            <p className="text-sm text-gray-500 italic">"{level.reward_message}"</p>
                                            <Button variant="outline" size="sm" onClick={() => startEditing(level)} className="mt-2">
                                                Editar Configuración
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-gray-400">
                                            <p className="mb-2">Este nivel no tiene premio configurado.</p>
                                            <Button onClick={() => startEditing(level)} variant="outline" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50">
                                                + Configurar Premio
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}