import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { API_BASE_URL } from "@/config";

export default function QualificationStatus() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/monthly-points/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setStatus(await res.json());
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  if (loading) return <div>Cargando estado...</div>;
  if (!status) return null;

  const percentage = Math.min((status.current_points / status.min_points) * 100, 100);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Tarjeta de Estado */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">Estado de Calificación</CardTitle>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-4 w-4" />
            Cierre en 30 días
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <span className="text-3xl font-bold">{status.current_points}</span>
            <span className="text-sm text-muted-foreground ml-1">pts</span>
            <p className="text-xs text-muted-foreground">Puntos de Red Acumulados</p>
          </div>

          {/* Barra de Progreso */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div 
              className={`h-2.5 rounded-full ${status.qualified ? 'bg-green-600' : 'bg-yellow-500'}`} 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mb-4">
            <span>Progreso: {Math.round(percentage)}%</span>
            <span>Meta: {status.min_points} pts</span>
          </div>

          {/* Mensaje de Alerta/Éxito */}
          <div className={`p-3 rounded-md flex items-center text-sm ${status.qualified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {status.qualified ? (
              <><CheckCircle className="h-5 w-5 mr-2" /> ¡Felicidades! Calificas para retiros.</>
            ) : (
              <><AlertCircle className="h-5 w-5 mr-2" /> No calificas para retiros. Te faltan {status.min_points - status.current_points} puntos.</>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Aquí podrías poner el gráfico anual si lo deseas */}
    </div>
  );
}