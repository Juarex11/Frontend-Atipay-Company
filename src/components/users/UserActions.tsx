import { useState } from 'react';
import { MoreHorizontal, Edit, UserX, UserCheck, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { UserListItem } from '@/services/userManagement.service';

interface UserActionsProps {
  readonly user: UserListItem;
  readonly onView: (user: UserListItem) => void;
  readonly onEdit: (user: UserListItem) => void;
  readonly onSuspend: (userId: string) => void;
  readonly onActivate: (userId: string) => void;
  readonly onDelete: (userId: string) => void;
}

export function UserActions({
  user,
  onView,
  onEdit,
  onSuspend,
  onActivate,
  onDelete,
}: UserActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);

  const handleSuspend = () => {
    onSuspend(user.id);
    setShowSuspendDialog(false);
  };

  const handleDelete = () => {
    onDelete(user.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onView(user)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver detalles
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(user)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar usuario
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.status === 'active' ? (
            <DropdownMenuItem 
              onClick={() => setShowSuspendDialog(true)}
              className="text-orange-600"
            >
              <UserX className="mr-2 h-4 w-4" />
              Suspender usuario
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem 
              onClick={() => onActivate(user.id)}
              className="text-green-600"
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Activar usuario
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar usuario
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de confirmación para suspender */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Suspender usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres suspender a {user.firstName} {user.lastName}?
              El usuario no podrá acceder a su cuenta hasta que sea reactivado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspend}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Suspender
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar a {user.firstName} {user.lastName}?
              Esta acción no se puede deshacer y se eliminará toda la información del usuario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
