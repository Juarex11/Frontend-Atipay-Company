import { TabsList, TabsTrigger } from "@/components/ui/tabs";

export const DashboardTabs = () => (
  <TabsList className="grid w-full grid-cols-4">
    <TabsTrigger value="users">Usuarios</TabsTrigger>
    <TabsTrigger value="investments">Inversiones</TabsTrigger>
    <TabsTrigger value="system">Sistema</TabsTrigger>
    <TabsTrigger value="reports">Reportes</TabsTrigger>
  </TabsList>
);
