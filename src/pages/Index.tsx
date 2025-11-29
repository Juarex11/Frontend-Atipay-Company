import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface DemoResponse {
  message: string;
}

export default function Index() {
  const { user } = useAuth();
  const [exampleFromServer, setExampleFromServer] = useState("");

  useEffect(() => {
    fetchDemo();
  }, []);
  const fetchDemo = async () => {
    try {
      const response = await fetch("/api/demo");
      const data = await response.json() as DemoResponse;
      setExampleFromServer(data.message);
    } catch (error) {
      console.error("Error fetching demo data:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-600 to-navy-800">
      <div className="text-center p-6 max-w-2xl mx-auto">
        <h1 className="text-4xl font-display font-bold text-white mb-6">
          Bienvenido a AtiPay
        </h1>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-xl">
          <p className="text-lg text-white/90 mb-4">
            {user ? (
              `Hola, ${user.firstName}! Estás autenticado y listo para comenzar.`
            ) : (
              "Inicia sesión para acceder a tu panel de control."
            )}
          </p>

          <div className="mt-6">
            <p className="text-white/70 text-sm">
              Estado del sistema: <span className="text-green-400 font-medium">Operacional</span>
            </p>
            {exampleFromServer && (
              <p className="mt-2 text-white/60 text-xs">
                {exampleFromServer}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
