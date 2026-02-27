import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Star, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'; 
import { API_BASE_URL } from '@/config'; 

// --- FUNCIÓN DE CORRECCIÓN DE URL ---
const fixImageUrl = (url?: string | null) => {
  if (!url) return undefined;
  
  const lasthttpsIndex = url.lastIndexOf("https");
  if (lasthttpsIndex > 0) return url.substring(lasthttpsIndex);
  
  if (url.startsWith("https")) return url;
  
  const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${cleanPath}`;
};

export interface Achievement {
  id: number;
  key?: string; 
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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 8000);
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
    }
  }, [isOpen]);

  const handleClaim = async () => {
    if (!achievement) return;

    // --- 1. DEBUG Y VALIDACIÓN ---
    console.log("Intentando reclamar logro:", achievement);
    
    if (!achievement.key) {
      console.error("⛔ ERROR: Falta la propiedad 'key' en el objeto achievement.");
      Swal.fire({
        icon: 'error',
        title: 'Error técnico',
        text: 'No se pudo identificar el código del premio (key missing). Por favor recarga la página.'
      });
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/achievements/mark-as-seen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ key: achievement.key }) 
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onClose(); 
        const rewardDetails = data.reward_details || {};
        
        // Corregimos la URL para la alerta
        const fixedAlertImage = fixImageUrl(rewardDetails.image_url || achievement.imageUrl);

        // --- CAMBIO AQUÍ: Obtenemos el mensaje personalizado ---
        // Prioridad: mensaje del backend (mark-as-seen) > mensaje del modal (check) > texto default
        const successMessage = rewardDetails.description || achievement.message || "El producto ha sido añadido a tu inventario";

        Swal.fire({
          title: '¡Premio Reclamado!',
          html: `
            <div class="mt-2">
              <p class="text-gray-600 mb-4 text-sm px-4">${successMessage}</p>
              
              <h3 class="text-emerald-600 font-black text-2xl uppercase mt-2">
                ${rewardDetails.name || achievement.rewardName}
              </h3>
            </div>
          `,
          imageUrl: fixedAlertImage, 
          imageWidth: 220,
          imageAlt: rewardDetails.name || achievement.rewardName,
          backdrop: `rgba(0,0,0,0.8)`,
          confirmButtonText: 'Ver en Mis Premios',
          confirmButtonColor: '#10B981', 
          showCancelButton: true,
          cancelButtonText: 'Seguir navegando',
          cancelButtonColor: '#9CA3AF',
          padding: '2em',
          customClass: {
            popup: 'rounded-[2rem]',
            image: 'rounded-xl shadow-lg border-4 border-emerald-50 my-4 object-contain bg-white p-2',
            confirmButton: 'rounded-full px-8 py-3 font-bold shadow-lg shadow-emerald-200',
            cancelButton: 'rounded-full px-6 py-3 text-gray-500 hover:bg-gray-100 border-0'
          },
          buttonsStyling: true
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/user/my-rewards'); 
          }
        });
      } else {
        console.error("Error del servidor:", data);
        Swal.fire('Error', data.message || 'Hubo un problema al reclamar.', 'error');
      }
    } catch (error) {
      console.error("Error de red:", error);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
      onClose(); 
    } finally {
      setIsLoading(false);
    }
  };

  if (!achievement) return null;

  const finalImage = fixImageUrl(achievement.imageUrl);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {showConfetti && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          <Confetti width={width} height={height} numberOfPieces={300} gravity={0.15} recycle={showConfetti} colors={['#10B981', '#059669', '#34D399', '#FBBF24', '#F59E0B']} />
        </div>
      )}

      <DialogContent className="sm:max-w-md w-[90%] max-h-[90vh] text-center p-0 border-none shadow-none bg-transparent overflow-visible">
        <DialogTitle className="sr-only">{achievement.title}</DialogTitle>
        <DialogDescription className="sr-only">{achievement.message}</DialogDescription>

        <div className="bg-white rounded-3xl p-6 md:p-8 relative z-10 shadow-2xl border-4 border-emerald-500 mx-auto mt-10">
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-20"><X className="w-6 h-6" /></button>

          <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-4 md:p-5 rounded-full shadow-lg shadow-green-500/50 animate-pulse">
              <Star className="w-10 h-10 md:w-12 md:h-12 text-white fill-white" />
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex justify-center mb-2">
              <img src="/assets/atipay_logo2.png" alt="Atipay" className="h-10 object-contain" />
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-500 uppercase tracking-tight">¡Felicidades!</h2>
              <p className="text-gray-500 font-bold mt-1 text-xs md:text-sm uppercase tracking-wide">{achievement.title}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
               <p className="text-gray-700 text-sm md:text-base leading-relaxed">{achievement.message}</p>
            </div>

            <div className="relative group cursor-pointer py-2">
              <div className="absolute inset-0 bg-green-200 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                {finalImage ? (
                  <img src={finalImage} alt="Premio" className="w-full h-full object-contain drop-shadow-xl" />
                ) : (
                  <Gift className="w-24 h-24 text-emerald-500" />
                )}
              </div>
              <div className="mt-2 inline-block px-4 py-1 rounded-full bg-emerald-100 border border-emerald-300 shadow-sm">
                <span className="text-emerald-800 font-bold text-sm md:text-base">🎁 {achievement.rewardName}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <Button onClick={handleClaim} disabled={isLoading} className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold py-6 text-lg shadow-lg hover:shadow-emerald-500/40 transition-all transform hover:-translate-y-1 rounded-xl disabled:opacity-70 disabled:cursor-not-allowed">
                {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> PROCESANDO...</> : "RECLAMAR AHORA"}
              </Button>
              <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs font-medium">Cerrar y ver más tarde</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};