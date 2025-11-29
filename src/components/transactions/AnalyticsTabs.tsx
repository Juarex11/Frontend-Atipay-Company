import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, BarChart, Bar } from "recharts";
import { formatCurrency } from "@/utils/transactionUtils";
import type { EarningsData } from "@/types/transactions";

interface AnalyticsTabsProps {
  earningsData: EarningsData[];
}

export const AnalyticsTabs = ({ earningsData }: AnalyticsTabsProps) => {
  return (
    <TabsContent value="analytics" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-luxury border-0">
          <CardHeader>
            <CardTitle>Evolución de Ganancias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#1e40af"
                  strokeWidth={3}
                  dot={{ fill: "#1e40af", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-luxury border-0">
          <CardHeader>
            <CardTitle>Fuentes de Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Bar
                  dataKey="investment"
                  fill="#8b5cf6"
                  name="Inversiones"
                />
                <Bar
                  dataKey="commission"
                  fill="#f59e0b"
                  name="Comisiones"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
};
