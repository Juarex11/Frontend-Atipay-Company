import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (!token || !email) {
      setError("Enlace inválido o expirado. Solicita uno nuevo.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          password: formData.password,
          password_confirmation: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo restablecer la contraseña.");
      }

      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        if (msg.includes("failed to fetch") || msg.includes("network")) {
          setError("No se pudo conectar con el servidor. Verifica tu conexión a Internet.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setLoading(false);
    }
  };

  const tokenInvalido = !token || !email;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="lg:w-1/2 p-12 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-green-800 to-green-900 min-h-[40vh] lg:min-h-screen">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="absolute top-20 right-20 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-green-500/10 rounded-full blur-3xl" />
        <div className="space-y-6 relative z-10">
          <img src="/assets/atipay_logo2.png" alt="Atipay Logo" className="w-40 h-20 object-contain mb-8" />
          <h2 className="text-4xl font-display font-bold text-white leading-tight">
            Nueva<br />
            <span className="text-green-400">Contraseña</span>
          </h2>
          <p className="text-white text-lg max-w-md">
            Crea una contraseña segura para proteger tu cuenta de inversiones.
          </p>
        </div>
        <div className="relative z-10 mt-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-900/50 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <KeyRound className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Contraseña segura</h3>
              <p className="text-white/80 text-sm">Usa al menos 8 caracteres con letras y números</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/assets/atipay_logo2.png" alt="Atipay Logo" className="h-16 object-contain mx-auto" />
          </div>
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-green-900">Restablecer contraseña</CardTitle>
              <p className="text-muted-foreground text-sm mt-2">Ingresa tu nueva contraseña para continuar</p>
            </CardHeader>
            <CardContent>
              {tokenInvalido ? (
                <div className="space-y-6 text-center py-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-700 mb-2">Enlace inválido</h3>
                    <p className="text-muted-foreground text-sm">Este enlace no es válido o ha expirado. Solicita uno nuevo.</p>
                  </div>
                  <Link to="/forgot-password">
                    <Button className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white">
                      Solicitar nuevo enlace
                    </Button>
                  </Link>
                </div>
              ) : success ? (
                <div className="space-y-6 text-center py-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 mb-2">¡Contraseña actualizada!</h3>
                    <p className="text-muted-foreground text-sm">
                      Tu contraseña fue restablecida exitosamente. Serás redirigido al inicio de sesión en unos segundos...
                    </p>
                  </div>
                  <Link to="/login">
                    <Button variant="outline" className="w-full h-12 border-green-200 text-green-700 hover:bg-green-50">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Ir al inicio de sesión
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-300 px-4 py-3 text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-green-700">Nueva contraseña</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        required
                        disabled={loading}
                        className="h-12 text-base pr-12"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" tabIndex={-1}>
                        {showPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-green-700">Confirmar contraseña</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                        disabled={loading}
                        className="h-12 text-base pr-12"
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" tabIndex={-1}>
                        {showConfirm ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit"
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white cursor-pointer"
                    disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Guardando...
                      </span>
                    ) : "Restablecer contraseña"}
                  </Button>

                  <div className="text-center">
                    <Link to="/login" className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium">
                      <ArrowLeft className="w-4 h-4" />
                      Volver al inicio de sesión
                    </Link>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}