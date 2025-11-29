import { useEffect, useState } from 'react';
import { Target, TrendingUp, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

// Usamos la variable de entorno
const API_URL = import.meta.env.VITE_API_URL;

export default function UserPointsCard() {
    const [data, setData] = useState({
        current_points: 0,
        min_points: 0,
        qualified: false,
        loading: true,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });

    const [daysLeft, setDaysLeft] = useState(0);

    useEffect(() => {
        // 1. Calcular días restantes del mes
        const today = new Date();
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const remaining = Math.ceil((lastDayOfMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        setDaysLeft(remaining);

        // 2. Obtener datos de la API
        const fetchPoints = async () => {
            try {
                const token = localStorage.getItem('token') || localStorage.getItem('auth_token'); 
                
                const response = await fetch(`${API_URL}/my-monthly-status`, {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) throw new Error('Error de conexión');
                
                const result = await response.json();
                setData({ ...result, loading: false });
            } catch (error) {
                console.error("Error:", error);
                setData(prev => ({ ...prev, loading: false }));
            }
        };

        fetchPoints();
    }, []);

    // Cálculo del porcentaje para la barra (máximo 100%)
    const progressPercentage = Math.min((data.current_points / (data.min_points || 1)) * 100, 100);

    if (data.loading) return (
        <div className="w-full h-32 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse p-6">
            <div className="h-4 bg-gray-100 rounded w-1/4 mb-4"></div>
            <div className="h-8 bg-gray-100 rounded w-1/2"></div>
        </div>
    );

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-6 transition-all duration-300 hover:shadow-md">
            
            {/* --- ENCABEZADO --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        Estado de Calificación
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Ciclo: {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-600">
                        Cierre en <span className="text-emerald-600 font-bold">{daysLeft} días</span>
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                
                {/* --- PUNTOS --- */}
                <div className="col-span-1">
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-gray-900 tracking-tight">
                            {data.current_points}
                        </span>
                        <span className="text-sm font-medium text-gray-400">pts</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium mt-1">Puntos de Red Acumulados</p>
                </div>

                {/* --- BARRA Y MENSAJE --- */}
                <div className="col-span-1 md:col-span-2">
                    <div className="flex justify-between text-xs font-medium mb-2">
                        <span className={`${data.qualified ? 'text-emerald-600' : 'text-gray-500'}`}>
                            Progreso: {Math.round(progressPercentage)}%
                        </span>
                        <span className="text-gray-400 flex items-center gap-1">
                            <Target className="w-3 h-3" /> Meta: {data.min_points} pts
                        </span>
                    </div>
                    
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mb-4">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                data.qualified 
                                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                                    : 'bg-gradient-to-r from-amber-400 to-orange-400'
                            }`}
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>

                    {/* --- MENSAJE DE ESTADO ACTUALIZADO --- */}
                    <div className="mt-2">
                        {data.qualified ? (
                            <div className="flex items-center p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100">
                                <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0 text-emerald-600" />
                                <span className="text-sm font-medium">
                                    ¡Calificado! Tu opción de retiro está <b>habilitada</b>.
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center p-3 rounded-lg bg-amber-50 text-amber-800 border border-amber-100">
                                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 text-amber-600" />
                                <span className="text-sm font-medium">
                                    No calificas para retiros. Te faltan <b>{data.min_points - data.current_points}</b> puntos.
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}