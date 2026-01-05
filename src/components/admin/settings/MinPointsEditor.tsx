import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast'; // Importamos la librería
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
        // Validación: Si está vacío mostramos error
        if (!points) {
            toast.error('El campo no puede estar vacío', {
                style: {
                    border: '1px solid #FEE2E2',
                    padding: '16px',
                    color: '#1F2937',
                },
                iconTheme: {
                    primary: '#EF4444',
                    secondary: '#FFFAEE',
                },
            });
            return;
        }
        
        setIsSaving(true);
        const result = await AdminSystemService.updateMinPointsSetting(Number(points));
        setIsSaving(false);

        if (result.success) {
            // ✅ ESTILO ATIPAY (Igual a tu imagen)
            toast.success('Meta actualizada correctamente', {
                duration: 4000,
                position: 'bottom-right', // Abajo a la derecha
                style: {
                    background: '#fff',
                    color: '#333',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)', // Sombra elegante
                    fontWeight: 500,
                    fontSize: '14px',
                    fontFamily: 'inherit'
                },
                // Configuración para el icono NEGRO con check BLANCO
                iconTheme: {
                    primary: '#000000', 
                    secondary: '#FFFFFF', 
                },
            });
        } else {
            toast.error(result.message);
        }
    };

    if (isLoading) return <div className="text-sm text-gray-500 animate-pulse">Cargando configuración...</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 relative">
            {/* El Toaster renderiza las notificaciones. 
                NOTA: Idealmente esto va en tu App.tsx principal para no repetirlo, 
                pero poniéndolo aquí funciona perfecto para este módulo.
            */}
            <Toaster position="bottom-right" reverseOrder={false} />

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
                        <span className="absolute right-3 top-2 text-xs text-gray-400 font-bold mt-0.5 pointer-events-none">PTS</span>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`px-4 py-2 rounded-md text-white font-medium transition-all ${
                            isSaving 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700 hover:shadow-lg active:scale-95'
                        }`}
                    >
                        {isSaving ? 'Guardando...' : 'Actualizar'}
                    </button>
                </div>
            </div>
        </div>
    );
};