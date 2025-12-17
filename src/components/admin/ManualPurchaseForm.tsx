import React, { useState, useEffect, useRef } from 'react';
import { getUsersForSelector, storeManualPurchase } from '../../services/adminPurchaseService';
import { 
    Users, 
    ShoppingBag, 
    CheckCircle2, 
    ArrowRight,
    Search,
    CreditCard,
    Award,
    AlertCircle,
    ChevronDown, 
    Check,
    History,
    Calendar,
    FileText,
    Clock,
    Trash2,
    X 
} from 'lucide-react';

// === CONFIGURACIÓN ===
const ATIPAY_ICON_SRC = "/assets/atipay_logo-moneda.png"; 
const PRESET_AMOUNTS = [20, 50, 100, 300, 500];
const MAX_HISTORY_ITEMS = 50; 
const STORAGE_KEY = 'admin_manual_purchase_history';

interface User {
    id: number;
    username: string; 
    email?: string;
}

interface TransactionLog {
    id: number;
    user_name: string;
    description: string;
    amount: number;
    points: number;
    date: string; 
    time: string; 
}

export const ManualPurchaseForm = () => {
    // Datos y Estados
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    
    // Historial Persistente
    const [history, setHistory] = useState<TransactionLog[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });

    // Estados para el Dropdown
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Estados de UX
    const [simulatedPoints, setSimulatedPoints] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    // Control del Modal
    const [showClearModal, setShowClearModal] = useState(false);

    // 1. Carga de Usuarios
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await getUsersForSelector();
                const usersList = Array.isArray(response) ? response : (response.data || []);
                setUsers(usersList);
            } catch (error) {
                console.error("Error cargando usuarios", error);
                setErrorMessage("Error de conexión al cargar usuarios");
            }
        };
        fetchUsers();
    }, []);

    // 2. Guardar Historial
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }, [history]);

    // 3. Cerrar Dropdown click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleSelectUser = (user: User) => {
        setSelectedUser(user.id.toString());
        setSearchTerm('');
        setIsOpen(false);
    };

    const selectedUserData = users.find(u => u.id.toString() === selectedUser);
    const displayName = selectedUserData ? selectedUserData.username : "Seleccionar Cliente";

    useEffect(() => {
        const val = parseFloat(amount);
        if (!isNaN(val) && val > 0) {
            const points = (val * 100) / 300;
            setSimulatedPoints(points);
        } else {
            setSimulatedPoints(0);
        }
    }, [amount]);

    const confirmClearHistory = () => {
        setHistory([]);
        localStorage.removeItem(STORAGE_KEY);
        setShowClearModal(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage(null);
        setErrorMessage(null);

        if (!selectedUser || !amount || !description) {
            setErrorMessage('Por favor, complete todos los campos obligatorios.');
            setTimeout(() => setErrorMessage(null), 3000);
            return;
        }

        setLoading(true);

        try {
            const result = await storeManualPurchase({
                user_id: parseInt(selectedUser),
                amount: parseFloat(amount),
                description: description
            });

            const earnedPoints = result.points || simulatedPoints;
            const now = new Date();

            const newLog: TransactionLog = {
                id: Date.now(),
                user_name: displayName,
                description: description,
                amount: parseFloat(amount),
                points: earnedPoints,
                date: now.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
                time: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })
            };
            
            setHistory(prev => {
                const newHistory = [newLog, ...prev];
                return newHistory.slice(0, MAX_HISTORY_ITEMS); 
            });

            setSuccessMessage(`¡Transacción exitosa! +${earnedPoints.toFixed(2)} pts.`);
            
            setAmount('');
            setDescription('');
            setSelectedUser('');
            setSimulatedPoints(0);
            
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error: any) {
            setErrorMessage('Error: ' + (error.message || 'Hubo un problema.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-10 min-h-[85vh]">
            
            {/* === MODAL DE CONFIRMACIÓN === */}
            {showClearModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200 border border-gray-100">
                        <div className="p-8 text-center relative">
                            <button 
                                onClick={() => setShowClearModal(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-red-100">
                                <Trash2 className="w-8 h-8 text-red-500" />
                            </div>
                            
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                ¿Borrar historial?
                            </h3>
                            
                            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                                Estás a punto de eliminar todos los registros de la lista local. Esta acción no se puede deshacer.
                            </p>
                            
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={confirmClearHistory}
                                    className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-200 active:scale-[0.98]"
                                >
                                    Sí, borrar todo
                                </button>
                                <button
                                    onClick={() => setShowClearModal(false)}
                                    className="w-full py-3.5 px-4 rounded-xl font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors active:scale-[0.98]"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 hidden sm:block">
                        <img 
                            src={ATIPAY_ICON_SRC} 
                            alt="Atipay" 
                            className="w-8 h-8 object-contain"
                            onError={(e) => e.currentTarget.style.display = 'none'} 
                        />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            Registro de Compra Manual
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5 md:mt-1">
                            Ingresa compras externas para asignar puntos.
                        </p>
                    </div>
                </div>
                
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full shadow-sm">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Sistema Activo</span>
                </div>
            </div>

            {/* Tarjeta Principal */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-visible flex flex-col lg:flex-row">
                
                {/* === FORMULARIO === */}
                <div className="flex-1 p-5 md:p-8 lg:p-10 relative z-20"> 
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-gray-400" />
                            Datos de la Transacción
                        </h3>
                        
                        <div className="flex flex-col gap-2 w-full sm:w-auto">
                            {errorMessage && (
                                <div className="animate-in fade-in slide-in-from-top-2 flex items-center gap-2 text-xs md:text-sm font-bold text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100 shadow-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}
                            {successMessage && (
                                <div className="animate-in fade-in slide-in-from-top-2 flex items-center gap-2 text-xs md:text-sm font-bold text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200 shadow-sm">
                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                    <span>{successMessage}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            
                            {/* Selector de Usuario */}
                            <div className="md:col-span-2 relative" ref={dropdownRef}>
                                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Cliente / Afiliado</label>
                                <div 
                                    onClick={() => setIsOpen(!isOpen)}
                                    className={`relative group cursor-pointer border rounded-xl bg-gray-50 hover:bg-white hover:border-green-300 transition-all py-3.5 md:py-4 pl-12 pr-10 flex items-center
                                        ${isOpen ? 'ring-2 ring-green-500/20 border-green-500 bg-white' : 'border-gray-200'}
                                        ${errorMessage && !selectedUser ? 'border-red-300 bg-red-50/50' : ''}
                                    `}
                                >
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Users className={`h-5 w-5 ${selectedUser ? 'text-green-600' : 'text-gray-400'}`} />
                                    </div>
                                    <span className={`text-sm font-medium truncate ${selectedUser ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {selectedUserData ? (
                                            <span>
                                                {selectedUserData.username} 
                                                <span className="text-gray-400 font-normal ml-2 text-xs">({selectedUserData.email})</span>
                                            </span>
                                        ) : "Buscar usuario..."}
                                    </span>
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>

                                {isOpen && (
                                    <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                        <div className="p-2 border-b border-gray-100 bg-gray-50/50 sticky top-0">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                                    placeholder="Escribe para filtrar..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto">
                                            {filteredUsers.length > 0 ? (
                                                filteredUsers.map((user) => (
                                                    <div 
                                                        key={user.id}
                                                        onClick={() => handleSelectUser(user)}
                                                        className={`px-4 py-3 cursor-pointer hover:bg-green-50 transition-colors flex items-center justify-between group
                                                            ${selectedUser === user.id.toString() ? 'bg-green-50/80' : ''}
                                                        `}
                                                    >
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                                                                ${selectedUser === user.id.toString() ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-green-200 group-hover:text-green-700'}
                                                            `}>
                                                                {user.username.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex flex-col truncate">
                                                                <span className="text-sm font-semibold text-gray-800 truncate">{user.username}</span>
                                                                <span className="text-xs text-gray-500 truncate">{user.email}</span>
                                                            </div>
                                                        </div>
                                                        {selectedUser === user.id.toString() && (
                                                            <Check className="w-4 h-4 text-green-600" />
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-8 text-center text-gray-400 text-sm">
                                                    No se encontraron usuarios.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Descripción */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Concepto / Productos</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <ShoppingBag className={`h-5 w-5 transition-colors ${errorMessage && !description ? 'text-red-400' : 'text-gray-400 group-focus-within:text-green-600'}`} />
                                    </div>
                                    <input 
                                        type="text"
                                        className={`block w-full pl-12 py-3.5 md:py-4 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 transition-all text-sm font-medium outline-none placeholder:text-gray-400
                                            ${errorMessage && !description 
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                                                : 'border-gray-200 focus:border-green-500 focus:ring-green-500/20'
                                            }`}
                                        placeholder="Ej: Pack Abarrotes, Arroz..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Monto */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Monto Total (S/)</label>
                                
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {PRESET_AMOUNTS.map((val) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setAmount(val.toString())}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all
                                                ${amount === val.toString()
                                                    ? 'bg-green-600 text-white border-green-600 shadow-sm'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-600'
                                                }
                                            `}
                                        >
                                            S/ {val}
                                        </button>
                                    ))}
                                </div>

                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className={`font-bold text-lg transition-colors ${errorMessage && !amount ? 'text-red-400' : 'text-gray-500 group-focus-within:text-green-600'}`}>S/</span>
                                    </div>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        className={`block w-full pl-12 py-3.5 md:py-4 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 transition-all text-base md:text-xl font-bold text-gray-900 outline-none placeholder:text-gray-300
                                            ${errorMessage && !amount 
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                                                : 'border-gray-200 focus:border-green-500 focus:ring-green-500/20'
                                            }`}
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Botón */}
                        <div className="pt-2 md:pt-4">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className={`w-full py-3.5 md:py-4 px-6 rounded-xl font-bold text-white shadow-lg shadow-green-900/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-3 text-sm md:text-base
                                    ${loading 
                                        ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                                        : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600'
                                    }`}
                            >
                                {loading ? 'Procesando...' : (
                                    <>
                                        CONFIRMAR TRANSACCIÓN 
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* === PREVIEW === */}
                <div className="lg:w-[420px] bg-gray-50 p-5 md:p-8 lg:p-10 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-gray-200 z-10">
                    <div className="bg-[#0f172a] rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden ring-4 ring-gray-100 transform transition-transform hover:scale-[1.01] duration-500">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-green-500 rounded-full opacity-20 blur-[60px] transform translate-x-10 -translate-y-10"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600 rounded-full opacity-20 blur-[50px] transform -translate-x-5 translate-y-5"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <p className="text-[10px] text-green-400 uppercase tracking-[0.2em] font-bold mb-1">VISTA PREVIA</p>
                                    <h4 className="text-lg md:text-xl font-bold text-white tracking-tight">Resumen</h4>
                                </div>
                                <div className="bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg">
                                    <img 
                                        src={ATIPAY_ICON_SRC} 
                                        alt="Coin" 
                                        className="w-6 h-6 md:w-8 md:h-8 object-contain drop-shadow-md" 
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="flex justify-between items-end pb-3 border-b border-white/10">
                                    <span className="text-gray-400 text-xs md:text-sm font-medium">Cliente</span>
                                    <span className="text-sm md:text-base font-bold text-white text-right truncate max-w-[150px]">
                                        {displayName}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end pb-3 border-b border-white/10">
                                    <span className="text-gray-400 text-xs md:text-sm font-medium">Monto</span>
                                    <span className="text-lg md:text-xl font-mono font-bold text-white tracking-tight">
                                        S/ {parseFloat(amount || '0').toFixed(2)}
                                    </span>
                                </div>
                                <div className="pt-2">
                                    <span className="text-green-400 text-xs font-bold uppercase tracking-widest mb-2 block flex items-center gap-2">
                                        <Award className="w-4 h-4" /> Ganancia
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
                                            {simulatedPoints.toFixed(2)}
                                        </span>
                                        <span className="text-xs md:text-sm font-bold text-gray-300 mt-3 md:mt-4">pts</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 bg-black/20 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                    <img src={ATIPAY_ICON_SRC} className="w-3 h-3 md:w-4 md:h-4 opacity-80" alt="" />
                                </div>
                                <p className="text-[10px] text-gray-400 leading-tight">
                                    Conversión: <span className="text-white font-bold">S/ 300 = 100 Pts</span>. Acreditación inmediata.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* === HISTORIAL === */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <History className="w-5 h-5 text-green-600" />
                        Historial de Registros Recientes
                    </h3>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full border border-gray-200">
                            Últimos {history.length}
                        </span>
                        
                        {history.length > 0 && (
                            <button 
                                onClick={() => setShowClearModal(true)}
                                className="text-xs flex items-center gap-1.5 px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-full font-bold border border-red-100 transition-colors"
                            >
                                <Trash2 className="w-3 h-3" />
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                <th className="px-4 md:px-6 py-4 whitespace-nowrap">Usuario</th>
                                <th className="px-4 md:px-6 py-4">Concepto</th>
                                <th className="px-4 md:px-6 py-4 text-center whitespace-nowrap">Fecha</th>
                                <th className="px-4 md:px-6 py-4 text-right whitespace-nowrap">Monto</th>
                                <th className="px-4 md:px-6 py-4 text-right whitespace-nowrap">Puntos</th>
                                <th className="px-4 md:px-6 py-4 text-center whitespace-nowrap">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {history.length > 0 ? (
                                history.map((log) => (
                                    <tr key={log.id} className="hover:bg-green-50/30 transition-colors group">
                                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs shrink-0">
                                                    {log.user_name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-gray-900 text-sm truncate max-w-[120px] md:max-w-none">{log.user_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[150px]">
                                                <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                                                <span className="truncate max-w-[150px] md:max-w-[200px]">{log.description}</span>
                                            </div>
                                        </td>
                                        
                                        <td className="px-4 md:px-6 py-4 text-center whitespace-nowrap">
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                <span className="text-sm font-bold text-gray-700 capitalize">
                                                    {log.date}
                                                </span>
                                                <div className="flex items-center gap-1 text-[11px] text-gray-400">
                                                    <Clock className="w-3 h-3" />
                                                    {log.time}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-4 md:px-6 py-4 text-right whitespace-nowrap">
                                            <span className="font-mono text-sm font-bold text-gray-900">
                                                S/ {log.amount.toFixed(2)}
                                            </span>
                                        </td>
                                        
                                        {/* CORRECCIÓN VISUAL: WHITESPACE-NOWRAP para que los puntos no se rompan */}
                                        <td className="px-4 md:px-6 py-4 text-right whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1 font-bold text-xs md:text-sm text-white bg-green-600 px-2 md:px-2.5 py-1 rounded shadow-sm border border-green-500/50">
                                                +{log.points.toFixed(2)} pts
                                            </span>
                                        </td>
                                        
                                        <td className="px-4 md:px-6 py-4 text-center whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wide border border-green-200">
                                                <CheckCircle2 className="w-3 h-3" /> Completado
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                                                <History className="w-6 h-6 text-gray-300" />
                                            </div>
                                            <p>Aún no has registrado compras en esta sesión.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};