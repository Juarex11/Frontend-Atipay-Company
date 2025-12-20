import React, { useState, useEffect } from 'react';
import { X, Trash2, Package, AlertTriangle } from 'lucide-react';
import { getPacks, deletePack, type Pack } from '../../../services/adminPurchaseService';

interface PackManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onPackChanged: () => void; // Para avisar que recargue productos
}

export const PackManager: React.FC<PackManagerProps> = ({ isOpen, onClose, onPackChanged }) => {
    const [packs, setPacks] = useState<Pack[]>([]);
    const [loading, setLoading] = useState(false);
    const [packToDelete, setPackToDelete] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) loadPacks();
    }, [isOpen]);

    const loadPacks = async () => {
        setLoading(true);
        const data = await getPacks();
        setPacks(data);
        setLoading(false);
    };

    const confirmDelete = async () => {
        if (!packToDelete) return;
        try {
            await deletePack(packToDelete);
            setPackToDelete(null);
            await loadPacks();
            onPackChanged(); // Avisamos para recargar la vista principal
        } catch (error) {
            console.error(error); // <--- CORRECCIÓN: Usamos la variable error para que no se queje
            alert("Error al eliminar pack");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
                
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Package className="w-5 h-5 text-purple-600"/> Mis Packs Creados
                    </h2>
                    <button onClick={onClose}><X className="text-gray-400 hover:text-gray-600"/></button>
                </div>

                {/* Lista */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loading ? <p className="text-center text-gray-400">Cargando...</p> : 
                     packs.length === 0 ? (
                        <div className="text-center py-10">
                            <Package className="w-12 h-12 text-gray-200 mx-auto mb-2"/>
                            <p className="text-gray-400">No hay packs creados aún.</p>
                        </div>
                     ) : (
                        packs.map(pack => (
                            <div key={pack.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all bg-white group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{pack.name}</h3>
                                        <div className="flex gap-2 mt-1 text-xs text-gray-500">
                                            <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md font-bold">
                                                Regla: S/ {Number(pack.conversion_factor_money).toFixed(2)} = {Number(pack.conversion_factor_points).toFixed(2)} pts
                                            </span>
                                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                                                Total Pack: {Number(pack.total_pack_points).toFixed(2)} pts
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setPackToDelete(pack.id)}
                                        className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                        title="Disolver Pack"
                                    >
                                        <Trash2 className="w-5 h-5"/>
                                    </button>
                                </div>

                                {/* Productos dentro */}
                                <div className="mt-4 pt-3 border-t border-gray-100">
                                    <p className="text-xs font-bold text-gray-400 mb-2">PRODUCTOS INCLUIDOS:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {pack.products?.map(prod => (
                                            <span key={prod.id} className="text-xs bg-gray-50 border border-gray-200 px-2 py-1 rounded text-gray-600 flex items-center gap-1">
                                                {prod.name}
                                                <span className="font-bold text-green-600 ml-1">({Number(prod.points_earned).toFixed(2)} pts)</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                     )}
                </div>
            </div>

            {/* Modal Confirmación Borrado */}
            {packToDelete && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 border-4 border-red-50">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-red-50">
                            <AlertTriangle className="w-6 h-6 text-red-600"/>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 mb-2">¿Disolver este Pack?</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Los productos volverán a ser individuales. Sus puntos se mantendrán hasta que los edites.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold hover:bg-red-700 shadow-lg">Sí, Disolver</button>
                            <button onClick={() => setPackToDelete(null)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-200 border">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};