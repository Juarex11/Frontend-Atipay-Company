import { useState, useEffect } from "react";
import {
  getCurrentUserProfile,
  type UserProfileNormalized,
} from "@/services/user.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Copy, CheckCircle, Share2, Loader, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface InviteFriendsModalProps {
  triggerClassName?: string;
  children?: React.ReactNode;
}

export const InviteFriendsModal = ({
  triggerClassName,
  children
}: InviteFriendsModalProps) => {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfileNormalized | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && !profile) {
      setLoading(true);
      getCurrentUserProfile()
        .then(setProfile)
        .catch((err) => {
          console.error("Error cargando perfil", err);
          toast.error("No se pudo cargar tu perfil");
        })
        .finally(() => setLoading(false));
    }
  }, [open, profile]);

  const referralCode = profile?.referenceCode || "";
  const referralLink = referralCode ? `https://atipaycompany.com/register?ref=${referralCode}` : "";

  const copy = (text: string, type: 'code' | 'link' = 'code') => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 1800);
        toast.success("Código copiado al portapapeles");
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 1800);
        toast.success("Enlace copiado al portapapeles");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className={triggerClassName}>
            <Share2 className="h-4 w-4 mr-2" />
            Invitar Amigos
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-gray-50 border-0 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-navy-900">
            Comparte tu enlace de referido
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Invita amigos y gana comisiones por sus inversiones
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-2">
          {loading && (
            <div className="flex justify-center items-center text-center">
              <Loader className="mr-4 animate-spin text-green-400" />
              <p className="text-sm text-gray-500">Cargando perfil...</p>
            </div>

          )}
          {!loading && (
            <>
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">
                  Tu código de referido
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    readOnly
                    value={referralCode}
                    className="font-mono bg-white border-gray-300"
                    aria-label="Código de referido"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => copy(referralCode, 'code')}
                    className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
                  >
                    {copiedCode ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">
                  Tu enlace de referido
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    readOnly
                    value={referralLink}
                    className="font-mono text-sm bg-white border-gray-300"
                    aria-label="Enlace de referido"
                  />
                  <Button
                    type="button"
                    onClick={() => copy(referralLink, 'link')}
                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                  >
                    {copiedLink ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <a
                    href={referralLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    title="Abrir enlace"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-sm text-gray-600 mb-3">
                  Comparte este código o enlace con amigos para que se registren y ambos
                  obtengan beneficios especiales.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: '¡Únete a Atipay con mi enlace de referido!',
                          text: 'Regístrate en Atipay usando mi enlace y obtén beneficios especiales',
                          url: referralLink,
                        }).catch(console.error);
                      }
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Compartir enlace
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
