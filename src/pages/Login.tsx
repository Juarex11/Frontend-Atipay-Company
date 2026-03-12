import { useState, useRef } from "react";
import { Link } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Shield, Users, Zap, AlertCircle } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from "sonner";

type ErrorField = "credentials" | "captcha" | "network" | null;

interface FieldError {
  type: ErrorField;
  message: string;
}

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ usernameOrEmail: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<FieldError>({ type: null, message: "" });
  const [captchaValid, setCaptchaValid] = useState(false);
  const { login } = useAuth();
  const captcha = useRef<ReCAPTCHA>(null);

  const onCaptchaChange = () => {
    if (captcha.current?.getValue()) {
      setCaptchaValid(true);
      setFieldError(prev => prev.type === "captcha" ? { type: null, message: "" } : prev);
    }
  };

  const onCaptchaExpired = () => setCaptchaValid(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaValid) {
      setFieldError({ type: "captcha", message: "Por favor, completa el captcha antes de continuar." });
      return;
    }

    setLoading(true);
    setFieldError({ type: null, message: "" });

    const toastId = toast.loading("Iniciando sesion...");

    try {
      await login(formData.usernameOrEmail, formData.password);
      toast.success("Bienvenido! Redirigiendo...", { id: toastId, duration: 2000 });
      // AuthContext hace window.location.href automaticamente
    } catch (err) {
      captcha.current?.reset();
      setCaptchaValid(false);

      let errorType: ErrorField = "credentials";
      let errorMessage = "Usuario o contrasena incorrectos. Verifica tus datos.";

      if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        if (msg.includes("failed to fetch") || msg.includes("network")) {
          errorType = "network";
          errorMessage = "No se pudo conectar con el servidor. Verifica tu conexion a Internet.";
        } else if (msg.includes("desactivad") || msg.includes("suspendid") || msg.includes("inactiv")) {
          errorMessage = "Tu cuenta esta desactivada. Contacta al administrador.";
        } else if (err.message && err.message.length < 200) {
          errorMessage = err.message;
        }
      }

      toast.error(errorMessage, { id: toastId, duration: 4000 });
      setFieldError({ type: errorType, message: errorMessage });
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (fieldError.type === "credentials") setFieldError({ type: null, message: "" });
  };

  const inputErrorClass = fieldError.type === "credentials"
    ? "border-red-400 focus-visible:ring-red-400"
    : "";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left - Branding */}
      <div className="lg:w-1/2 p-12 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-green-800 to-green-900 min-h-[50vh] lg:min-h-screen">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="absolute top-20 right-20 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-green-500/10 rounded-full blur-3xl" />
        <div className="space-y-6 relative z-10">
          <img src="/assets/atipay_logo2.png" alt="Atipay Logo" className="w-40 h-20 object-contain mb-8" />
          <h2 className="text-4xl font-display font-bold text-white leading-tight">
            Sistema de Gestion<br />
            <span className="text-green-400">de Inversiones</span>
          </h2>
          <p className="text-white text-lg max-w-md">
            Plataforma integral para la gestion de inversiones colaborativas, afiliados y transacciones financieras.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-1 gap-6 mt-8">
          {[
            { icon: Shield, title: "Inversiones Seguras", desc: "Plataforma 100% segura y regulada" },
            { icon: Users, title: "Red de Afiliados", desc: "Genera ingresos con nuestro programa de referidos" },
            { icon: Zap, title: "Retornos Rapidos", desc: "Disfruta de rendimientos atractivos" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-900/50 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Icon className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">{title}</h3>
                <p className="text-white/80 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/assets/atipay_logo2.png" alt="Atipay Logo" className="h-16 object-contain mx-auto" />
          </div>
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-green-900">Iniciar Sesion</CardTitle>
              <p className="text-muted-foreground text-sm mt-2">Ingresa tus credenciales para acceder a tu cuenta</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Error credenciales */}
                {fieldError.type === "credentials" && (
                  <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-300 px-4 py-3 text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Datos incorrectos</p>
                      <p>{fieldError.message}</p>
                    </div>
                  </div>
                )}

                {/* Error red */}
                {fieldError.type === "network" && (
                  <div className="flex items-center gap-2 rounded-md bg-orange-50 border border-orange-200 px-4 py-3 text-orange-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{fieldError.message}</span>
                  </div>
                )}

                {/* Usuario */}
                <div className="space-y-2">
                  <Label htmlFor="usernameOrEmail" className="text-sm font-medium text-green-700">
                    Usuario o Correo electronico
                  </Label>
                  <Input
                    id="usernameOrEmail"
                    name="usernameOrEmail"
                    type="text"
                    placeholder="usuario o correo@ejemplo.com"
                    value={formData.usernameOrEmail}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className={`h-12 text-base ${inputErrorClass}`}
                  />
                </div>

                {/* Contrasena */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-green-700">Contrasena</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      className={`h-12 text-base pr-12 ${inputErrorClass}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                {/* Captcha 6Lf3GHAsAAAAAJ0oxgPwovNbqTTqLneSbeHhDDUJ - 6LegV2gsAAAAAJA4xTTPiPedyOi3Rkxl_S03S816*/}
                <div className="flex flex-col items-center gap-1">
                  <ReCAPTCHA
                    ref={captcha}
                    sitekey="6LegV2gsAAAAAJA4xTTPiPedyOi3Rkxl_S03S816"
                    
                    onChange={onCaptchaChange}
                    onExpired={onCaptchaExpired}
                  />
                  {fieldError.type === "captcha" && (
                    <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{fieldError.message}</span>
                    </div>
                  )}
                </div>

              <div className="flex justify-end">
  <a
    href="https://wa.me/51906289965?text=Hola,%20vengo%20de%20la%20web%20y%20deseo%20unirme%20a%20invertir."
    target="_blank"
    rel="noopener noreferrer"
    className="text-sm text-green-600 hover:text-green-700 font-medium"
  >
    Deseo Informaciòn
  </a>
</div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white cursor-pointer"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Iniciando sesion...
                    </span>
                  ) : "Iniciar sesion"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">o</span>
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-sm text-muted-foreground">No tienes una cuenta? </span>
                  <Link to="/register" className="text-sm font-semibold text-green-600 hover:text-green-700">
                    Registrate aqui
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}