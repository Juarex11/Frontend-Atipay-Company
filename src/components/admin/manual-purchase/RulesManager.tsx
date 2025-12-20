import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, X, Save, Power, AlertTriangle } from 'lucide-react';
import { getConversionRules, createConversionRule, updateConversionRule, deleteConversionRule, type ConversionRule } from '../../../services/adminPurchaseService';

interface RulesManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onRulesChanged: () => void;
}

export const RulesManager: React.FC<RulesManagerProps> = ({ isOpen, onClose, onRulesChanged }) => {
    const [rules, setRules] = useState<ConversionRule[]>([]);
    const [loading, setLoading] = useState(false);

    // Estado para formulario
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: '', amount_required: '', points_awarded: '' });

    // Estado para el modal de confirmación de borrado
    const [ruleToDelete, setRuleToDelete] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) loadRules();
    }, [isOpen]);

    const loadRules = async () => {
        setLoading(true);
        const data = await getConversionRules(false); 
        setRules(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.amount_required || !formData.points_awarded) return;

        try {
            const payload = {
                name: formData.name,
                amount_required: parseFloat(formData.amount_required),
                points_awarded: parseFloat(formData.points_awarded),
                is_active: true
            };

            if (editingId) {
                await updateConversionRule(editingId, payload);
            } else {
                await createConversionRule(payload);
            }

            setFormData({ name: '', amount_required: '', points_awarded: '' });
            setEditingId(null);
            await loadRules();
            onRulesChanged(); 
        } catch (error) {
            console.error(error);
            alert("Error al guardar regla");
        }
    };

    const handleEdit = (rule: ConversionRule) => {
        setEditingId(rule.id);
        setFormData({
            name: rule.name,
            amount_required: rule.amount_required.toString(),
            points_awarded: rule.points_awarded.toString()
        });
    };

    // Solo abre el modal de confirmación
    const handleDelete = (id: number) => {
        setRuleToDelete(id); 
    };

    // Confirma el borrado
    const confirmDelete = async () => {
        if (ruleToDelete === null) return;
        await deleteConversionRule(ruleToDelete);
        setRuleToDelete(null);
        await loadRules();
        onRulesChanged();
    };

    const toggleActive = async (rule: ConversionRule) => {
        await updateConversionRule(rule.id, { is_active: !rule.is_active });
        await loadRules();
        onRulesChanged();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
                
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Gestionar Reglas de Conversión</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X /></button>
                </div>

                {/* Body scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                        <h3 className="text-sm font-bold text-gray-700">{editingId ? 'Editar Regla' : 'Nueva Regla'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input 
                                placeholder="Nombre (Ej: Abarrotes)" 
                                className="border p-2 rounded-lg text-sm"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                            <div className="flex items-center gap-2 bg-white border p-2 rounded-lg">
                                <span className="text-gray-400 text-xs">S/</span>
                                <input 
                                    type="number" step="0.01" placeholder="Monto" 
                                    className="w-full outline-none text-sm"
                                    value={formData.amount_required}
                                    onChange={e => setFormData({...formData, amount_required: e.target.value})}
                                />
                            </div>
                            <div className="flex items-center gap-2 bg-white border p-2 rounded-lg">
                                <span className="text-gray-400 text-xs">Pts</span>
                                <input 
                                    type="number" step="0.01" placeholder="Puntos" 
                                    className="w-full outline-none text-sm"
                                    value={formData.points_awarded}
                                    onChange={e => setFormData({...formData, points_awarded: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            {editingId && <button type="button" onClick={() => {setEditingId(null); setFormData({name:'', amount_required:'', points_awarded:''})}} className="px-3 py-2 text-xs text-gray-500 hover:bg-gray-200 rounded-lg">Cancelar</button>}
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2">
                                <Save className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Guardar Regla'}
                            </button>
                        </div>
                    </form>

                    {/* Tabla de Reglas */}
                    <div className="space-y-2">
                        {loading ? <p className="text-center text-gray-400">Cargando...</p> : 
                         rules.length === 0 ? <p className="text-center text-gray-400">No hay reglas creadas.</p> :
                         rules.map(rule => (
                            <div key={rule.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${rule.is_active ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-200 opacity-75'}`}>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-800">{rule.name}</span>
                                        {!rule.is_active && <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] rounded-full font-bold">INACTIVA</span>}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Por cada <strong className="text-gray-700">S/ {Number(rule.amount_required).toFixed(2)}</strong> das <strong className="text-green-600">+{Number(rule.points_awarded).toFixed(2)} pts</strong>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => toggleActive(rule)} title={rule.is_active ? "Desactivar" : "Activar"} className={`p-2 rounded-lg ${rule.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-200'}`}>
                                        <Power className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleEdit(rule)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4"/></button>
                                    <button onClick={() => handleDelete(rule.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- MODAL DE CONFIRMACIÓN DE BORRADO --- */}
                {ruleToDelete !== null && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white p-6 rounded-2xl w-full max-w-sm text-center relative shadow-2xl animate-in fade-in zoom-in-95 border-4 border-red-50">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-red-50">
                                <AlertTriangle className="w-6 h-6 text-red-600"/>
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 mb-2">¿Estás seguro?</h3>
                            <p className="text-sm text-gray-500 mb-6">Esta regla se eliminará permanentemente. Esta acción no se puede deshacer.</p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={confirmDelete} 
                                    className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200/50"
                                >
                                    Sí, borrar regla
                                </button>
                                <button 
                                    onClick={() => setRuleToDelete(null)} 
                                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-colors border border-gray-200"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};