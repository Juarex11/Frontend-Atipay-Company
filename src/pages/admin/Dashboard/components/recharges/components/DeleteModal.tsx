import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import type { Recharge } from "@/services/atipayRechargeService";

interface DeleteModalProps {
  target: Recharge | null;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  confirming: boolean;
}

export const DeleteModal = ({
  target,
  open,
  onCancel,
  onConfirm,
  confirming,
}: DeleteModalProps) => {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar rechazo</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Seguro que quiere rechazar el depósito de{" "}
            <strong>{target?.full_names || "—"}</strong> por el monto de{" "}
            <strong>S/. {target ? target.amount.toFixed(2) : "0.00"}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer hover:bg-gray-100">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 cursor-pointer text-white"
            disabled={confirming}
            onClick={onConfirm}
          >
            {confirming ? "Rechazando..." : "Rechazar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
