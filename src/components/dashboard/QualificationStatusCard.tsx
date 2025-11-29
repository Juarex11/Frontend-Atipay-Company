import { useState, useEffect } from 'react';
import { Target, TrendingUp, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import api from '@/services/api'; 

interface QualificationData {
    current_points: number;
    required_points: number;
    is_qualified: boolean;
}

export default function QualificationStatusCard() {
    const [data, setData] = useState<QualificationData | null>(null);
    const [daysLeft, setDaysLeft] = useState(0);

    useEffect(() => {
        // Calcular días restantes del mes
        const today = new Date();
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setDaysLeft(Math.ceil((lastDayOfMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

        const fetchData = async () => {
            try {
                const response = await api.get('/user/qualification-status');
                setData(response.data);
            } catch (err: any) {
                console.error('Error:', err);
                if (err?.response?.status === 401 || err?.response?.status === 403) {
                    setTimeout(() => window.location.reload(), 800);
                }
            }
        };

        fetchData();

        // Listener para actualizaciones en tiempo real
        const onStorage = (ev: StorageEvent) => {
            if (ev.key === 'qualification_min_points_update' && ev.newValue) {
                fetchData();
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    if (!data) return (
        <div className="w-full h-32 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse p-6 mb-6">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
    );

    const current = data.current_points || 0;
    const required = data.required_points || 100;
    const progress = Math.min((current / required) * 100, 100);

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-6 transition-all duration-300 hover:shadow-md">
            
            {/* --- ENCABEZADO --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        Estado de Calificación
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 pl-7">
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
                
                {/* --- COLUMNA 1: Puntos Grandes --- */}
                <div className="col-span-1 border-r border-gray-100 pr-4 md:border-r-0 md:pr-0">
                    <div className="flex items-baseline gap-1">
                        <span className={`text-4xl font-extrabold tracking-tight ${data.is_qualified ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {current}
                        </span>
                        <span className="text-sm font-medium text-gray-400">pts</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium mt-1">Puntos de Red Acumulados</p>
                </div>

                {/* --- COLUMNA 2: Barra y Mensaje --- */}
                <div className="col-span-1 md:col-span-2 pl-0 md:pl-4 border-l-0 md:border-l border-gray-100">
                    <div className="flex justify-between text-xs font-medium mb-2">
                        <span className={`${data.is_qualified ? 'text-emerald-600' : 'text-gray-500'}`}>
                            Progreso: {Math.round(progress)}%
                        </span>
                        <span className="text-gray-400 flex items-center gap-1">
                            <Target className="w-3 h-3" /> Meta: {required} pts
                        </span>
                    </div>
                    
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mb-4">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                data.is_qualified 
                                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                                    : 'bg-gradient-to-r from-amber-400 to-orange-400'
                            }`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    {/* Mensaje de Estado */}
                    {data.is_qualified ? (
                        <div className="flex items-center p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 transition-colors duration-300">
                            <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0 text-emerald-600" />
                            <span className="text-sm font-medium">
                                ¡Calificado! Tu opción de retiro está <b>habilitada</b>.
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center p-3 rounded-lg bg-amber-50 text-amber-800 border border-amber-100 transition-colors duration-300">
                            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 text-amber-600" />
                            <span className="text-sm font-medium">
                                No calificas para retiros. Te faltan <b>{required - current}</b> puntos.
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}