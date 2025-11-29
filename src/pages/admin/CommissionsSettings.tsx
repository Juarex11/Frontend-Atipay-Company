import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getCommissionSettings,
  createCommissionSetting,
  deleteCommissionSetting,
  type CommissionSetting
} from '@/services/commissionService';
import CommissionModal from '@/components/admin/CommissionModal';
import ConfirmationModal from '@/components/admin/ConfirmationModal';
import QualificationSettings from '@/components/admin/Settings/QualificationSettings';


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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
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
  const [editingSetting, setEditingSetting] = useState<Omit<CommissionSetting, 'id' | 'created_at' | 'updated_at'> | null>(null);
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

  const handleSaveSetting = async (setting: Omit<CommissionSetting, 'id' | 'created_at' | 'updated_at'>): Promise<void> => {
    try {
      setIsSubmitting(true);
      
      if (editingSetting) {
        await createCommissionSetting(setting);
        toast.success('Nivel de comisión actualizado exitosamente');
      } else {
        await createCommissionSetting(setting);
        toast.success('Nivel de comisión creado exitosamente');
      }
      
      const updatedSettings = await getCommissionSettings();
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      toast.error('Error al guardar la configuración');
      throw error;
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
      
      // Actualización optimista
      setSettings(prevSettings => prevSettings.filter(s => s.level !== levelToDelete));
      
      toast.success('Nivel de comisión eliminado exitosamente');
      setDeleteModalOpen(false);
      
      // Recargar datos del servidor para asegurar consistencia
      const updatedSettings = await getCommissionSettings();
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error al eliminar configuración:', error);
      toast.error('Error al eliminar el nivel de comisión');
      
      // Recargar datos del servidor en caso de error
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

  const handleEditSetting = (setting: CommissionSetting) => {
    setEditingSetting({
      level: setting.level,
      percentage: setting.percentage
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingSetting(null);
    setIsModalOpen(true);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center p-6 bg-red-50 border border-red-100 rounded-lg max-w-md w-full">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-1">Acceso restringido</h3>
          <p className="text-sm text-red-600">No tienes permiso para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-[#0c4a2a] to-[#0a7e3e] p-6 rounded-lg text-white">
        <div>
          <h1 className="text-2xl font-bold mb-1">Configuración de Comisiones</h1>
          <p className="text-green-100 text-sm">
            Gestiona los porcentajes de comisión por nivel de afiliado
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
              Configura los porcentajes de comisión para cada nivel de afiliado
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

      <div className="lg:col-span-2 mt-6">
         <QualificationSettings />
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
        message="¿Estás seguro de que deseas eliminar este nivel de comisión? Esta acción no se puede deshacer."
        confirmText="Eliminar nivel"
        isDeleting={isDeleting}
      />
    </div>
  );
}
