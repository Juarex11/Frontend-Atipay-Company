import React, { useState, useEffect } from 'react';
// IMPORTANTE: Asegúrate de que la ruta de importación coincida con donde creaste el servicio
import { AdminSystemService } from '../../../services/adminSystemService'; 

export const MinPointsEditor: React.FC = () => {
    const [points, setPoints] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            const result = await AdminSystemService.getMinPointsSetting();
            if (result.success) {
                setPoints(result.value.toString());
            }
            setIsLoading(false);
        };
        loadSettings();
    }, []);

    const handleSave = async () => {
        if (!points) return;
        
        setIsSaving(true);
        const result = await AdminSystemService.updateMinPointsSetting(Number(points));
        setIsSaving(false);

        if (result.success) {
            alert('✅ Meta actualizada correctamente'); 
        } else {
            alert('❌ ' + result.message);
        }
    };

    if (isLoading) return <div className="text-sm text-gray-500">Cargando configuración...</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="max-w-md">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-xl">🏆</span> Meta de Calificación Mensual
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Define cuántos puntos de red necesita un socio para calificar a comisiones.
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="relative">
                        <input
                            type="number"
                            value={points}
                            onChange={(e) => setPoints(e.target.value)}
                            className="w-32 pl-4 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700 text-center"
                            placeholder="0"
                        />
                        <span className="absolute right-3 top-2 text-xs text-gray-400 font-bold mt-0.5">PTS</span>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
                            isSaving 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700 shadow-md'
                        }`}
                    >
                        {isSaving ? 'Guardando...' : 'Actualizar'}
                    </button>
                </div>
            </div>
        </div>
    );
};