// src/components/Dashboard/QualificationStatus.jsx
import React from 'react';

const QualificationStatus = ({ puntosActuales, puntosMeta, mesCierre }) => {
  // Lógica: Calculamos porcentaje (tope 100%)
  const porcentaje = Math.min((puntosActuales / puntosMeta) * 100, 100);
  const estaCalificado = puntosActuales >= puntosMeta;
  const puntosFaltantes = puntosMeta - puntosActuales;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Estado de Calificación</h3>
          <p className="text-sm text-gray-500">Ciclo {mesCierre}</p>
        </div>
        <div className="bg-gray-50 text-gray-500 text-xs px-3 py-1 rounded-full border border-gray-200 flex items-center gap-1">
          <span>🕒 Cierre en 30 días</span>
        </div>
      </div>

      <div className="mb-2">
        <span className="text-3xl font-extrabold text-gray-900">{puntosActuales}</span>
        <span className="text-sm font-medium text-gray-400"> pts</span>
      </div>
      <p className="text-sm text-gray-500 mb-4">Puntos de Red Acumulados</p>

      {/* Barra de Progreso */}
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between text-xs font-semibold text-gray-600">
          <span>Progreso: {Math.round(porcentaje)}%</span>
          <span>🎯 Meta: {puntosMeta} pts</span>
        </div>
        <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-gray-100 border border-gray-200">
          <div
            style={{ width: `${porcentaje}%` }}
            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ease-out 
              ${estaCalificado ? 'bg-green-500' : 'bg-green-400'}`}
          ></div>
        </div>
      </div>

      {/* Alerta de Estado */}
      {estaCalificado ? (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-medium">
          ✅ ¡Felicidades! Calificas para retiros.
        </div>
      ) : (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-medium">
          ⚠️ No calificas para retiros. Te faltan <strong>{puntosFaltantes} puntos</strong>.
        </div>
      )}
    </div>
  );
};

export default QualificationStatus;