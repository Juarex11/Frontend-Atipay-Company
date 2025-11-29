import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, Bar, ComposedChart, CartesianGrid, XAxis, YAxis } from '@/components/ui/chart';
import { Cell } from 'recharts';
import { API_ROUTES } from '@/config/api.routes';
import { AtipayCoin } from '@/components/ui/AtipayCoin';

interface DailyGain {
  date: string;
  gain: number;
  status: string;
  color?: string;
}

interface MonthlyGain {
  month: number;
  period: string;
  gain: number;
  status: string;
  color?: string;
}

interface DailyGainsResponse {
  investment_id: number;
  daily_earning: number;
  gains_by_day: DailyGain[];
  total_projected: number;
}

interface MonthlyGainsResponse {
  investment_id: number;
  price: number;
  percentaje: number;
  duration_months: number;
  daily_earning: number;
  gains_by_month: MonthlyGain[];
  total_projected: number;
}


interface Props {
  readonly investmentId: number;
}

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export function InvestmentGainsCharts({ investmentId }: Props) {
  const [daily, setDaily] = useState<DailyGainsResponse | null>(null);
  const [monthly, setMonthly] = useState<MonthlyGainsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const formatCurrencyString = (value: number): string => {
    return Number(value || 0).toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };


  const COLOR_GAIN = 'hsl(142, 76%, 36%)';
  const COLOR_NO_GAIN = 'hsl(215, 16%, 80%)';
  const COLOR_MONTHLY = 'hsl(219, 76%, 55%)';

  const dailyTooltipFormatter = (value: number, _name: string, props: { payload?: { estado?: string } }) => (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <AtipayCoin size="xs" className="w-3 h-3" />
        <span className="font-mono">
          {value.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </span>
      </div>
      {props?.payload?.estado && (
        <span className="text-muted-foreground">({props.payload.estado})</span>
      )}
    </div>
  );

  const monthlyTooltipFormatter = (value: number, _name: string, props: { payload?: { periodo?: string } }) => (
    <div className="flex flex-col">
      <div className="flex items-center gap-1">
        <AtipayCoin size="xs" className="w-3 h-3" />
        <span className="font-mono">
          {value.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </span>
      </div>
      {props?.payload?.periodo && (
        <span className="text-muted-foreground">{props.payload.periodo}</span>
      )}
    </div>
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [dRes, mRes] = await Promise.all([
          fetch(API_ROUTES.INVESTMENTS.DAILY_GAINS(investmentId), { headers: getAuthHeaders() }),
          fetch(API_ROUTES.INVESTMENTS.MONTHLY_GAINS(investmentId), { headers: getAuthHeaders() }),
        ]);

        // Si ambas peticiones devuelven 404, es porque no hay inversiones
        if (dRes.status === 404 && mRes.status === 404) {
          throw new Error('NO_INVESTMENTS_FOUND');
        }

        if (!dRes.ok || !mRes.ok) {
          const dTxt = await dRes.text();
          const mTxt = await mRes.text();
          throw new Error(`Error API: daily=${dRes.status} ${dTxt} | monthly=${mRes.status} ${mTxt}`);
        }

        const dJson = (await dRes.json()) as DailyGainsResponse;
        const mJson = (await mRes.json()) as MonthlyGainsResponse;
        if (!mounted) return;
        setDaily(dJson);
        setMonthly(mJson);
      } catch (error) {
        if (!mounted) return;
        const errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar los datos';
        setError(errorMessage);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [investmentId]);

  const dailyData = useMemo(() => {
    const list = daily?.gains_by_day ?? [];
    return list.map((d) => {
      const date = new Date(d.date.replace(' ', 'T')).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
      const estado = d.status?.toLowerCase?.() || '';
      const color = Number(d.gain) > 0 ? COLOR_GAIN : COLOR_NO_GAIN;
      return {
        date,
        Ganancia: d.gain,
        estado,
        color,
      };
    });
  }, [daily]);

  const monthlyData = useMemo(() => {
    const list = monthly?.gains_by_month ?? [];
    return list.map((m) => {
      const estado = m.status?.toLowerCase?.() || '';
      const color = COLOR_MONTHLY;
      return {
        mes: `Mes ${m.month}`,
        Ganancia: m.gain,
        estado,
        periodo: m.period,
        color,
      };
    });
  }, [monthly]);

  const dailySum = useMemo(() => {
    return (daily?.gains_by_day ?? []).reduce((acc, it) => acc + Number(it?.gain || 0), 0);
  }, [daily]);

  const monthlySum = useMemo(() => {
    return (monthly?.gains_by_month ?? []).reduce((acc, it) => acc + Number(it?.gain || 0), 0);
  }, [monthly]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ganancias diarias</CardTitle>
            <CardDescription>Cargando datos...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-40 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ganancias mensuales</CardTitle>
            <CardDescription>Cargando datos...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-40 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    const isNoInvestmentsError = error.includes('NO_INVESTMENTS_FOUND') ||
      error.includes('No query results for model [App\\Models\\Investment]') ||
      error.includes('404');

    if (isNoInvestmentsError) {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-amber-600">Ganancias diarias</CardTitle>
              <CardDescription className="text-amber-600">
                No hay inversiones registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4">
                  <AtipayCoin size="lg" className="w-12 h-12 text-amber-500" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Aún no tienes inversiones activas.
                </p>
                <p className="text-xs text-muted-foreground">
                  Comienza invirtiendo en alguno de nuestros planes para ver tus ganancias aquí.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-amber-600">Ganancias mensuales</CardTitle>
              <CardDescription className="text-amber-600">
                No hay inversiones registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4">
                  <AtipayCoin size="lg" className="w-12 h-12 text-amber-500" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Las ganancias mensuales aparecerán aquí.
                </p>
                <p className="text-xs text-muted-foreground">
                  Realiza tu primera inversión para comenzar a generar ganancias.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ganancias diarias</CardTitle>
            <CardDescription className="text-red-600">
              Error al cargar los datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Por favor, inténtalo de nuevo más tarde.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ganancias mensuales</CardTitle>
            <CardDescription className="text-red-600">
              Error al cargar los datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Por favor, inténtalo de nuevo más tarde.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Ganancias diarias</CardTitle>
          <CardDescription>
            Cada barra muestra la ganancia por día. Verde: con ganancia; gris: sin ganancia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              Ganancia: { label: 'Ganancia (S/.)', color: 'hsl(142, 76%, 36%)' },
            }}
            className="h-64"
          >
            <ComposedChart data={dailyData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={60} tickFormatter={(v) => formatCurrencyString(Number(v))} />
              <ChartTooltip content={<ChartTooltipContent nameKey="Ganancia" formatter={dailyTooltipFormatter} />} />
              <Bar dataKey="Ganancia" radius={[4, 4, 0, 0]} barSize={24}>
                {dailyData.map((entry) => (
                  <Cell key={`cell-d-${entry.date}`} fill={entry.color || COLOR_GAIN} />
                ))}
              </Bar>
            </ComposedChart>
          </ChartContainer>
          <div className="text-sm mt-2 space-y-1">
            <div className="space-y-1">
              <div>
                <span className="text-sm text-muted-foreground">Proyección total (API):</span>
                <div className="text-base font-medium flex items-center">
                  <AtipayCoin size="xs" className="w-3 h-3 mr-1" />
                  {(daily?.total_projected || 0).toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Acumulado actual:</span>
                <div className="text-base font-medium flex items-center">
                  <AtipayCoin size="xs" className="w-3 h-3 mr-1" />
                  {dailySum.toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
              </div>
            </div>
            {typeof daily?.daily_earning === 'number' && (
              <div className="flex items-baseline gap-1">
                <div className="text-base font-medium flex items-center">
                  <AtipayCoin size="xs" className="w-3 h-3 mr-1" />
                  {(daily.daily_earning || 0).toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
                <span className="text-xs text-muted-foreground">/día</span>
              </div>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: COLOR_GAIN }}></span> Con ganancia</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: COLOR_NO_GAIN }}></span> Sin ganancia</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ganancias mensuales</CardTitle>
          <CardDescription>
            Un resumen por mes. Te muestra cuánto llevas acumulado en el periodo de tu inversión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              Ganancia: { label: 'Ganancia (S/.)', color: 'hsl(219, 76%, 55%)' },
            }}
            className="h-64"
          >
            <ComposedChart data={monthlyData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="mes" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={60} tickFormatter={(v) => formatCurrencyString(Number(v))} />
              <ChartTooltip content={<ChartTooltipContent nameKey="Ganancia" formatter={monthlyTooltipFormatter} />} />
              <Bar dataKey="Ganancia" radius={[4, 4, 0, 0]} barSize={28}>
                {monthlyData.map((entry) => (
                  <Cell key={`cell-m-${entry.mes}`} fill={COLOR_MONTHLY} />
                ))}
              </Bar>
            </ComposedChart>
          </ChartContainer>
          <div className="text-sm mt-2 space-y-1">
            <div className="space-y-1">
              <div>
                <span className="text-sm text-muted-foreground">Proyección total (API):</span>
                <div className="text-base font-medium flex items-center">
                  <AtipayCoin size="xs" className="w-3 h-3 mr-1" />
                  {(monthly?.total_projected || 0).toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Acumulado actual:</span>
                <div className="text-base font-medium flex items-center">
                  <AtipayCoin size="xs" className="w-3 h-3 mr-1" />
                  {monthlySum.toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
              </div>
            </div>
            {typeof monthly?.percentaje === 'number' && typeof monthly?.duration_months === 'number' && (
              <div className="text-xs text-muted-foreground">Plan: {monthly.percentaje}% por {monthly.duration_months} mes(es)</div>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: COLOR_MONTHLY }}></span> Ganancia mensual</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default InvestmentGainsCharts;
