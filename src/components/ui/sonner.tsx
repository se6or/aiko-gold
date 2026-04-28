import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CheckCircle2 className="w-5 h-5 text-gold" />,
        error: <XCircle className="w-5 h-5 text-gold" />,
        warning: <AlertTriangle className="w-5 h-5 text-gold" />,
        info: <Info className="w-5 h-5 text-gold" />,
        loading: <Loader2 className="w-5 h-5 text-gold animate-spin" />,
      }}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group toast font-bold !bg-gradient-to-br !from-bg-secondary !to-black !text-gold !border !border-gold-dark/60 !shadow-gold !rounded-xl !backdrop-blur-xl",
          title: "!text-gold !font-bold",
          description: "!text-muted-foreground !font-normal",
          actionButton:
            "!bg-gradient-gold !text-black !font-bold !rounded-lg",
          cancelButton:
            "!bg-bg-tertiary !text-muted-foreground !border !border-gold-dark/30 !rounded-lg",
          success: "!text-gold",
          error: "!text-gold",
          warning: "!text-gold",
          info: "!text-gold",
          closeButton:
            "!bg-bg-tertiary !text-gold !border !border-gold-dark/50 hover:!bg-gold-dark hover:!text-black",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
