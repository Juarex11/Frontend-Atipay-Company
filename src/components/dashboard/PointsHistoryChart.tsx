import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

interface MonthData {
    month: number;
    name: string;
    points: number;
    qualified: boolean;
}

export default function PointsHistoryChart() {
    const [history, setHistory] = useState<MonthData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token =
                    localStorage.getItem('token') ||
                    localStorage.getItem('auth_token');

                const response = await fetch(`${API_URL}/my-points-history`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setHistory(data);
                } else {
                    console.error('Error cargando historial: No autorizado');
                }
            } catch (error) {
                console.error('Error cargando historial:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const maxPoints = Math.max(...history.map((h) => h.points), 120);

    if (loading)
        return (
            <div className="w-full h-64 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse p-6">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-10"></div>
                <div className="flex justify-between items-end h-32 gap-2">
                    {[...Array(12)].map((_, i) => (
                        <div
                            key={i}
                            className="w-full bg-gray-200 rounded-t h-full opacity-30"
                        ></div>
                    ))}
                </div>
            </div>
        );

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-emerald-600" />
                        Rendimiento Anual
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 ml-7">
                        Tus puntos mes a mes durante el{' '}
                        {new Date().getFullYear()}
                    </p>
                </div>
                <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Total Año:{' '}
                    {history.reduce((acc, curr) => acc + curr.points, 0)} pts
                </div>
            </div>

            <div className="flex items-end justify-between h-48 gap-2 sm:gap-3">
                {history.map((item, index) => {
                    const heightPercent = (item.points / maxPoints) * 100;
                    const isGreen = item.points >= 76;

                    return (
                        <div
                            key={index}
                            className="flex flex-col items-center flex-1 group relative h-full justify-end"
                        >
                            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-gray-900 text-white text-[10px] py-1 px-2 rounded transform -translate-y-1 pointer-events-none z-10 shadow-lg whitespace-nowrap">
                                {item.name}:{' '}
                                <span className="font-bold text-emerald-400">
                                    {item.points} pts
                                </span>
                                <div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                            </div>

                            {item.points > 0 && (
                                <span
                                    className={`text-[10px] mb-1 font-bold ${
                                        isGreen
                                            ? 'text-emerald-600'
                                            : 'text-gray-400'
                                    }`}
                                >
                                    {item.points}
                                </span>
                            )}

                            <div
                                className={`w-full max-w-[24px] rounded-t-sm transition-all duration-700 ease-out hover:brightness-110 cursor-pointer relative overflow-hidden ${
                                    isGreen
                                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_4px_12px_rgba(16,185,129,0.3)]'
                                        : 'bg-gradient-to-t from-gray-300 to-gray-200'
                                }`}
                                style={{
                                    height: `${
                                        heightPercent > 2 ? heightPercent : 2
                                    }%`,
                                }}
                            >
                                <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/30"></div>
                            </div>

                            <span
                                className={`text-[10px] mt-2 font-medium uppercase tracking-wide ${
                                    new Date().getMonth() + 1 === item.month
                                        ? 'text-emerald-700 font-bold bg-emerald-50 px-1 rounded'
                                        : 'text-gray-400'
                                }`}
                            >
                                {item.name.substring(0, 3)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
