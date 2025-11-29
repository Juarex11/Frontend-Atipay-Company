import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Settings, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UserConfigurationModal } from "@/components/admin/UserConfigurationModal";
import { API_BASE_URL } from "@/config";
import { getAuthHeaders } from "@/lib/auth";

interface PartnerManagerWrapperProps {
  userId: string | number;
  onPartnerUpdated?: () => void;
}

export default function PartnerManagerWrapper({ userId, onPartnerUpdated }: PartnerManagerWrapperProps) {
  const [numericId, setNumericId] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userData, setUserData] = useState<{
    id: string;
    username?: string;
    name?: string;
    email: string;
    status: string;
    role: string;
    phone_number?: string;
  } | null>(null);

  useEffect(() => {
    try {
      // Intentamos convertir el userId a número
      const parsedId = typeof userId === 'string' ? parseInt(userId, 10) : userId;

      // Validamos que sea un número válido
      if (isNaN(parsedId) || parsedId <= 0) {
        setHasError(true);
        setNumericId(null);
      } else {
        setNumericId(parsedId);
        setHasError(false);

        // Cargar los datos del usuario
        fetchUserData(parsedId);
      }
    } catch (error) {
      console.error("Error al procesar ID de usuario:", error);
      setHasError(true);
      setNumericId(null);
    }
  }, [userId]);

  const fetchUserData = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/profile/partners/${id}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data.data || {
          id: id.toString(),
          email: "",
          status: "active",
          role: "partner"
        });
      } else {
        console.error("Error al obtener datos del usuario");
        setHasError(true);
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
      setHasError(true);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  if (hasError) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" disabled>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>ID de usuario inválido</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (numericId === null) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Settings className="h-4 w-4 text-gray-400" />
      </Button>
    );
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenModal}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Configurar usuario</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isModalOpen && userData && (
        <UserConfigurationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          user={{
            id: numericId.toString(),
            email: userData.email || "",
            status: userData.status || "active",
            role: userData.role || "partner",
            username: userData.username,
            phone_number: userData.phone_number,
            is_partner: true
          }}
          onUserUpdated={() => {
            if (onPartnerUpdated) onPartnerUpdated();
          }}
        />
      )}
    </>
  );
}
