import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Edit, Loader2, Trophy } from 'lucide-react'; // Agregué Trophy para el icono
import { toast } from 'sonner';
import {
  getCommissionSettings,
  createCommissionSetting,
  deleteCommissionSetting,
  type CommissionSetting
} from '@/services/commissionService';
import CommissionModal from '@/components/admin/CommissionModal';
import ConfirmationModal from '@/components/admin/ConfirmationModal';

interface CommissionSettingsContentProps {
  isLoading: boolean;
  settings: CommissionSetting[];
  onEditSetting: (setting: CommissionSetting) => void;
  onDeleteSetting: (level: number) => void;
}

const CommissionSettingsContent: React.FC<CommissionSettingsContentProps> = ({
  isLoading,
  settings,
  onEditSetting,
  onDeleteSetting
}) => {
  const formatPercentage = (value: number) => {
    return value ? Math.round(Number(value)).toString() : '0';
  };

  const getLevel = (level: number) => {
    return level || 'N/A';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#0a7e3e]" />
        <span className="ml-3 text-gray-700">Cargando configuraciones...</span>
      </div>
    );
  }

  if (settings.length === 0) {
    return (
      <div className="p-12 text-center">
        {/* ... (Icono SVG existente) ... */}
        <h3 className="text-lg font-medium text-gray-900 mb-1">Sin configuraciones</h3>
        <p className="text-gray-500">
          No hay configuraciones de comisión. Agrega un nivel para comenzar.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 overflow-x-auto">
      <div className="min-w-full overflow-hidden rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-full divide-y divide-gray-200">
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Nivel
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Porcentaje
                </TableHead>
                {/* --- NUEVA COLUMNA: PUNTOS MÍNIMOS --- */}
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Puntos Mínimos
                </TableHead>
                <TableHead className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200">
              {settings.map((setting) => (
                <TableRow key={setting.level} className="hover:bg-gray-50">
                  <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    Nivel {getLevel(setting.level)}
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {formatPercentage(setting.percentage)}%
                  </TableCell>
                  {/* --- NUEVA CELDA: PUNTOS --- */}
                  <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                       <Trophy className="w-4 h-4 text-yellow-500" />
                       {/* Si min_points no existe (porque no está en BD), mostramos 0 */}
                       <span className="font-mono">{(setting as any).min_points || 0} pts</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-500 hover:text-blue-700 text-xs sm:text-sm"
                      onClick={() => onEditSetting(setting)}
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 text-xs sm:text-sm"
                      onClick={() => onDeleteSetting(setting.level)}
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">Eliminar</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default function CommissionsSettings() {
  // ... (Hooks y estados existentes se mantienen igual) ...
  const { user } = useAuth();
  const [settings, setSettings] = useState<CommissionSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Modificamos el tipo aquí para incluir min_points opcionalmente
  const [editingSetting, setEditingSetting] = useState<any | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [levelToDelete, setLevelToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ... (useEffect loadSettings se mantiene igual) ...
  useEffect(() => {
    if (user?.role !== 'admin') return;

    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const data = await getCommissionSettings();
        setSettings(data);
      } catch (error) {
        console.error('Error al cargar configuraciones de comisión:', error);
        toast.error('Error al cargar las configuraciones de comisión');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);


  // ... (handleSaveSetting se mantiene igual, el backend recibirá el campo extra) ...
  const handleSaveSetting = async (setting: any): Promise<void> => {
    try {
      setIsSubmitting(true);
      // Aquí enviaremos 'min_points' aunque la interfaz original no lo tenga definido aun
      await createCommissionSetting(setting); 
      
      if (editingSetting) {
        toast.success('Nivel de comisión actualizado exitosamente');
      } else {
        toast.success('Nivel de comisión creado exitosamente');
      }
      
      const updatedSettings = await getCommissionSettings();
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... (handleDeleteClick, handleConfirmDelete, handleCancelDelete se mantienen igual) ...
  const handleDeleteClick = (level: number) => {
     setLevelToDelete(level);
     setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (levelToDelete === null) return;
    try {
      setIsDeleting(true);
      await deleteCommissionSetting(levelToDelete);
      setSettings(prevSettings => prevSettings.filter(s => s.level !== levelToDelete));
      toast.success('Nivel de comisión eliminado exitosamente');
      setDeleteModalOpen(false);
      const updatedSettings = await getCommissionSettings();
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error al eliminar configuración:', error);
      toast.error('Error al eliminar el nivel de comisión');
      const updatedSettings = await getCommissionSettings();
      setSettings(updatedSettings);
    } finally {
      setIsDeleting(false);
      setLevelToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setLevelToDelete(null);
  };


  // --- MODIFICACIÓN AQUÍ: Pasamos los puntos al editar ---
  const handleEditSetting = (setting: CommissionSetting) => {
    setEditingSetting({
      level: setting.level,
      percentage: setting.percentage,
      min_points: (setting as any).min_points || 0 // Aseguramos que pase el valor
    });
    setIsModalOpen(true);
  };

  // --- MODIFICACIÓN AQUÍ: Inicializamos puntos en 0 al crear ---
  const handleAddNew = () => {
    setEditingSetting({ min_points: 0 }); // Inicializamos vacío pero con la propiedad
    setIsModalOpen(true);
  };

  if (user?.role !== 'admin') {
    // ... (Vista de acceso restringido se mantiene igual) ...
    return <div>Acceso restringido</div>; 
  }

  return (
    <div className="p-6 space-y-6">
       {/* ... (Header y botón agregar se mantienen igual) ... */}
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-[#0c4a2a] to-[#0a7e3e] p-6 rounded-lg text-white">
        <div>
          <h1 className="text-2xl font-bold mb-1">Configuración de Comisiones</h1>
          <p className="text-green-100 text-sm">
            Gestiona porcentajes y puntos mínimos por nivel
          </p>
        </div>
      </div>

      <div className="flex justify-end mb-6">
        <Button 
          onClick={handleAddNew}
          className="bg-[#0a7e3e] hover:bg-[#0c4a2a] text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Nivel
        </Button>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 pb-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Niveles de Comisión</h2>
            <p className="text-sm text-gray-500 mt-1">
              Configura porcentaje y puntos requeridos para calificar
            </p>
          </div>

          <CommissionSettingsContent
            isLoading={isLoading}
            settings={settings}
            onEditSetting={handleEditSetting}
            onDeleteSetting={handleDeleteClick}
          />
        </div>
      </div>

      <CommissionModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingSetting(null);
        }} 
        initialData={editingSetting} 
        onSave={handleSaveSetting}
        isSubmitting={isSubmitting}
      />

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Eliminar nivel de comisión"
        message="¿Estás seguro de que deseas eliminar este nivel? Se perderá la configuración de puntos y porcentaje."
        confirmText="Eliminar nivel"
        isDeleting={isDeleting}
      />
    </div>
  );
}