// src/components/admin/manual-purchase/CatalogPanel.tsx
import React, { useState } from 'react';
import { Search, Plus, Package, Calculator, AlertCircle } from 'lucide-react';
import { CONVERSION_RULES, safeParseFloat } from './types';
import type { Product } from './types';

interface CatalogPanelProps {
    products: Product[];
    loading: boolean;
    onAddProduct: (product: Product) => void;
    onAddLooseItem: (amount: number, desc: string, ruleId: string) => void;
}

export const CatalogPanel: React.FC<CatalogPanelProps> = ({ products, loading, onAddProduct, onAddLooseItem }) => {
    const [activeTab, setActiveTab] = useState<'products' | 'calculator'>('products');
    const [prodSearch, setProdSearch] = useState('');
    
    // Estados locales de la calculadora
    const [calcAmount, setCalcAmount] = useState('');
    const [calcDesc, setCalcDesc] = useState('');
    const [selectedRule, setSelectedRule] = useState(CONVERSION_RULES[0].id);

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(prodSearch.toLowerCase())
    );

    const handleAddLoose = () => {
        const amount = safeParseFloat(calcAmount);
        if (amount <= 0 || !calcDesc.trim()) {
            alert("Ingresa monto y descripción");
            return;
        }
        onAddLooseItem(amount, calcDesc, selectedRule);
        setCalcAmount('');
        setCalcDesc('');
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
            {/* TABS */}
            <div className="flex border-b border-gray-100">
                <button onClick={() => setActiveTab('products')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'products' ? 'bg-white text-green-600 border-b-2 border-green-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                    <Package className="w-4 h-4" /> Packs y Productos (BD)
                </button>
                <button onClick={() => setActiveTab('calculator')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'calculator' ? 'bg-white text-green-600 border-b-2 border-green-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                    <Calculator className="w-4 h-4" /> Abarrotes / Sueltos
                </button>
            </div>

            <div className="p-6">
                {/* VISTA 1: PRODUCTOS */}
                {activeTab === 'products' && (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input type="text" placeholder="Buscar pack..." className="w-full pl-9 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-sm" value={prodSearch} onChange={(e) => setProdSearch(e.target.value)} />
                        </div>

                        {loading ? (
                            <div className="text-center py-10 text-gray-400 text-sm">Cargando catálogo...</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
                                {filteredProducts.length > 0 ? filteredProducts.map(product => {
                                    const safePrice = safeParseFloat(product.price);
                                    let displayPoints = safeParseFloat(product.points);
                                    if (displayPoints === 0 && safePrice > 0) displayPoints = (safePrice * 100) / 300;

                                    return (
                                        <div key={product.id} onClick={() => onAddProduct(product)} className="border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-green-200 transition-all flex justify-between items-center group cursor-pointer">
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-sm group-hover:text-green-700 truncate max-w-[150px]">{product.name}</h4>
                                                <p className="text-xs text-gray-500 mt-1">Gana: <span className="font-bold text-yellow-600">{displayPoints.toFixed(2)} pts</span></p>
                                            </div>
                                            <div className="text-right">
                                                <span className="block font-mono font-bold text-gray-900">S/ {safePrice.toFixed(2)}</span>
                                                <button className="mt-2 bg-green-50 text-green-700 p-1.5 rounded-lg hover:bg-green-100"><Plus className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    );
                                }) : <div className="col-span-full text-center py-8 text-gray-400 text-sm">No se encontraron productos.</div>}
                            </div>
                        )}
                    </div>
                )}

                {/* VISTA 2: CALCULADORA */}
                {activeTab === 'calculator' && (
                    <div className="space-y-6 py-4">
                        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
                            <p className="text-xs text-yellow-700">Para venta a granel. Selecciona la regla de puntos.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">1. Regla de Conversión</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {CONVERSION_RULES.map(rule => (
                                    <div key={rule.id} onClick={() => setSelectedRule(rule.id)} className={`border rounded-xl p-3 cursor-pointer transition-all text-center ${selectedRule === rule.id ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'border-gray-200 hover:border-green-300'}`}>
                                        <p className="text-xs font-bold text-gray-800">{rule.name}</p>
                                        <p className="text-[10px] text-gray-500 mt-1">S/ {rule.factor} = {rule.points} pts</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">2. Descripción</label>
                                <input type="text" className="w-full border rounded-xl px-3 py-3 text-sm focus:border-green-500 outline-none" placeholder="Ej: Arroz" value={calcDesc} onChange={(e) => setCalcDesc(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">3. Monto (S/)</label>
                                <input type="number" className="w-full border rounded-xl px-3 py-3 text-sm font-mono font-bold focus:border-green-500 outline-none" placeholder="0.00" value={calcAmount} onChange={(e) => setCalcAmount(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddLoose()} />
                            </div>
                        </div>
                        <button onClick={handleAddLoose} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" /> Agregar al Carrito
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};