import { useState, useEffect } from 'react';
import api from '@/services/api';
import { toast } from '@/components/ui/use-toast';

export default function QualificationSettings() {
    const [points, setPoints] = useState(100);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                const response = await api.get('/admin/qualification/settings');
                setPoints(response.data.min_points || 100);
                setError(null);
            } catch (err) {
                console.error('Error fetching settings:', err);
                setError('No se pudieron cargar las configuraciones');
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'No se pudieron cargar las configuraciones'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSave = async () => {
        if (points < 0) {
            setError('Los puntos no pueden ser negativos');
            return;
        }

        setSaving(true);
        try {
            // Si recibe 403, significa token expirado - recargar página para renovar
            const response = await api.post('/admin/qualification/update', { points });
            
            if (response.status === 403) {
                setError('Sesión expirada. Recargando...');
                setTimeout(() => window.location.reload(), 1500);
                return;
            }

            setError(null);
            
            // Recargar los datos desde el servidor para sincronizar estado
            const settingsResponse = await api.get('/admin/qualification/settings');
            setPoints(settingsResponse.data.min_points || 100);
            
            toast({
                title: 'Éxito',
                description: `Puntos mínimos actualizados a ${points}`
            });
            // Emitir evento a otras ventanas/pestañas indicando que la configuración cambió
            try {
                localStorage.setItem('qualification_min_points_update', JSON.stringify({ points, ts: Date.now() }));
            } catch (e) {
                console.warn('No se pudo escribir en localStorage para sincronizar cambios', e);
            }
        } catch (error: any) {
            console.error('Error saving settings:', error);
            
            // Si es 403, sesión expirada
            if (error.status === 403 || error.message?.includes('403')) {
                setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
                setTimeout(() => window.location.reload(), 2000);
            } else {
                setError('Error al guardar la configuración');
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Error al guardar la configuración'
                });
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100 mt-6">
                <div className="flex items-center justify-center h-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 mt-6">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-800">📊 Calificación Mensual</h3>
                <p className="text-sm text-gray-600 mt-1">Configura los puntos mínimos que cada socio debe alcanzar para calificar</p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                    {error}
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <div className="w-full sm:max-w-xs">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Puntos Mínimos Requeridos
                    </label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" 
                            value={points}
                            onChange={(e) => setPoints(Math.max(0, Number(e.target.value)))}
                            disabled={saving}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-500"
                            min="0"
                        />
                        <span className="text-gray-500 font-medium whitespace-nowrap">puntos</span>
                    </div>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full sm:w-auto bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs text-blue-800">
                    <strong>ℹ️ Nota:</strong> Con esta configuración, solo los socios que alcancen <strong>{points} puntos</strong> en el mes podrán retirar comisiones.
                </p>
            </div>
        </div>
    );
}