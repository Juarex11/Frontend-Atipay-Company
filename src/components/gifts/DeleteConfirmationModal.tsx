import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  title?: string;
  description?: string;
  itemName?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
  title = "¿Estás seguro?",
  itemName = "este elemento",
  description: propDescription
}) => {
  const description = propDescription || `¿Estás seguro de que deseas eliminar "${itemName}"? Esta acción no se puede deshacer.`;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
        <div className="bg-white p-8 text-center">
          {/* Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 mb-6">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
          
          {/* Content */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">
              {title}
            </h3>
            <p className="text-gray-600 text-base">
              {description}
            </p>
          </div>
          
          {/* Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3 w-full">
            <Button 
              onClick={onClose} 
              disabled={isDeleting}
              variant="outline"
              className="w-full h-12 px-6 font-medium text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </Button>
            <Button 
              onClick={onConfirm} 
              disabled={isDeleting}
              className="w-full h-12 px-6 font-medium text-white bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Eliminando...
                </>
              ) : 'Eliminar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
