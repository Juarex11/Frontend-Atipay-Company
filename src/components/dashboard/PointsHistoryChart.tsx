import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, Bar, ComposedChart, CartesianGrid, XAxis, YAxis } from "@/components/ui/chart";
import { Cell } from "recharts";
import { AtipayCoin } from "@/components/ui/AtipayCoin";
import { TrendingUp } from "lucide-react";

// Interfaz para los datos que recibimos
interface MonthlyHistoryItem {
  month: number;
  year: number;
  points: number;
}

interface Props {
  readonly data: MonthlyHistoryItem[];
}

export function PointsHistoryChart({ data }: Props) {
  
  // Configuración de Colores (Siguiendo tu paleta)
  const COLOR_POINTS = 'hsl(142, 76%, 36%)'; // Verde Atipay (Mismo que daily gains)
  const COLOR_LOW = 'hsl(215, 16%, 80%)';    // Gris para meses bajos (opcional)

  // 1. Transformación de datos para el gráfico (Memoizado como en tu ejemplo)
  const chartData = useMemo(() => {
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    
    return data.map((item) => {
      return {
        mes: monthNames[item.month - 1], // Convertir número a nombre
        Puntos: item.points,
        fullDate: `${monthNames[item.month - 1]} ${item.year}`,
        color: item.points > 0 ? COLOR_POINTS : COLOR_LOW
      };
    });
  }, [data]);

  // 2. Formateador del Tooltip (Estilo idéntico a tu InvestmentChart)
  const tooltipFormatter = (value: number) => (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <AtipayCoin size="xs" className="w-3 h-3" />
        <span className="font-mono">
          {value.toLocaleString('es-ES')}
        </span>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
           <TrendingUp className="h-5 w-5 text-green-600" />
           Historial de Puntos
        </CardTitle>
        <CardDescription>
          Tus puntos acumulados mes a mes durante este año.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer
            config={{
              Puntos: { label: 'Puntos', color: COLOR_POINTS },
            }}
            className="h-64"
          >
            <ComposedChart data={chartData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis 
                dataKey="mes" 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                width={40} 
                tickFormatter={(v) => `${v}`} 
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    nameKey="Puntos" 
                    formatter={tooltipFormatter} 
                  />
                } 
              />
              <Bar dataKey="Puntos" radius={[4, 4, 0, 0]} barSize={28}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-p-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </ComposedChart>
          </ChartContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
             <p>No hay historial de puntos disponible.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}