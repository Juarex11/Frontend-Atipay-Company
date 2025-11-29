import { API_BASE_URL } from '@/config';
import { getAuthHeaders } from '@/utils/auth';

interface RechargeData {
  amount: number;
  method: string;
  type_usage: 'investment' | 'withdrawal' | 'transfer';
  proof_image: File;
}

export const createRecharge = async (data: RechargeData) => {
  const formData = new FormData();
  formData.append('amount', data.amount.toString());
  formData.append('method', data.method);
  formData.append('type_usage', data.type_usage);
  formData.append('proof_image', data.proof_image);

  const response = await fetch(`${API_BASE_URL}/atipay-recharges`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData
  });

  if (!response.ok) {
    throw new Error('Error creating recharge');
  }

  return response.json();
};

export const getRecharges = async () => {
  const response = await fetch(`${API_BASE_URL}/atipay-recharges`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Error fetching recharges');
  }

  return response.json();
};

export const getMyRecharges = async () => {
  const response = await fetch(`${API_BASE_URL}/atipay-recharges/my`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Error fetching user recharges');
  }

  return response.json();
};

export const getRechargeById = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/atipay-recharges/${id}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Error fetching recharge');
  }

  return response.json();
};

export const approveRecharge = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/atipay-recharges/${id}/approve`, {
    method: 'POST',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Error approving recharge');
  }

  return response.json();
};

export const rejectRecharge = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/atipay-recharges/${id}/reject`, {
    method: 'POST',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Error rejecting recharge');
  }

  return response.json();
};

// Transfer related functions
export const getSentTransfers = async () => {
  const response = await fetch(`${API_BASE_URL}/atipay-transfers/sent`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Error fetching sent transfers');
  }

  return response.json();
};

export const getReceivedTransfers = async () => {
  const response = await fetch(`${API_BASE_URL}/atipay-transfers/received`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Error fetching received transfers');
  }

  return response.json();
};

interface CreateTransferData {
  receiver_id: number;
  amount: number;
  type: 'investment' | 'withdrawal' | 'transfer';
}

export const createTransfer = async (data: CreateTransferData) => {
  const response = await fetch(`${API_BASE_URL}/atipay-transfers`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('Error creating transfer');
  }

  return response.json();
};

export const confirmTransfer = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/atipay-transfers/confirm/${id}`, {
    method: 'POST',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Error confirming transfer');
  }

  return response.json();
};

export const getTransferById = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/atipay-transfers/${id}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Error fetching transfer');
  }

  return response.json();
};
