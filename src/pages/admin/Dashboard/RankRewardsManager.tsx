import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, Save, BarChart3, Settings, 
  Search, RefreshCw, ArrowLeft, ArrowRight,
  Play, Pause, TrendingUp, Users, Wallet, Filter 
} from 'lucide-react';
import { API_BASE_URL } from '@/config';
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// --- TIPOS DE DATOS ---
interface LevelReward {
  id: number;
  level: number;
  min_points: number;
  reward_text: string | null;
  reward_message: string | null;
  reward_image_path: string | null;
}

interface UserRank {
  id: number;
  username: string;
  email: string;
  accumulated_points: number;
  atipay_money: number;
  created_at: string;
}

interface PaginationData {
  current_page: number;
  last_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

// --- COMPONENTE BOTÓN DE FILTRO (EXTERNO) ---
const FilterButton = ({ 
  label, 
  isActive, 
  colorClass, 
  onClick 
}: { 
  label: string, 
  value: string, 
  isActive: boolean, 
  colorClass: string, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${
      isActive 
        ? `${colorClass} ring-2 ring-offset-1 ring-gray-100 shadow-sm` 
        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
    }`}
  >
    {label}
  </button>
);

export default function RankRewardsManager() {
  const [activeTab, setActiveTab] = useState<'config' | 'monitor'>('config');
  const [isLive, setIsLive] = useState(true);
  const token = localStorage.getItem('token');

  // ==========================================
  // LÓGICA DE CONFIGURACIÓN
  // ==========================================
  const [levels, setLevels] = useState<LevelReward[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ min_points: '', reward_text: '', reward_message: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loadingSave, setLoadingSave] = useState(false);

  // Usamos useCallback para que no cambie en cada render
  const fetchLevels = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/level-rewards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setLevels(await res.json());
    } catch (err) { console.error(err); }
  }, [token]);

  // ==========================================
  // LÓGICA DE MONITORIZACIÓN
  // ==========================================
  const [users, setUsers] = useState<UserRank[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // SOLUCIÓN AL BUCLE: Usamos useRef para saber si ya cargamos datos alguna vez
  const hasLoadedRef = useRef(false);

  const fetchHistory = useCallback(async () => {
    // Solo mostramos spinner si es la primera vez que cargamos o si NO estamos en vivo
    // Esto evita el parpadeo en el polling
    if (!hasLoadedRef.current) setLoadingHistory(true);
    
    try {
      const url = `${API_BASE_URL}/admin/rank-history?page=${page}&search=${searchTerm}&level=${filterLevel}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data);
        setPagination({
          current_page: data.current_page,
          last_page: data.last_page,
          total: data.total,
          next_page_url: data.next_page_url,
          prev_page_url: data.prev_page_url
        });
        hasLoadedRef.current = true; // Marcamos que ya tenemos datos
      }
    } catch (err) { 
      console.error("Error historial:", err);
    } finally {
      setLoadingHistory(false);
    }
    // ¡OJO! Quitamos 'pagination' y 'isLive' de las dependencias para evitar el bucle infinito
  }, [token, page, searchTerm, filterLevel]); 

  // Handler para cambiar filtros
  const handleFilterChange = (level: string) => {
    if (filterLevel === level) return; // Si es el mismo, no hacemos nada
    setFilterLevel(level);
    setPage(1);
    hasLoadedRef.current = false; // Reseteamos para mostrar loading visual
    setUsers([]); // Limpiamos tabla visualmente
  };

  // Estadísticas (KPIs)
  const stats = useMemo(() => {
    if (!users.length) return { newThisMonth: 0, totalMoney: 0 };
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const newUsers = users.filter(u => {
      const d = new Date(u.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
    const money = users.reduce((acc, curr) => acc + Number(curr.atipay_money), 0);
    return { newThisMonth: newUsers, totalMoney: money };
  }, [users]);

  // Polling y Efectos
  useEffect(() => {
    if (activeTab === 'config') fetchLevels();
    
    if (activeTab === 'monitor') {
      fetchHistory(); // Carga inicial
      
      let intervalId: NodeJS.Timeout;
      // Solo activamos polling si está En Vivo y no hay búsqueda activa
      if (isLive && searchTerm === '') {
        intervalId = setInterval(() => {
            // Llamamos a la función directamente
            fetchHistory();
        }, 10000); 
      }
      return () => { if (intervalId) clearInterval(intervalId); };
    }
  }, [activeTab, isLive, searchTerm, fetchLevels, fetchHistory]); 
  // Al sacar 'pagination' de fetchHistory, fetchHistory ya es estable y este useEffect no se vuelve loco.

  // Handlers Config
  const startEditing = (lvl: LevelReward) => {
    setEditingId(lvl.id);
    setFormData({
      min_points: String(lvl.min_points || 0),
      reward_text: lvl.reward_text || '',
      reward_message: lvl.reward_message || ''
    });
    setImageFile(null);
  };

  const handleSaveConfig = async (id: number) => {
    setLoadingSave(true);
    const data = new FormData();
    data.append('min_points', formData.min_points);
    data.append('reward_text', formData.reward_text);
    data.append('reward_message', formData.reward_message);
    if (imageFile) data.append('image', imageFile);

    try {
      await fetch(`${API_BASE_URL}/admin/level-rewards/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });
      toast.success("Premio guardado");
      setEditingId(null);
      fetchLevels();
    } catch { toast.error("Error al guardar"); }
    finally { setLoadingSave(false); }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Trophy className="text-emerald-600 h-8 w-8" /> 
            Gestión de Niveles y Premios
          </h1>
          {activeTab === 'monitor' && (
            <div className="flex items-center gap-2 mt-2 ml-1">
               <Button 
                variant="outline" size="sm" onClick={() => setIsLive(!isLive)}
                className={`h-7 text-xs px-3 border transition-all duration-300 ${
                  isLive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}
              >
                {isLive ? <><Pause className="w-3 h-3 mr-1" /> En Vivo</> : <><Play className="w-3 h-3 mr-1" /> Reanudar</>}
              </Button>
            </div>
          )}
        </div>
        
        <div className="bg-gray-100 p-1 rounded-xl flex shadow-inner">
          <button onClick={() => setActiveTab('config')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'config' ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}>
            <Settings className="w-4 h-4" /> Configuración
          </button>
          <button onClick={() => setActiveTab('monitor')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'monitor' ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}>
            <BarChart3 className="w-4 h-4" /> Historial y Ranking
          </button>
        </div>
      </div>

      {/* VISTA 1: CONFIGURACIÓN */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 gap-4 animate-in fade-in zoom-in-95 duration-300">
          {levels.map((lvl) => (
            <Card key={lvl.id} className={`border-l-4 ${lvl.reward_text ? 'border-l-emerald-500' : 'border-l-gray-300'} shadow-sm`}>
              <CardContent className="p-5 flex flex-col md:flex-row gap-6 items-start">
                <div className="flex flex-col items-center md:w-32 flex-shrink-0 text-center">
                  <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-xl font-black text-emerald-600 mb-2 shadow-sm">{lvl.level}</div>
                  <Badge variant="secondary" className="mt-1 bg-emerald-100 text-emerald-700">{lvl.min_points} pts</Badge>
                  {lvl.reward_image_path && editingId !== lvl.id && <img src={lvl.reward_image_path} alt="premio" className="w-12 h-12 mt-3 object-contain" />}
                </div>
                <div className="flex-1 w-full">
                  {editingId === lvl.id ? (
                    <div className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-200">
                      <div className="grid grid-cols-2 gap-3">
                        <Input type="number" value={formData.min_points} onChange={e => setFormData({...formData, min_points: e.target.value})} placeholder="Puntos" className="bg-white" />
                        <Input value={formData.reward_text} onChange={e => setFormData({...formData, reward_text: e.target.value})} placeholder="Nombre Premio" className="bg-white" />
                      </div>
                      <Textarea value={formData.reward_message} onChange={e => setFormData({...formData, reward_message: e.target.value})} placeholder="Mensaje" className="bg-white" />
                      <Input type="file" onChange={e => setImageFile(e.target.files?.[0] || null)} className="bg-white" />
                      <div className="flex justify-end gap-2 pt-2">
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
                        <Button size="sm" onClick={() => handleSaveConfig(lvl.id)} disabled={loadingSave} className="bg-emerald-600"><Save className="w-4 h-4 mr-2" /> Guardar</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center h-full pl-2">
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">{lvl.reward_text ? `🎁 ${lvl.reward_text}` : <span className="text-gray-400 italic">Sin premio</span>}</h3>
                        <p className="text-sm text-gray-500 mt-1">{lvl.reward_message || "Sin mensaje"}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => startEditing(lvl)}>Configurar</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* VISTA 2: MONITORIZACIÓN */}
      {activeTab === 'monitor' && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
                <CardContent className="p-6 flex justify-between items-start">
                   <div>
                      <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Total Usuarios</p>
                      <h3 className="text-3xl font-bold mt-1">{pagination?.total || 0}</h3>
                      {stats.newThisMonth > 0 && <div className="mt-2 inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded text-[10px]"><TrendingUp className="w-3 h-3" /> +{stats.newThisMonth} nuevos</div>}
                   </div>
                   <div className="p-2 bg-white/20 rounded-lg"><Users className="w-5 h-5 text-white" /></div>
                </CardContent>
             </Card>
             <Card className="border shadow-sm">
                <CardContent className="p-6 flex justify-between items-start">
                   <div>
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Saldo Visible</p>
                      <h3 className="text-3xl font-bold mt-1 text-gray-800">S/ {stats.totalMoney.toFixed(2)}</h3>
                   </div>
                   <div className="p-2 bg-blue-50 rounded-lg"><Wallet className="w-5 h-5 text-blue-600" /></div>
                </CardContent>
             </Card>
          </div>

          {/* BARRA DE FILTROS Y BÚSQUEDA */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-3 rounded-xl border shadow-sm">
              {/* Buscador */}
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border w-full md:w-64">
                <Search className="w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Buscar usuario..." 
                  className="border-0 bg-transparent focus-visible:ring-0 p-0 h-auto text-sm" 
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                />
              </div>

              {/* Botones de Filtro por Nivel */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <FilterButton label="Todos" value="all" isActive={filterLevel === 'all'} colorClass="bg-gray-800 text-white" onClick={() => handleFilterChange('all')} />
                <FilterButton label="Sin Rango" value="0" isActive={filterLevel === '0'} colorClass="bg-gray-200 text-gray-700" onClick={() => handleFilterChange('0')} />
                <FilterButton label="Nivel 1" value="1" isActive={filterLevel === '1'} colorClass="bg-emerald-100 text-emerald-700" onClick={() => handleFilterChange('1')} />
                <FilterButton label="Nivel 2" value="2" isActive={filterLevel === '2'} colorClass="bg-emerald-200 text-emerald-800" onClick={() => handleFilterChange('2')} />
                <FilterButton label="Nivel 3" value="3" isActive={filterLevel === '3'} colorClass="bg-emerald-300 text-emerald-900" onClick={() => handleFilterChange('3')} />
                <FilterButton label="Nivel 4" value="4" isActive={filterLevel === '4'} colorClass="bg-emerald-400 text-emerald-950" onClick={() => handleFilterChange('4')} />
                <FilterButton label="Nivel 5+" value="5" isActive={filterLevel === '5'} colorClass="bg-emerald-500 text-white" onClick={() => handleFilterChange('5')} />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-100 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-4">Usuario</th>
                      <th className="px-6 py-4">Puntos Acumulados</th>
                      <th className="px-6 py-4">Nivel Estimado</th>
                      <th className="px-6 py-4">Saldo Disponible</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loadingHistory ? (
                      <tr><td colSpan={4} className="p-12 text-center text-gray-400"><RefreshCw className="animate-spin w-8 h-8 mx-auto mb-2 opacity-50" /> Cargando datos...</td></tr>
                    ) : users.length === 0 ? (
                      <tr><td colSpan={4} className="p-12 text-center text-gray-400">No hay usuarios en este nivel</td></tr>
                    ) : (
                      users.map((u) => {
                        let userLevel = 0;
                        if (u.accumulated_points >= 5000) userLevel = 5;
                        else if (u.accumulated_points >= 4000) userLevel = 4;
                        else if (u.accumulated_points >= 3000) userLevel = 3;
                        else if (u.accumulated_points >= 2000) userLevel = 2;
                        else if (u.accumulated_points >= 1000) userLevel = 1;
                        const progress = Math.min((u.accumulated_points / 5000) * 100, 100);

                        return (
                          <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 border border-gray-100">
                                  <AvatarFallback className={`text-xs font-bold ${userLevel > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {u.username.substring(0,2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div><div className="font-bold text-gray-800">{u.username}</div><div className="text-xs text-gray-400">{u.email}</div></div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="w-full max-w-[140px]">
                                <div className="flex justify-between text-xs mb-1 font-medium"><span className={userLevel > 0 ? "text-emerald-600" : "text-gray-500"}>{u.accumulated_points} pts</span><span className="text-gray-300">5k</span></div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ease-out ${userLevel > 0 ? 'bg-emerald-500' : 'bg-gray-300'}`} style={{ width: `${progress}%` }}></div></div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {userLevel > 0 ? <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">Nivel {userLevel}</Badge> : <span className="text-gray-400 text-xs italic">Sin rango</span>}
                            </td>
                            <td className="px-6 py-4 font-bold text-gray-700">S/ {Number(u.atipay_money).toFixed(2)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {pagination && pagination.last_page > 1 && (
                <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <span className="text-xs text-gray-500">Página {pagination.current_page} de {pagination.last_page}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={!pagination.prev_page_url} onClick={() => setPage(p => p - 1)} className="bg-white"><ArrowLeft className="w-4 h-4 mr-1" /> Anterior</Button>
                    <Button variant="outline" size="sm" disabled={!pagination.next_page_url} onClick={() => setPage(p => p + 1)} className="bg-white">Siguiente <ArrowRight className="w-4 h-4 ml-1" /></Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}