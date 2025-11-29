import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";
import { AtipayCoin } from "@/components/ui/AtipayCoin";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string | ReactNode;
  valueColor?: string;
  showCoin?: boolean;
}

export const KPICard = ({
  title,
  value,
  icon,
  description,
  valueColor = "text-blue-600",
  showCoin = false,
}: KPICardProps) => (
  <Card className="shadow-luxury border-0">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className={`flex items-center gap-1.5 ${valueColor}`}>
        {showCoin && <AtipayCoin size="xs" className="w-4 h-4" />}
        <span className="text-2xl font-bold">{value}</span>
      </div>
      {description && (
        <div className="text-xs text-muted-foreground mt-1">
          {description}
        </div>
      )}
    </CardContent>
  </Card>
);
