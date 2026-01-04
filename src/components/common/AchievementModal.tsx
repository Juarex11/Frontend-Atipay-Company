import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Star, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface Achievement {
  id: number;
  title: string;
  rewardName: string;
  imageUrl?: string;
  message: string;
}

interface AchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievement: Achievement | null;
}

export const AchievementModal = ({ isOpen, onClose, achievement }: AchievementModalProps) => {
  const { width, height } = useWindowSize();
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 8000);
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
    }
  }, [isOpen]);

  if (!achievement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {showConfetti && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          <Confetti 
            width={width} 
            height={height} 
            numberOfPieces={300} 
            gravity={0.15}
            recycle={showConfetti}
            // Opcional: Confeti con colores de Atipay (Verdes y Dorados)
            colors={['#10B981', '#059669', '#34D399', '#FBBF24', '#F59E0B']} 
          />
        </div>
      )}

      <DialogContent className="sm:max-w-md w-[90%] max-h-[90vh] text-center p-0 border-none shadow-none bg-transparent overflow-visible">
        
        {/* Tarjeta Principal con Borde VERDE Atipay */}
        <div className="bg-white rounded-3xl p-6 md:p-8 relative z-10 shadow-2xl border-4 border-emerald-500 mx-auto mt-10">
          
          {/* Botón Cerrar */}
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-20">
            <X className="w-6 h-6" />
          </button>

          {/* Icono Flotante Superior (Fondo Verde) */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-4 md:p-5 rounded-full shadow-lg shadow-green-500/50 animate-pulse">
              <Star className="w-10 h-10 md:w-12 md:h-12 text-white fill-white" />
            </div>
          </div>

          <div className="mt-8 space-y-4">
            
            {/* LOGO DE ATIPAY AQUÍ */}
            <div className="flex justify-center mb-2">
                <img 
                    src="/assets/atipay_logo2.png" 
                    alt="Atipay Company" 
                    className="h-10 object-contain" 
                />
            </div>

            <div>
                {/* Título en Verde Corporativo */}
                <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-500 uppercase tracking-tight">
                ¡Felicidades!
                </h2>
                <p className="text-gray-500 font-bold mt-1 text-xs md:text-sm uppercase tracking-wide">
                  {achievement.title}
                </p>
            </div>

            {/* Caja de mensaje más limpia */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
               <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                 {achievement.message}
               </p>
            </div>

            {/* Imagen del Regalo (Manteniendo el diseño limpio) */}
            <div className="relative group cursor-pointer py-2">
              <div className="absolute inset-0 bg-green-200 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                {achievement.imageUrl ? (
                  <img 
                    src={achievement.imageUrl} 
                    alt="Premio" 
                    className="w-full h-full object-contain drop-shadow-xl"
                  />
                ) : (
                  <Gift className="w-24 h-24 text-emerald-500" />
                )}
              </div>
              
              <div className="mt-2 inline-block px-4 py-1 rounded-full bg-emerald-100 border border-emerald-300 shadow-sm">
                <span className="text-emerald-800 font-bold text-sm md:text-base">
                  🎁 {achievement.rewardName}
                </span>
              </div>
            </div>

            {/* Botones de Acción (Verdes) */}
            <div className="pt-2 flex flex-col gap-3">
              <Button 
                onClick={() => {
                  onClose();
                  navigate('/user/gifts'); 
                }} 
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold py-6 text-lg shadow-lg hover:shadow-emerald-500/40 transition-all transform hover:-translate-y-1 rounded-xl"
              >
                RECLAMAR AHORA
              </Button>
              
              <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs font-medium">
                Cerrar y ver más tarde
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};