/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Check, Trophy, Target, Award, AlignLeft, Hash } from "lucide-react";

interface LevelData {
  level: number;
  accumulated: number;
  target: number;
  reward: string;      // Título del premio
  description: string; // Descripción del premio (Nuevo)
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
      <DialogContent className="max-w-2xl bg-[#F0FDF4] p-0 border-none shadow-2xl rounded-[32px] overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-white p-8 pb-6 shadow-sm border-b border-emerald-100/50">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <Trophy className="w-7 h-7" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-extrabold text-emerald-950">
                  Reporte de Niveles
                </DialogTitle>
                <DialogDescription className="text-emerald-700/80 font-medium mt-1">
                  Revisión de afiliaciones para: <span className="text-emerald-800 font-bold underline decoration-emerald-300 underline-offset-2">{username}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* LISTA DE NIVELES */}
        <div className="p-8 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar bg-[#F8FAFC]">
          {data && data.length > 0 ? (
            data.map((lvl) => (
              <div 
                key={lvl.level} 
                className={`bg-white rounded-[24px] p-6 transition-all duration-300 border ${
                  lvl.is_completed ? 'border-emerald-200 shadow-md ring-1 ring-emerald-100' : 'border-gray-100 shadow-sm'
                }`}
              >
                {/* 1. ENCABEZADO DE LA TARJETA (Nivel y Estado) */}
                <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-black text-sm">
                      {lvl.level}
                    </span>
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                      Nivel de Red
                    </span>
                  </div>
                  
                  {lvl.is_completed ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase flex items-center gap-1.5">
                      <Check className="w-3 h-3" /> Si Cumple
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase flex items-center gap-1.5">
                      <Target className="w-3 h-3" /> En Progreso
                    </span>
                  )}
                </div>

                {/* 2. SECCIÓN DE PUNTOS (Con etiquetas explícitas) */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-50">
                    <p className="text-[10px] font-bold text-emerald-800/50 uppercase mb-1 flex items-center gap-1">
                      <Hash className="w-3 h-3" /> Puntos Acumulados
                    </p>
                    <p className="text-2xl font-black text-emerald-900">
                      {lvl.accumulated.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center justify-end gap-1">
                      Meta Requerida <Target className="w-3 h-3" />
                    </p>
                    <p className="text-2xl font-black text-gray-600 text-right">
                      {lvl.target.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Barra de Progreso */}
                <div className="mb-6">
                   <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        lvl.is_completed ? 'bg-emerald-500' : 'bg-emerald-300'
                      }`}
                      style={{ width: `${lvl.percentage}%` }}
                    />
                   </div>
                </div>

                {/* 3. SECCIÓN DE PREMIO (Con Título y Descripción) */}
                <div className="bg-emerald-950 rounded-2xl p-5 text-white relative overflow-hidden">
                  {/* Decoración de fondo */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/20 rounded-full -mr-10 -mt-10 blur-xl"></div>
                  
                  <div className="flex gap-4 relative z-10">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 text-emerald-400" />
                    </div>
                    
                    <div className="space-y-1">
                      {/* ETIQUETA: TÍTULO */}
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider block mb-0.5">
                          Título del Premio:
                        </span>
                        <p className="font-bold text-lg leading-none">
                          {lvl.reward || 'Sin Título Asignado'}
                        </p>
                      </div>

                      {/* ETIQUETA: DESCRIPCIÓN */}
                      <div className="pt-2 mt-2 border-t border-emerald-800/50">
                        <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider block mb-1 flex items-center gap-1">
                          <AlignLeft className="w-3 h-3" /> Descripción:
                        </span>
                        <p className="text-sm text-emerald-100/80 font-medium leading-snug">
                          {lvl.description || 'No hay descripción disponible para este nivel.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ))
          ) : (
             <div className="py-20 text-center text-gray-400">
               <p>Cargando información de niveles...</p>
             </div>
          )}
        </div>
        
        {/* FOOTER */}
        <div className="p-6 bg-white border-t border-gray-100 flex justify-center">
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 transition-all"
            >
              Cerrar Reporte
            </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};