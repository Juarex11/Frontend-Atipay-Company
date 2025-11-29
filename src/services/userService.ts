import { API_BASE_URL } from '@/config';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role_id: number;
  status: string;
  atipay_money: number;
  accumulated_points: number;
  withdrawable_balance: string;
  reference_code: string;
  referred_by: string | null;
  registration_date: string;
  registration_time: string;
  referral_url: string;
}

export const getUserProfile = async (): Promise<UserProfile> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/user`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }

  return response.json();
};

export interface UpdateProfileResponse {
  message: string;
  data: {
    id: number;
    username: string;
    email: string;
    status: string;
    role: string;
  };
}

export const updateUserProfile = async (data: Record<string, string> | { username?: string; email?: string }): Promise<UpdateProfileResponse> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  // Validar que al menos un campo esté presente
  if (!data.username && !data.email) {
    throw new Error('Debe proporcionar al menos un campo para actualizar');
  }

  try {
    // Construir el payload SOLO con los campos que están definidos
    const updatePayload: Record<string, string> = {};

    if (data.username !== undefined && data.username !== null && data.username.trim() !== '') {
      updatePayload.username = data.username.trim();
    }

    if (data.email !== undefined && data.email !== null && data.email.trim() !== '') {
      updatePayload.email = data.email.trim();
    }

    const response = await fetch(`${API_BASE_URL}/partner/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updatePayload),
    });

    const responseText = await response.text();
    const responseData = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      const errorMessage = responseData?.message ||
        responseData?.error ||
        responseData?.detail ||
        `Server responded with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return responseData;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw error;
  }
};
