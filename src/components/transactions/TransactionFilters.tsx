import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

import { type Transaction } from "@/types/transactions";

interface TransactionFiltersProps {
  searchTerm: string;
  filterType: Transaction['type'] | 'all';
  filterStatus: Transaction['status'] | 'all';
  onSearchChange: (value: string) => void;
  onTypeChange: (value: Transaction['type'] | 'all') => void;
  onStatusChange: (value: Transaction['status'] | 'all') => void;
}

export const TransactionFilters = ({
  searchTerm,
  filterType,
  filterStatus,
  onSearchChange,
  onTypeChange,
  onStatusChange,
}: TransactionFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar transacciones..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <Select value={filterType} onValueChange={onTypeChange}>
        <SelectTrigger className="w-full md:w-48">
          <SelectValue placeholder="Tipo de transacción" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los tipos</SelectItem>
          <SelectItem value="withdrawal">Retiros</SelectItem>
          <SelectItem value="deposit">Depósitos</SelectItem>
          <SelectItem value="investment">Inversiones</SelectItem>
          <SelectItem value="return">Retornos</SelectItem>
          <SelectItem value="commission">Comisiones</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filterStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full md:w-48">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="completed">Completadas</SelectItem>
          <SelectItem value="pending">Pendientes</SelectItem>
          <SelectItem value="failed">Fallidas</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default TransactionFilters;
