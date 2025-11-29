import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import type { UserFilters } from '@/services/userManagement.service';

interface UserFiltersComponentProps {
  readonly filters: Readonly<UserFilters>;
  readonly onFiltersChange: (filters: UserFilters) => void;
  readonly onClearFilters: () => void;
}

export function UserFiltersComponent({
  filters,
  onFiltersChange,
  onClearFilters,
}: UserFiltersComponentProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof UserFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? undefined : value,
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== 'all' && value !== ''
  );

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Búsqueda principal */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nombre, email o ID..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Filtro de Estado */}
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="suspended">Suspendidos</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro de Rol */}
            <Select
              value={filters.role || 'all'}
              onValueChange={(value) => handleFilterChange('role', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="partner">Socios</SelectItem>
                <SelectItem value="admin">Administradores</SelectItem>
              </SelectContent>
            </Select>

            {/* Botón filtros avanzados */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Más filtros
              </Button>

              {/* Botón limpiar filtros */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={onClearFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          {/* Filtros avanzados */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label htmlFor="registrationDateFrom" className="text-sm font-medium mb-2 block">
                  Fecha registro desde:
                </label>
                <Input
                  id="registrationDateFrom"
                  type="date"
                  value={filters.registrationDateFrom || ''}
                  onChange={(e) => handleFilterChange('registrationDateFrom', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="registrationDateTo" className="text-sm font-medium mb-2 block">
                  Fecha registro hasta:
                </label>
                <Input
                  id="registrationDateTo"
                  type="date"
                  value={filters.registrationDateTo || ''}
                  onChange={(e) => handleFilterChange('registrationDateTo', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
