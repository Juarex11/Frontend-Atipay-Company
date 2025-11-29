import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PromotionsFilter, PromotionStatus } from "../types";
import { cn } from "@/lib/utils";

interface PromotionsFiltersProps {
  filters: PromotionsFilter;
  onFilterChange: (filters: PromotionsFilter) => void;
  className?: string;
}

export const PromotionsFilters = ({
  filters,
  onFilterChange,
  className,
}: PromotionsFiltersProps) => {
  const handleStatusChange = (status: string) => {
    onFilterChange({
      ...filters,
      status: status as PromotionStatus,
    });
  };

  const handleTypeChange = (type: string) => {
    onFilterChange({
      ...filters,
      type,
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      search: e.target.value,
    });
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Input
          placeholder="Buscar promociones..."
          className="w-full sm:w-64"
          value={filters.search}
          onChange={handleSearchChange}
        />
        
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activas</SelectItem>
              <SelectItem value="inactive">Inactivas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.type} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="bonus">Bonos</SelectItem>
              <SelectItem value="points_multiplier">Multiplicadores</SelectItem>
              <SelectItem value="discount">Descuentos</SelectItem>
              <SelectItem value="other">Otros</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
