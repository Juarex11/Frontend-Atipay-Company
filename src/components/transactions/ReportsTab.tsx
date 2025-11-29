import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download as DownloadIcon, FileText } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const ReportsTab = () => {
  return (
    <Card className="shadow-luxury border-0">
      <CardHeader>
        <CardTitle>Generar Reportes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label>Período del reporte</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Mes actual</SelectItem>
                  <SelectItem value="last_month">Mes anterior</SelectItem>
                  <SelectItem value="quarter">Trimestre</SelectItem>
                  <SelectItem value="year">Año completo</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de reporte</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complete">Reporte completo</SelectItem>
                  <SelectItem value="earnings">Solo ganancias</SelectItem>
                  <SelectItem value="withdrawals">Solo retiros</SelectItem>
                  <SelectItem value="tax">Para declaración fiscal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full cursor-pointer bg-gradient-to-br from-[#DC171B] to-red-400 text-white hover:from-red-400 ">
              <FileText className="h-4 w-4" />
              Generar PDF
            </Button>
          </div>
          <div className="space-y-4">
            <div className="p-6 bg-gradient-to-br from-green-100 to-green-400 rounded-xl">
              <FileText className="w-8 h-8 text-green-600 mb-4" />
              <h3 className="font-semibold text-green-900 mb-2">
                Reporte Fiscal
              </h3>
              <p className="text-sm text-green-700 mb-4">
                Descarga tu reporte anual para la declaración de la renta
              </p>
              <Button size="sm" className="text-white cursor-pointer bg-green-600 hover:bg-green-700">
                <DownloadIcon className="h-4 w-4" />
                Descargar 2024
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportsTab;
