import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type Theme = 'light' | 'dark' | 'system';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as Theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-gray-700",
          actionButton:
            "group-[.toast]:bg-blue-600 group-[.toast]:text-white group-[.toast]:hover:bg-blue-700",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-700 group-[.toast]:hover:bg-gray-200",
          success: "bg-green-100 border-green-500 text-green-900",
          error: "bg-red-100 border-red-500 text-red-900",
          warning: "bg-yellow-100 border-yellow-500 text-yellow-900",
          info: "bg-blue-100 border-blue-500 text-blue-900",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
