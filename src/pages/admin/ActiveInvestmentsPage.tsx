import React, { useEffect, useState } from "react";
import { getActiveInvestmentsSummaryForAdmin } from "../../services/investmentService";
import type { InvestmentSummary } from "../../services/investmentService";
import { FiSearch } from "react-icons/fi";

// Calcula días transcurridos desde una fecha hasta hoy
const getDiasTranscurridos = (fechaInicio: string): number => {
  if (!fechaInicio) return 0;

  const inicio = new Date(fechaInicio + "T00:00:00");
  const hoy = new Date();

  // Ajustar zonas horarias para evitar desfases
  inicio.setHours(0, 0, 0, 0);
  hoy.setHours(0, 0, 0, 0);

  const diff = hoy.getTime() - inicio.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const ActiveInvestmentsPage: React.FC = () => {
  const [data, setData] = useState<InvestmentSummary[]>([]);
  const [filteredData, setFilteredData] = useState<InvestmentSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getActiveInvestmentsSummaryForAdmin();
      setData(response);
      setFilteredData(response);
      setLoading(false);
    } catch (error) {
      console.error("Error cargando inversiones activas:", error);
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    const lower = value.toLowerCase();

    setFilteredData(
      data.filter(
        (i) =>
          i.usuario_nombre.toLowerCase().includes(lower) ||
          i.promocion_nombre.toLowerCase().includes(lower) ||
          String(i.monto_invertido).includes(lower)
      )
    );
  };

  console.log("DATA DEL BACKEND:", filteredData);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        Inversiones Activas
      </h1>

      {/* SEARCH BAR */}
      <div className="flex items-center bg-white shadow rounded-lg p-2 mb-6 w-96">
        <FiSearch className="text-gray-500 text-xl ml-2" />
        <input
          type="text"
          placeholder="Buscar por usuario o plan..."
          className="ml-2 w-full outline-none"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-center py-10 text-lg text-gray-500">
          Cargando inversiones...
        </div>
      )}

      {/* TABLE */}
      {!loading && (
        <div className="overflow-x-auto shadow-md rounded-xl bg-white">
          <table className="min-w-full text-left">
            <thead className="bg-gradient-to-r from-green-900 to-green-500 text-white">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">R. Diario</th>
                <th className="px-4 py-3">Generado</th>
                <th className="px-4 py-3">Inicio</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>

            {/* IMPLEMENTACIÓN COMPLETA EXACTA */}
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-100 transition cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium">
                    {item.usuario_nombre}
                    <div className="text-xs text-gray-500">
                      {item.usuario_email}
                    </div>
                  </td>

                  <td className="px-4 py-3">{item.promocion_nombre}</td>

                  <td className="px-4 py-3 font-semibold text-green-700">
                    ${item.monto_invertido}
                  </td>

                  <td className="px-4 py-3 text-blue-700">
                    ${item.retorno_diario_calculado}
                  </td>

                  <td className="px-4 py-3 text-orange-700">
                    ${item.retorno_total_generado}
                  </td>

                  <td className="px-4 py-3">
                    {item.fecha_inicio}
                    <div className="text-xs text-gray-500">
                      {item.dias_transcurridos} días transcurridos
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="px-3 py-1 bg-green-600 text-white text-xs rounded-full">
                      {item.estado.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredData.length === 0 && (
            <div className="py-6 text-center text-gray-500">
              No hay resultados con ese filtro.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActiveInvestmentsPage;
