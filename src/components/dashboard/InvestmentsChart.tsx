import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface Investment {
  id: number;
  daily_earning: number;
  start_date: string;
  end_date: string;
  promotion: {
    name: string;
  };
}

interface ChartData {
  name: string;
  dailyEarnings: number;
  totalEarnings: number;
  duration: number;
}

export function InvestmentsChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No se encontró el token de autenticación');
        }

        const response = await fetch('https://back.mibolsillo.site/api/investments', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Error al cargar las inversiones');
        }

        const investments: Investment[] = await response.json();

        // Process data for the chart
        const chartData = investments.map(investment => {
          const startDate = new Date(investment.start_date);
          const endDate = new Date(investment.end_date);
          const durationInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const totalEarnings = investment.daily_earning * durationInDays;

          return {
            name: `Inversión #${investment.id}`,
            dailyEarnings: investment.daily_earning,
            totalEarnings: Number(totalEarnings.toFixed(2)),
            duration: durationInDays,
          };
        });

        setData(chartData);
      } catch (err) {
        console.error('Error fetching investments:', err);
        setError('No se pudieron cargar los datos de inversión');
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(value);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Rendimiento de Inversiones</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Rendimiento de Inversiones</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Rendimiento de Inversiones</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <p>No hay datos de inversión disponibles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Rendimiento de Inversiones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                yAxisId="left"
                orientation="left"
                stroke="#0088FE"
                tickFormatter={(value) => `S/ ${value}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#00C49F"
                tickFormatter={(value) => `${value} días`}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'Ganancia Diaria' || name === 'Ganancia Total') {
                    return [formatCurrency(Number(value)), name];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="dailyEarnings"
                name="Ganancia Diaria"
                fill="#0088FE"
              >
                {data.map((item) => (
                  <Cell key={`cell-${item.name}`} fill={COLORS[data.indexOf(item) % COLORS.length]} />
                ))}
              </Bar>
              <Bar
                yAxisId="left"
                dataKey="totalEarnings"
                name="Ganancia Total"
                fill="#00C49F"
              />
              <Bar
                yAxisId="right"
                dataKey="duration"
                name="Duración (días)"
                fill="#FFBB28"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
