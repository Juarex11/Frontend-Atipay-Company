import { useState, useEffect } from 'react';
import { Gift as GiftIcon, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { giftService } from '../../services/giftService';
import { GiftDetailsModal } from './GiftDetailsModal';
import { useAuth } from '@/hooks/useAuth';
import type { Gift } from '../../types/gift';

interface RewardRequest {
  id: number;
  user_id: number;
  reward_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'claimed';
  admin_message?: string;
  reward: {
    id: number;
    name: string;
    image_url: string;
  };
}

const UserGiftCatalog = () => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [viewingGift, setViewingGift] = useState<Gift | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [claimingRequestId, setClaimingRequestId] = useState<number | null>(null);
  const [rewardRequests, setRewardRequests] = useState<RewardRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'catalog' | 'history'>('catalog');
  const { user } = useAuth();

  useEffect(() => {
    const fetchGifts = async () => {
      setIsLoading(true);
      try {
        const data = await giftService.getGifts();
        setGifts(data);
      } catch (error) {
        console.error('Error fetching gifts:', error);
        toast.error('Error al cargar el catálogo de regalos');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchData = async () => {
      try {
        await Promise.all([
          fetchGifts(),
          fetchRewardRequests()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const fetchRewardRequests = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/rewards/my-requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar el historial de recompensas');
      }

      const data = await response.json();
      setRewardRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching reward requests:', error);
      toast.error('Error al cargar el historial de recompensas');
    }
  };

  const getRequestStatus = (giftId: number) => {
    const request = rewardRequests.find(
      req => req.reward_id === giftId && (req.status === 'pending' || req.status === 'approved')
    );
    if (!request) return null;

    return {
      status: request.status,
      message: request.admin_message,
      requestId: request.id
    };
  };

  const handleRedeemRequest = async (gift: Gift) => {
    if (isRedeeming) return;

    setSelectedGift(gift);
    setIsRedeeming(true);

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/rewards/${gift.id}/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al solicitar el canje');
      }

      toast.success(data.message || 'Solicitud de canje enviada exitosamente');
      await fetchRewardRequests();

    } catch (error) {
      console.error('Error redeeming gift:', error);
      toast.error(error instanceof Error ? error.message : 'Error al solicitar el canje');
    } finally {
      setIsRedeeming(false);
      setSelectedGift(null);
    }
  };

  const handleClaimRequest = async (requestId: number) => {
    if (claimingRequestId !== null) return;

    setClaimingRequestId(requestId);

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/reward-requests/${requestId}/claim`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al reclamar el regalo');
      }

      toast.success(data.message || 'Regalo reclamado exitosamente');
      await Promise.all([fetchRewardRequests(), giftService.getGifts().then(setGifts)]);

    } catch (error) {
      console.error('Error claiming gift:', error);
      toast.error(error instanceof Error ? error.message : 'Error al reclamar el regalo');
    } finally {
      setClaimingRequestId(null);
    }
  };


  const handleGiftClick = (gift: Gift) => {
    setViewingGift(gift);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprobado
          </span>
        );
      case 'claimed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <GiftIcon className="w-3 h-3 mr-1" />
            Reclamado
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rechazado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <GiftDetailsModal
        isOpen={!!viewingGift}
        onClose={() => setViewingGift(null)}
        gift={viewingGift}
        onRedeem={viewingGift ? () => handleRedeemRequest(viewingGift) : undefined}
        requestStatus={viewingGift ? getRequestStatus(Number(viewingGift.id)) : null}
      />

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Catálogo de Recompensas</h1>
        <p className="text-gray-500 text-sm mb-4">Canjea tus puntos por increíbles premios</p>

        <div className="inline-flex rounded-md shadow-sm mb-2" role="group">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${activeTab === 'catalog'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            Catálogo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            Mis Solicitudes
          </button>
        </div>
      </div>

      {activeTab === 'catalog' ? (
        <div>
          {gifts.length === 0 ? (
            <div className="text-center py-8">
              <GiftIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-400 text-sm">No hay recompensas disponibles en este momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {gifts.map((gift) => (
                <div
                  key={gift.id}
                  onClick={() => handleGiftClick(gift)}
                  className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden flex flex-col h-full cursor-pointer hover:border-blue-200"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleGiftClick(gift)}
                  aria-label={`Ver detalles de ${gift.name}`}
                >
                  <div className="relative pt-[100%] bg-gray-50">
                    <div className="absolute inset-0 flex items-center justify-center p-2">
                      {gift.image_url ? (
                        <img
                          src={gift.image_url}
                          alt={gift.name}
                          className="w-full h-full object-contain max-h-[120px]"
                        />
                      ) : (
                        <GiftIcon className="h-10 w-10 text-gray-300" />
                      )}
                    </div>
                    <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${gift.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>Stock: {gift.stock > 0 ? gift.stock : '0'}</span>
                      {gift.redemption_info ? (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${gift.redemption_info.remaining_redeems > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          N° Canjes: {gift.redemption_info.remaining_redeems}/{gift.max_redeem}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">Máx: {gift.max_redeem}</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 flex flex-col flex-grow">
                    <h3 className="font-medium text-gray-800 text-sm mb-1 line-clamp-2 h-8">
                      {gift.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2 h-8">
                      {gift.description}
                    </p>

                    <div className="mt-auto">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-blue-600">{gift.redeem_points ?? 0} pts</span>
                      </div>
                      {(() => {
                        const redemptionInfo = gift.redemption_info;
                        const request = getRequestStatus(Number(gift.id));

                        // si la solicitud es aprobada, que aparezca el boton de reclamar
                        if (request && request.status === 'approved') {
                          return (
                            <div className="text-center">
                              <div className="mb-1">
                                {renderStatusBadge(request.status)}
                              </div>
                              {request.message && (
                                <p className="text-xs text-gray-500 truncate mb-2" title={request.message}>
                                  {request.message}
                                </p>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClaimRequest(request.requestId);
                                }}
                                disabled={claimingRequestId !== null}
                                className={`w-full py-1.5 px-2 text-xs rounded-md font-medium transition-colors bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 ${claimingRequestId === request.requestId ? 'opacity-70' : ''}`}
                                aria-label={`Reclamar ${gift.name}`}
                              >
                                {claimingRequestId === request.requestId ? (
                                  <span className="inline-block h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1"></span>
                                ) : (
                                  'Reclamar Regalo'
                                )}
                              </button>
                            </div>
                          );
                        }

                        // si la solicitud está pendiente
                        if (request && request.status === 'pending') {
                          return (
                            <div className="text-center">
                              <div className="mb-1">
                                {renderStatusBadge(request.status)}
                              </div>
                              {request.message && (
                                <p className="text-xs text-gray-500 truncate" title={request.message}>
                                  {request.message}
                                </p>
                              )}
                            </div>
                          );
                        }

                        // si llegó al limite de canjes
                        if (redemptionInfo?.has_reached_limit) {
                          return (
                            <div className="text-center">
                              <div className="mb-1">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-500">
                                  Límite de canjes alcanzado
                                </span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRedeemRequest(gift);
                            }}
                            disabled={gift.stock === 0 || isRedeeming || !redemptionInfo?.can_redeem}
                            className={`w-full py-1.5 px-2 text-xs rounded-md font-medium transition-colors ${gift.stock === 0 || !redemptionInfo?.can_redeem
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                              } ${isRedeeming && selectedGift?.id === gift.id ? 'opacity-70' : ''}`}
                            aria-label={`Canjear ${gift.name} por ${gift.redeem_points} puntos`}
                          >
                            {isRedeeming && selectedGift?.id === gift.id ? (
                              <span className="inline-block h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1"></span>
                            ) : (
                              'Solicitar Canje'
                            )}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Historial de Solicitudes</h3>
            <p className="mt-1 text-sm text-gray-500">Revisa el estado de tus solicitudes de canje</p>
          </div>

          {rewardRequests.length === 0 ? (
            <div className="text-center py-12">
              <GiftIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">No tienes solicitudes recientes</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {rewardRequests.map((request) => (
                <li key={request.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="min-w-0 flex-1 flex items-center">
                      <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden bg-gray-100">
                        <img
                          src={request.reward.image_url}
                          alt={request.reward.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 px-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {request.reward.name}
                          </h4>
                          <div className="mt-1">
                            {renderStatusBadge(request.status)}
                          </div>
                          {request.admin_message && (
                            <p className="mt-1 text-sm text-gray-500 truncate">
                              {request.admin_message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ml-5 flex-shrink-0">
                      <span className="text-sm font-medium text-gray-500">
                        #{request.id}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default UserGiftCatalog;
