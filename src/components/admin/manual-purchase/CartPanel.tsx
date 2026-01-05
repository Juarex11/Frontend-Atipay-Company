import React, { useState, useRef, useEffect } from 'react';
import { Users, ChevronDown, ShoppingBag, X, Award, Info, Banknote, Wallet, ArrowRight, Send } from 'lucide-react';
import type { User, CartItem } from './types';

interface CartPanelProps {
    users: User[];
    selectedUser: string;
    onSelectUser: (userId: string) => void;
    cart: CartItem[];
    onRemoveItem: (itemId: string) => void;
    totalMoney: number;
    totalPoints: number;
    paymentMethod: 'cash' | 'wallet';
    setPaymentMethod: (method: 'cash' | 'wallet') => void;
    onSubmit: () => void;
    onSendToStore: () => void;
    loading: boolean;
    errorMsg: string | null;
    successMsg: string | null;
}

export const CartPanel: React.FC<CartPanelProps> = ({
    users, selectedUser, onSelectUser, cart, onRemoveItem, 
    totalMoney, totalPoints, paymentMethod, setPaymentMethod, 
    onSubmit, onSendToStore,
    loading, errorMsg, successMsg
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredUsers = users.filter(user => {
        const term = userSearchTerm.toLowerCase();
        return (
            user.username.toLowerCase().includes(term) || 
            (user.email && user.email.toLowerCase().includes(term)) ||
            (user.phone_number && user.phone_number.includes(term))
        );
    });

    const selectedUserData = users.find(u => u.id.toString() === selectedUser);
    const userBalance = selectedUserData?.atipay_money || 0;
    const hasEnoughBalance = !selectedUserData || paymentMethod === 'cash' || userBalance >= totalMoney;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="space-y-6">
            {/* CLIENTE DROPDOWN */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 relative z-30">
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Users className="w-4 h-4"/> Cliente</h3>
                
                <div className="relative" ref={dropdownRef}>
                    <div onClick={() => setIsOpen(!isOpen)} className={`w-full border rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-green-400 transition-colors ${!selectedUser ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                        <span className={`text-sm ${selectedUser ? 'font-bold text-gray-800' : 'text-red-400'}`}>
                            {selectedUser ? selectedUserData?.username : "Seleccionar Cliente..."}
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>

                    {isOpen && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                            <div className="p-2 bg-gray-50 border-b">
                                <input type="text" className="w-full text-sm p-2 border rounded-lg focus:outline-none focus:border-green-500" placeholder="Buscar usuario o teléfono..." autoFocus value={userSearchTerm} onChange={e => setUserSearchTerm(e.target.value)} />
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                                {filteredUsers.length > 0 ? filteredUsers.map(u => (
                                    <div key={u.id} onClick={() => {onSelectUser(u.id.toString()); setIsOpen(false);}} className="px-4 py-3 hover:bg-green-50 cursor-pointer border-b border-gray-50 last:border-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{u.username}</p>
                                                <p className="text-xs text-gray-500">{u.email}</p>
                                                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">{u.phone_number || 'Sin Celular'}</p>
                                            </div>
                                            <span className="text-xs font-mono font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">S/ {(u.atipay_money || 0).toFixed(2)}</span>
                                        </div>
                                    </div>
                                )) : <p className="p-4 text-xs text-center text-gray-400">No encontrado</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CARRITO Y PAGO */}
            <div className="bg-[#0f172a] rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden ring-4 ring-gray-100">
                <div className="absolute top-0 right-0 w-40 h-40 bg-green-500 rounded-full opacity-20 blur-[50px]"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                        <h3 className="font-bold text-lg flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-green-400"/> Tu Carrito</h3>
                        <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-300">{cart.length} ítems</span>
                    </div>

                    <div className="space-y-3 mb-6 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {cart.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm">Carrito vacío.</div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.id} className="flex justify-between items-start group">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-200 leading-tight">{item.name}</p>
                                        {item.type === 'loose' && <p className="text-[10px] text-gray-500">{item.description}</p>}
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <span className="text-sm font-mono font-bold">S/ {item.price.toFixed(2)}</span>
                                        <span className="text-[10px] text-green-400">+{item.points.toFixed(2)} pts</span>
                                    </div>
                                    <button onClick={() => onRemoveItem(item.id)} className="ml-3 text-gray-600 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Total a Pagar</span>
                            <span className="text-xl font-mono font-bold">S/ {totalMoney.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-white/10">
                            <span className="text-green-400 text-xs font-bold uppercase flex items-center gap-1"><Award className="w-3 h-3" /> Puntos Totales</span>
                            <span className="text-2xl font-extrabold text-white tracking-tight">{totalPoints.toFixed(2)} <span className="text-xs text-gray-500 font-normal">pts</span></span>
                        </div>
                    </div>

                    {/* SELECTOR DE PAGO */}
                    <div className="mt-5 mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Método de Pago</p>
                            <div className="group relative">
                                <Info className="w-3.5 h-3.5 text-gray-500 cursor-help" />
                                <div className="absolute bottom-full right-0 mb-2 w-56 p-3 bg-gray-800 text-[11px] text-gray-300 rounded-lg shadow-xl border border-gray-700 hidden group-hover:block z-50">
                                    <p className="mb-1"><strong className="text-green-400">Efectivo:</strong> El cliente paga fuera del sistema. <span className="text-white">NO descuenta saldo.</span></p>
                                    <p><strong className="text-blue-400">Saldo Virtual:</strong> Se cobra de la billetera del cliente.</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div onClick={() => setPaymentMethod('cash')} className={`cursor-pointer rounded-xl p-3 border transition-all flex flex-col items-center justify-center gap-1 ${paymentMethod === 'cash' ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
                                <Banknote className="w-5 h-5" />
                                <span className="text-[10px] font-bold uppercase">Efectivo</span>
                            </div>
                            <div onClick={() => setPaymentMethod('wallet')} className={`cursor-pointer rounded-xl p-3 border transition-all flex flex-col items-center justify-center gap-1 ${paymentMethod === 'wallet' ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
                                <Wallet className="w-5 h-5" />
                                <span className="text-[10px] font-bold uppercase">Saldo Virtual</span>
                            </div>
                        </div>
                        
                        {paymentMethod === 'wallet' && selectedUser && (
                            <div className={`mt-2 text-xs text-center font-mono py-1 rounded ${hasEnoughBalance ? 'text-blue-300' : 'text-red-300 bg-red-900/20'}`}>
                                Saldo Actual: S/ {userBalance.toFixed(2)} {!hasEnoughBalance && " (Insuficiente)"}
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <button 
                            onClick={onSubmit} 
                            disabled={loading || cart.length === 0 || (!hasEnoughBalance && paymentMethod === 'wallet')} 
                            className={`w-full py-4 rounded-xl font-bold text-black flex justify-center items-center gap-2 transition-all
                            ${loading || cart.length === 0 || (!hasEnoughBalance && paymentMethod === 'wallet') ? 'bg-gray-600 cursor-not-allowed text-gray-400' : 'bg-green-400 hover:bg-green-500 shadow-lg shadow-green-500/20'}`}
                        >
                            {loading ? 'Procesando...' : <>Confirmar Venta Ya <ArrowRight className="w-4 h-4"/></>}
                        </button>

                        <button 
                            onClick={onSendToStore}
                            disabled={loading || cart.length === 0 || !selectedUser}
                            className={`w-full py-4 rounded-xl font-bold border-2 flex justify-center items-center gap-2 transition-all
                                ${loading || cart.length === 0 || !selectedUser
                                    ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                                    : 'border-blue-500 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400'
                                }`}
                        >
                            <Send className="w-4 h-4"/> Crear Pack para Usuario (Enviar a Tienda)
                        </button>
                    </div>

                    {errorMsg && <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-xs text-center">{errorMsg}</div>}
                    {successMsg && <div className="mt-3 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-200 text-xs text-center">{successMsg}</div>}
                </div>
            </div>
        </div>
    );
};