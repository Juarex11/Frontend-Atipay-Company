/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Check, Trophy, Target, Award, Sparkles } from "lucide-react";

interface LevelData {
  level: number;
  accumulated: number;
  target: number;
  reward: string;
  percentage: number;
  is_completed: boolean;
}

interface LevelReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: LevelData[];
  username: string;
}

export const LevelReportModal: React.FC<LevelReportModalProps> = ({ 
  isOpen, 
  onClose, 
  data, 
  username 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#F0FDF4] p-0 border-none shadow-2xl rounded-[40px] overflow-hidden">
        
        {/* HEADER: Vibrante y Motivador */}
        <div className="bg-white p-10 pb-8 rounded-b-[40px] shadow-sm">
          <DialogHeader>
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-[24px] bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-extrabold text-emerald-900 tracking-tight">
                  Logros de Red
                </DialogTitle>
                <DialogDescription className="text-lg text-emerald-600/70 font-medium">
                  Estatus actual de <span className="text-emerald-700 font-bold underline decoration-emerald-200 underline-offset-4">{username}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* CONTENIDO: Tarjetas Blancas sobre fondo Esmeralda muy suave */}
        <div className="p-10 pt-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {data && data.length > 0 ? (
            data.map((lvl) => (
              <div 
                key={lvl.level} 
                className={`bg-white rounded-[32px] p-8 transition-all duration-300 border-2 ${
                  lvl.is_completed ? 'border-emerald-200 shadow-md' : 'border-white shadow-sm'
                }`}
              >
                {/* NIVEL Y ESTADO */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-widest">
                      Nivel {lvl.level}
                    </div>
                    {lvl.is_completed && (
                      <div className="flex items-center gap-1 text-emerald-500">
                        <Sparkles className="w-4 h-4 fill-emerald-500" />
                      </div>
                    )}
                  </div>
                  
                  {lvl.is_completed ? (
                    <span className="text-xs font-black text-emerald-500 flex items-center gap-1">
                      <Check className="w-4 h-4" /> COMPLETADO
                    </span>
                  ) : (
                    <span className="text-xs font-black text-emerald-300 flex items-center gap-1">
                      <Target className="w-4 h-4" /> EN CAMINO
                    </span>
                  )}
                </div>

                {/* MÉTRICAS PRINCIPALES */}
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-xs font-bold text-emerald-800/40 uppercase mb-1">Puntos Acumulados</p>
                    <p className="text-4xl font-black text-emerald-900">
                      {lvl.accumulated.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-800/40 uppercase mb-1">Meta del Rango</p>
                    <p className="text-2xl font-bold text-emerald-700/50">
                      {lvl.target.toLocaleString()} pts
                    </p>
                  </div>
                </div>

                {/* BARRA DE PROGRESO PREMIUM */}
                <div className="space-y-3">
                  <div className="w-full h-4 bg-emerald-50 rounded-full overflow-hidden border border-emerald-100/50 p-1">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        lvl.is_completed 
                          ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                          : 'bg-emerald-300'
                      }`}
                      style={{ width: `${lvl.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[11px] font-bold text-emerald-800/30 uppercase">Progreso de Red</span>
                    <span className="text-[11px] font-black text-emerald-600 italic">
                      {lvl.percentage}% alcanzado
                    </span>
                  </div>
                </div>

                {/* SECCIÓN PREMIO: Colorida y clara */}
                <div className="mt-8 p-5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <Award className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-emerald-700/50 uppercase tracking-tighter">Recompensa del Nivel</p>
                    <p className="text-sm font-bold text-emerald-900 uppercase">
                      {lvl.reward || 'Premio Sorpresa Atipay'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center text-emerald-200 font-bold">Analizando estructura de referidos...</div>
          )}
        </div>
        
        {/* FOOTER: Botón Emerald Vibrante */}
        <div className="p-8 bg-white/50 backdrop-blur-sm flex justify-center border-t border-emerald-100">
            <button 
              onClick={onClose}
              className="w-full max-w-xs py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-200 transition-all active:scale-95"
            >
              Cerrar Reporte
            </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};