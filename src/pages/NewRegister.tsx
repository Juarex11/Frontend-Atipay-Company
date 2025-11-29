import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Shield, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { API_ROUTES } from "@/config/api.routes";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type FormData = {
  email: string;
  username: string;
  password: string;
  referralCode: string;
  phone: string;
};

export default function NewRegister() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    email: "",
    username: "",
    password: "",
    referralCode: searchParams.get("ref") || "",
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    console.log('Form data:', formData);
    console.log('URL search params:', Object.fromEntries(searchParams.entries()));

    // Validar código de referencia
    if (!formData.referralCode.trim()) {
      console.error('No referral code found in form data');
      setError("Por favor ingresa un código de referencia");
      return;
    }

    // Validar número de teléfono
    if (!formData.phone.trim()) {
      console.error('No phone number found in form data');
      setError("Por favor ingresa un número de teléfono");
      return;
    }

    // Validar formato de número de teléfono (solo números y longitud adecuada)
    const phoneRegex = /^\d{9,12}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      console.error('Invalid phone number format');
      setError("El número de teléfono debe contener solo números y tener entre 9 y 12 dígitos");
      return;
    }

    setIsLoading(true);

    try {
      const requestBody = new FormData();
      requestBody.append('username', formData.username.trim());
      requestBody.append('email', formData.email.trim());
      requestBody.append('password', formData.password);
      requestBody.append('password_confirmation', formData.password);
      requestBody.append('reference_code', formData.referralCode.trim());
      requestBody.append('phone_number', formData.phone.trim());

      console.log('Sending registration request to:', API_ROUTES.AUTH.REGISTER);
      console.log('Request form data:');
      for (const [key, value] of requestBody.entries()) {
        console.log(key, value);
      }

      const response = await fetch(API_ROUTES.AUTH.REGISTER, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: requestBody,
      });

      console.log('Registration response status:', response.status);
      const data = await response.json().catch(() => ({}));
      console.log('Registration response data:', data);

      if (!response.ok) {
        const errorMsg = data.message || data.error || 'Error al registrar el usuario';
        console.error('Registration failed:', errorMsg);
        throw new Error(errorMsg);
      }

      // Show success modal
      setShowSuccessModal(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error
        ? err.message
        : "Error al crear la cuenta. Por favor, inténtalo de nuevo.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Si es el campo de referencia y tenemos un código en la URL, no permitir cambios
    if (name === 'referralCode' && searchParams.get("ref")) {
      return; // No permitir modificar el código de referencia que viene de la URL
    }

    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'email' && !prev.username ? { username: value.split('@')[0] } : {})
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
            Crea tu cuenta
            <br />
            <span className="text-green-400">en Atipay</span>
          </h2>
          <p className="text-white text-lg max-w-md">
            Únete a nuestra plataforma de inversiones colaborativas y comienza a hacer crecer tu dinero de manera inteligente.
          </p>
        </div>

        <div className="hidden lg:flex items-center space-x-4 text-white/80 text-sm">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Seguridad garantizada</span>
          </div>
          <div className="w-px h-4 bg-white/20"></div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Más de 10,000 usuarios</span>
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
                Crear Cuenta
              </CardTitle>
              <p className="text-muted-foreground text-sm mt-2">
                Completa el formulario para registrarte
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-green-700">
                      Nombre y Apellidos
                    </Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Ingresa tu nombre completo"
                      className="h-12 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-green-700">
                      Correo electrónico
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="tucorreo@ejemplo.com"
                      className="h-12 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-green-700">
                      Número de teléfono <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Ej: 999999999"
                      className="h-12 text-base"
                      pattern="[0-9]{9,12}"
                      title="El número debe contener entre 9 y 12 dígitos numéricos"
                      maxLength={12}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referralCode" className="text-sm font-medium text-green-700">
                      Código de referencia <span className="text-red-500">*</span>
                      {searchParams.get("ref") && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          Pre-completado
                        </span>
                      )}
                    </Label>
                    <div className="relative">
                      <Input
                        id="referralCode"
                        name="referralCode"
                        type="text"
                        value={formData.referralCode}
                        onChange={handleInputChange}
                        placeholder="Ingresa el código de referencia"
                        className={`h-12 text-base ${searchParams.get("ref") ? "bg-gray-100 pr-10" : ""}`}
                        readOnly={!!searchParams.get("ref")}
                        required
                      />
                      {searchParams.get("ref") && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock">
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-green-700">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className="h-12 pr-10 text-base"
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Creando cuenta...
                    </>
                  ) : (
                    'Crear cuenta'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-600">
                ¿Ya tienes una cuenta?{' '}
                <Link to="/login" className="font-medium text-green-600 hover:text-green-700 hover:underline">
                  Inicia sesión
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate('/login');
        }}
        onConfirm={() => {
          setShowSuccessModal(false);
          navigate('/login');
        }}
        title="¡Registro Exitoso!"
        message="Tu cuenta ha sido creada exitosamente. Serás redirigido al inicio de sesión."
        confirmText="Ir al Inicio de Sesión"
        cancelText=""
      />
    </div>
  );
}
