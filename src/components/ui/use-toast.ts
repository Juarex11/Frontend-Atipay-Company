import { toast as sonnerToast } from 'sonner';

type Variant = 'default' | 'destructive' | 'success' | 'info' | 'warning' | undefined;

interface ToastArgs extends Record<string, unknown> {
  title?: string;
  description?: string;
  variant?: Variant;
}

const adaptToast = ({ title, description, variant, ...rest }: ToastArgs) => {
  const message = title || description || '';
  const desc = title && description ? { description, ...rest } : { ...rest };
  switch (variant) {
    case 'destructive':
      return sonnerToast.error(message, desc);
    case 'success':
      return sonnerToast.success(message, desc);
    case 'warning':
      return sonnerToast.warning(message, desc);
    case 'info':
      return sonnerToast.info(message, desc);
    case 'default':
    default:
      return sonnerToast(message, desc);
  }
};

function useToast() {
  return { toast: adaptToast };
}

// Export API compatible
const toast = adaptToast;
export { useToast, toast };
