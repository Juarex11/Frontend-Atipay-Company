import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  getWithdrawalDescription, 
  getWithdrawalLabel, 
  getWithdrawalPlaceholder 
} from "@/utils/withdrawalUtils";

const getMaxLengthForMethod = (method: string): number | undefined => {
  if (method === "yape" || method === "plin") return 9;
  if (method === "bank") return 20;
  return undefined;
};

interface WithdrawalAddressInputProps {
  method: string;
  address: string;
  error: string | null;
  onAddressChange: (value: string) => void;
  onBlur: () => void;
}

export const WithdrawalAddressInput = ({
  method,
  address,
  error,
  onAddressChange,
  onBlur,
}: WithdrawalAddressInputProps) => {
  const handleAddressChange = (value: string) => {
    let processedValue = value;
    
    if (method === "yape" || method === "plin") {
      processedValue = value.replace(/\D/g, "").slice(0, 9);
    } else if (method === "bank") {
      processedValue = value.replace(/\D/g, "").slice(0, 20);
    } else if (method === "crypto") {
      processedValue = value.replace(/\s/g, "");
    }
    
    onAddressChange(processedValue);
  };

  if (!method) return null;

  return (
    <div className="space-y-2">
      <Label className="text-gray-700 font-medium">
        {getWithdrawalLabel(method)}
      </Label>
      <Input
        placeholder={getWithdrawalPlaceholder(method)}
        value={address}
        onChange={(e) => handleAddressChange(e.target.value)}
        onBlur={onBlur}
        inputMode={method === "crypto" ? undefined : "numeric"}
        pattern={method === "crypto" ? undefined : "\\d*"}
        maxLength={getMaxLengthForMethod(method)}
        className={`min-h-[40px] border ${
          address && error
            ? "border-red-500 focus-visible:ring-red-500"
            : "border-gray-300"
        }`}
      />
      {address && error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : (
        <p className="text-xs text-gray-500">
          {getWithdrawalDescription(method)}
        </p>
      )}
    </div>
  );
};
