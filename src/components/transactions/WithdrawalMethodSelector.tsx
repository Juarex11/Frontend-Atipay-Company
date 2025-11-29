import { type LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";

type WithdrawalMethod = {
  id: string;
  name: string;
  icon: LucideIcon;
  fee: string;
  time: string;
};

interface WithdrawalMethodSelectorProps {
  methods: Array<WithdrawalMethod>;
  selectedMethod: string;
  onSelect: (methodId: string) => void;
  methodColors: Record<string, string>;
  addAlpha: (hex: string, opacity: number) => string;
}

export const WithdrawalMethodSelector = ({
  methods,
  selectedMethod,
  onSelect,
  methodColors,
  addAlpha,
}: WithdrawalMethodSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-gray-700 font-medium">
        Selecciona tu método de retiro
      </Label>
      <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-3">
        {methods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          const baseColor = methodColors[method.id] || "#1e3a8a";
          const bg = isSelected ? addAlpha(baseColor, 0.13) : "transparent";
          const border = isSelected ? baseColor : "#e5e7eb";
          const ring = isSelected ? addAlpha(baseColor, 0.35) : "transparent";

          return (
            <button
              key={method.id}
              type="button"
              className={`group w-full text-left p-4 border-2 rounded-xl transition-all focus:outline-none focus-visible:ring-2 flex flex-col justify-center min-h-[90px]`}
              style={{
                background: bg,
                borderColor: border,
                boxShadow: isSelected ? `0 0 0 2px ${ring}` : "none",
              }}
              onClick={() => onSelect(method.id)}
              onKeyDown={(e) => e.key === "Enter" && onSelect(method.id)}
              tabIndex={0}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                    isSelected
                      ? "text-white"
                      : "text-gray-600 bg-gray-100 group-hover:bg-gray-200"
                  }`}
                  style={isSelected ? { background: baseColor } : {}}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {method.name}
                  </h4>
                  <div className="text-xs text-gray-500 mt-1">
                    Comisión: {method.fee} • {method.time}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
