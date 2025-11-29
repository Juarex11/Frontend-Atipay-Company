import { 
  ArrowDownRight, 
  ArrowUpRight, 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  Receipt,
  type LucideIcon
} from "lucide-react";

export const getTransactionIcon = (type: string): LucideIcon => {
  switch (type) {
    case "withdrawal":
      return ArrowDownRight;
    case "deposit":
      return ArrowUpRight;
    case "investment":
      return TrendingUp;
    case "return":
      return DollarSign;
    case "commission":
      return CreditCard;
    default:
      return Receipt;
  }
};
