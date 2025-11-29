import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface FieldCopyProps {
  label: string;
  value: string;
  hint?: string;
  onCopy: (value: string, setCopied: (value: boolean) => void) => void;
}

export const FieldCopy = ({
  label,
  value,
  hint,
  onCopy,
}: FieldCopyProps) => {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-col gap-1 border rounded-md p-2 bg-white/60">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          {label}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onCopy(value, setCopied)}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      <span className="font-mono text-sm text-gray-800 break-all">
        {value}
      </span>
      {hint && <span className="text-[10px] text-gray-500">{hint}</span>}
    </div>
  );
};

export default FieldCopy;
