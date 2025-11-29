import type { Promotion } from '../types';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AtipayCoin } from "@/components/ui/AtipayCoin";
import { Clock, Edit, Trash2, Eye, Percent, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface PromotionsListProps {
  promotions: Promotion[];
  onEdit?: (promotion: Promotion) => void;
  onDelete?: (id: string) => Promise<void>;
  onView?: (promotion: Promotion) => void;
  isLoading?: boolean;
}

const getStatusBadge = (status: 'active' | 'inactive') => {
  return status === 'active' ? (
    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0 rounded-full px-3 py-1 text-xs font-medium">
      Activo
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-gray-50 text-gray-500 hover:bg-gray-50 border-gray-200 rounded-full px-3 py-1 text-xs">
      Inactivo
    </Badge>
  );
};

const PromotionCard = ({ promotion, onEdit, onDelete, onView, isAdmin }: { 
  promotion: Promotion; 
  onEdit?: (p: Promotion) => void; 
  onDelete?: (id: string) => Promise<void>;
  onView?: (p: Promotion) => void;
  isAdmin: boolean;
}) => (
  <div className="h-full bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
    <div className="p-4 sm:p-5 flex-1 flex flex-col">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
        <h3 className="font-medium text-gray-900 text-base sm:text-lg line-clamp-2">{promotion.name}</h3>
        <div className="self-start sm:self-auto">
          {getStatusBadge(promotion.status)}
        </div>
      </div>
      
      <div className="space-y-2 sm:space-y-3 mt-2 sm:mt-4">
        <div className="flex items-center text-sm text-gray-600">
          <Percent className="h-4 w-4 mr-2 text-green-600 flex-shrink-0" />
          <span className="truncate">{promotion.percentaje}% de ganancia</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <AtipayCoin size="xs" className="mr-2 flex-shrink-0" />
          <span className="truncate">{Number(promotion.atipay_price_promotion).toFixed(2)} ATI</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2 text-green-600 flex-shrink-0" />
          <span className="truncate">{promotion.duration_months} mes{promotion.duration_months !== 1 ? 'es' : ''}</span>
        </div>
      </div>
      
      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100">
        <div className="flex flex-wrap gap-2 justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-600 hover:bg-gray-50 h-8 px-2 sm:px-3 text-xs sm:text-sm"
            onClick={() => onView?.(promotion)}
          >
            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
            <span className="sr-only sm:not-sr-only">Ver</span>
          </Button>
          {isAdmin && onEdit && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-600 hover:bg-blue-50 h-8 px-2 sm:px-3 text-xs sm:text-sm"
              onClick={() => onEdit(promotion)}
            >
              <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
              <span className="sr-only sm:not-sr-only">Editar</span>
            </Button>
          )}
          {isAdmin && onDelete && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-600 hover:bg-red-50 h-8 px-2 sm:px-3 text-xs sm:text-sm"
              onClick={() => onDelete(promotion.id)}
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
              <span className="sr-only sm:not-sr-only">Eliminar</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const PromotionsList = ({ 
  promotions = [], 
  onEdit,
  onDelete,
  onView,
  isLoading = false 
}: PromotionsListProps) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-56 sm:h-64 rounded-xl bg-gray-50 animate-pulse p-4">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-100 rounded w-3/4"></div>
              <div className="h-3 bg-gray-100 rounded w-2/3"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
            <div className="h-9 bg-gray-100 rounded-lg w-full mt-6"></div>
          </div>
        ))}
      </div>
    );
  }

  if (promotions.length === 0) {
    return (
      <div className="text-center p-8 sm:p-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center mb-3 sm:mb-4">
          <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
        </div>
        <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-1">No hay promociones</h3>
        <p className="text-sm sm:text-base text-gray-500">Crea tu primera promoción para comenzar</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {promotions.map((promotion) => (
        <PromotionCard 
          key={promotion.id}
          promotion={promotion}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
};
