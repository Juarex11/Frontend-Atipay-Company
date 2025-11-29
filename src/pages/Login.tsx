import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Shield, Users, Zap } from "lucide-react";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("Intentando iniciar sesión con:", formData.usernameOrEmail);

      const userData = await login(formData.usernameOrEmail, formData.password);

      console.log("Login exitoso:", userData);

      setError("¡Inicio de sesión exitoso! Redirigiendo...");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      console.error("Error en login:", err);

      let errorMessage =
        "Error al iniciar sesión. Por favor, verifica tus credenciales e inténtalo de nuevo.";

      if (err instanceof Error) {
        if (err.message.includes("Failed to fetch")) {
          errorMessage =
            "No se pudo conectar con el servidor. Verifica tu conexión a Internet. Asegúrate que el backend esté corriendo en http://127.0.0.1:8000";
        } else if (err.message.includes("User o contraseña incorrectos") || err.message.includes("Credenciales inválidas")) {
          errorMessage =
            "Usuario/email o contraseña incorrectos. Verifica que el usuario exista y la contraseña sea correcta.";
        } else if (err.message.includes("inactiva")) {
          errorMessage =
            "Tu cuenta está inactiva. Contacta a un administrador.";
        } else if (err.message) {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Branding */}
      <div className="lg:w-1/2 p-12 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-green-800 to-green-900 min-h-[50vh] lg:min-h-screen">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.svg')] opacity-10"></div>
        <div className="absolute top-20 right-20 w-64 h-64 bg-green-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-green-500/10 rounded-full blur-3xl"></div>

        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-8">
            <img
              src="/assets/atipay_logo2.png"
              alt="Atipay Logo"
              className="w-40 h-20 object-contain"
            />
          </div>
          <h2 className="text-4xl font-display font-bold text-white leading-tight">
            Sistema de Gestión
            <br />
            <span className="text-green-400">de Inversiones</span>
          </h2>
          <p className="text-white text-lg max-w-md">
            Plataforma integral para la gestión de inversiones colaborativas,
            afiliados y transacciones financieras.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-6 mt-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-900/50 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Inversiones Seguras</h3>
              <p className="text-white/80 text-sm">
                Plataforma 100% segura y regulada
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-900/50 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Red de Afiliados</h3>
              <p className="text-white/80 text-sm">
                Genera ingresos con nuestro programa de referidos
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-900/50 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Zap className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Retornos Rápidos</h3>
              <p className="text-white/80 text-sm">
                Disfruta de rendimientos atractivos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img
                src="/assets/atipay_logo2.png"
                alt="Atipay Logo"
                className="h-16 object-contain"
              />
            </div>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-green-900">
                Iniciar Sesión
              </CardTitle>
              <p className="text-muted-foreground text-sm mt-2">
                Ingresa tus credenciales para acceder a tu cuenta
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label
                    htmlFor="usernameOrEmail"
                    className="text-sm font-medium text-green-700"
                  >
                    Usuario o Correo electrónico
                  </Label>
                  <Input
                    id="usernameOrEmail"
                    name="usernameOrEmail"
                    type="text"
                    placeholder="usuario o correo@ejemplo.com"
                    value={formData.usernameOrEmail}
                    onChange={handleInputChange}
                    required
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-green-700"
                  >
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="h-12 text-base pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-luxury text-white cursor-pointer"
                  disabled={loading}
                >
                  {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      o
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-sm text-muted-foreground">
                    ¿No tienes una cuenta?{" "}
                  </span>
                  <Link
                    to="/register"
                    className="text-sm font-semibold text-green-600 hover:text-green-700"
                  >
                    Regístrate aquí
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
