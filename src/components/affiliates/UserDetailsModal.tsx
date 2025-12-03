import { useEffect, useState } from "react";
import type { FC } from "react";
import { referralService } from "@/services/referral.service";

interface Props {
  user: any;
  onClose: () => void;
}

const UserDetailsModal: FC<Props> = ({ user, onClose }) => {
  const [network, setNetwork] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const loadNetwork = async () => {
      try {
        setLoading(true);
        const response = await referralService.getNetworkForUser(user.id);
        setNetwork(response.data || {});
      } catch (error) {
        setFetchError("No se pudo cargar la red del usuario.");
      } finally {
        setLoading(false);
      }
    };

    loadNetwork();
  }, [user.id]);

  return (
    <div
      className="
        fixed inset-0 flex items-center justify-center 
        bg-black/40 backdrop-blur-sm
        z-50 animate-fadeIn
      "
    >
      <div
        className="
          bg-white rounded-xl relative
          w-[600px] max-h-[85vh] overflow-y-auto
          p-6 shadow-2xl animate-slideUp 
          border border-green-700/30
        "
      >
        {/* Botón cierre X */}
        <button
          onClick={onClose}
          className="
            absolute top-3 right-3 
            text-gray-500 hover:text-gray-800 
            text-lg transition
          "
        >
          ✕
        </button>

        {/* Título */}
        <h2 className="text-2xl font-bold mb-4 text-green-900 border-b pb-2">
          Información del usuario
        </h2>

        {/* Información Base */}
        <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-lg border border-green-600/20">
          <p>
            <strong>ID:</strong> {user.id}
          </p>
          <p>
            <strong>Usuario:</strong> {user.username}
          </p>
          <p>
            <strong>Correo:</strong>{" "}
            <a
              href={`mailto:${user.email}`}
              className="text-green-700 underline hover:text-green-900"
            >
              {user.email}
            </a>
          </p>
          <p>
            <strong>Registrado:</strong> {user.registered_at}
          </p>
          <p>
            <strong>Estado:</strong>{" "}
            <span
            className={`px-2 py-0.5 rounded-md text-white ${
                user.status === "active" ? "bg-green-700" : "bg-gray-500"
            }`}
            >
                {user.status}
            </span>
            
            </p>
            <p className="text-xs text-gray-500 mt-2">
                 Nota: Este estado corresponde al usuario dentro de la red, no al listado general.
                </p>

        </div>

        {/* Red de afiliados */}
        <h3 className="text-lg font-semibold text-green-900 mt-6 mb-3">
          Red de afiliados
        </h3>

        {loading && (
          <p className="text-gray-500 text-sm">
            Cargando red…
          </p>
        )}

        {fetchError && (
          <p className="text-red-600 text-sm">
            {fetchError}
          </p>
        )}

        {!loading && !fetchError && (
          <>
            {network && Object.keys(network).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(network).map(
                  ([levelKey, users]: any, idx) => (
                    <div
                      key={idx}
                      className="
                        border border-green-700/20 bg-white
                        rounded-lg p-4 shadow-sm
                      "
                    >
                      <h4 className="font-semibold text-green-800 mb-2">
                        {levelKey.replace("_", " ").toUpperCase()}
                      </h4>

                      {users.length > 0 ? (
                        <ul className="space-y-1 text-sm">
                          {users.map((u: any) => (
                            <li
                              key={u.id}
                              className="pl-2 border-l border-green-600/40"
                            >
                              <span className="font-medium">{u.username}</span>{" "}
                              <span className="text-gray-500">
                                ({u.email})
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-sm">
                          Sin referidos en este nivel
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                Este usuario no tiene red de referidos.
              </p>
            )}
          </>
        )}

        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="
            mt-6 w-full 
            bg-green-700 hover:bg-green-800 
            text-white py-2 rounded-lg 
            transition font-medium
          "
        >
          Cerrar
        </button>
      </div>

      {/* Animaciones */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .animate-fadeIn {
          animation: fadeIn .25s ease-out;
        }

        .animate-slideUp {
          animation: slideUp .3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default UserDetailsModal;
