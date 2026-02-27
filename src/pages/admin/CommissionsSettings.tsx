/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Edit, Loader2, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import {
  getCommissionSettings,
  createCommissionSetting,
  deleteCommissionSetting,
  type CommissionSetting
} from '@/services/commissionService';
import CommissionModal from '@/components/admin/CommissionModal';
import ConfirmationModal from '@/components/admin/ConfirmationModal';
import { MinPointsEditor } from '../../components/admin/settings/MinPointsEditor';

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
  const safeSettings = Array.isArray(settings) ? settings : [];

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

  if (safeSettings.length === 0) {
    return (
      <div className="p-12 text-center">
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
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Puntos Mínimos
                </TableHead>
                <TableHead className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200">
              {safeSettings.map((setting) => (
                <TableRow key={setting.level} className="hover:bg-gray-50">
                  <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    Nivel {getLevel(setting.level)}
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {formatPercentage(setting.percentage)}%
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="font-mono">{setting.min_points || 0} pts</span>
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
  const { user } = useAuth();
  const [settings, setSettings] = useState<CommissionSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [editingSetting, setEditingSetting] = useState<any | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [levelToDelete, setLevelToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') return;

    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const data = await getCommissionSettings();
        
        // Lógica para detectar la propiedad 'levels'
        if (data && (data as any).levels && Array.isArray((data as any).levels)) {
            setSettings((data as any).levels);
        } else if (data && (data as any).data && Array.isArray((data as any).data)) {
            setSettings((data as any).data);
        } else {
            setSettings(Array.isArray(data) ? data : []);
        }

      } catch (error) {
        console.error('Error al cargar configuraciones de comisión:', error);
        toast.error('Error al cargar las configuraciones de comisión');
        setSettings([]); 
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const handleSaveSetting = async (setting: any): Promise<void> => {
    try {
      setIsSubmitting(true);
      await createCommissionSetting(setting); 
      
      if (editingSetting) {
        toast.success('Nivel de comisión actualizado exitosamente');
      } else {
        toast.success('Nivel de comisión creado exitosamente');
      }
      
      const updatedSettings = await getCommissionSettings();
      
      // Misma lógica para detectar 'levels' al actualizar
      if (updatedSettings && (updatedSettings as any).levels && Array.isArray((updatedSettings as any).levels)) {
          setSettings((updatedSettings as any).levels);
      } else if (updatedSettings && (updatedSettings as any).data && Array.isArray((updatedSettings as any).data)) {
          setSettings((updatedSettings as any).data);
      } else {
          setSettings(Array.isArray(updatedSettings) ? updatedSettings : []);
      }

      setIsModalOpen(false); 
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      
    } catch (error) {
      console.error('Error al eliminar configuración:', error);
      toast.error('Error al eliminar el nivel de comisión');
    } finally {
      setIsDeleting(false);
      setLevelToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setLevelToDelete(null);
  };

  const handleEditSetting = (setting: CommissionSetting) => {
    setEditingSetting({
      level: setting.level,
      percentage: setting.percentage,
      min_points: (setting as any).min_points || 0
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingSetting({ 
      level: '',
      percentage: '',
      min_points: 0 
    }); 
    setIsModalOpen(true);
  };

  if (user?.role !== 'admin') {
    return <div>Acceso restringido</div>; 
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-[#0c4a2a] to-[#0a7e3e] p-6 rounded-lg text-white shadow-md">
        <div>
          <h1 className="text-2xl font-bold mb-1">Configuración de Comisiones</h1>
          <p className="text-green-100 text-sm">
            Gestiona las reglas de negocio para el sistema de afiliados
          </p>
        </div>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-4">
           <Trophy className="w-5 h-5 text-yellow-600" />
           <h2 className="text-lg font-bold text-gray-800">Regla de Calificación Global</h2>
        </div>
        <MinPointsEditor />
      </section>

      <hr className="border-gray-200" />

      <section>
        <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-6 gap-4">
           <div>
              <h2 className="text-lg font-bold text-gray-800">Distribución por Niveles</h2>
              <p className="text-sm text-gray-500">Porcentajes de ganancia según la profundidad de la red</p>
           </div>
           
           <Button 
             onClick={handleAddNew}
             className="bg-[#0a7e3e] hover:bg-[#0c4a2a] text-white shadow-sm"
           >
             <Plus className="mr-2 h-4 w-4" />
             Agregar Nivel
           </Button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <CommissionSettingsContent
            isLoading={isLoading}
            settings={settings}
            onEditSetting={handleEditSetting}
            onDeleteSetting={handleDeleteClick}
          />
        </div>
      </section>

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