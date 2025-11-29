export const TOKEN_KEY = 'token';

export function getAuthHeaders(contentType: string | null = 'application/json'): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    console.warn('No authentication token found');
    throw new Error('No authentication token found');
  }

  if (isTokenExpired(token)) {
    clearAuthData();
    throw new Error('Token expired');
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  };

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  return headers;
}

export function isAuthenticated(): boolean {
  const token = localStorage.getItem(TOKEN_KEY);
  return !!token && !isTokenExpired(token);
}

export function clearAuthData(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isTokenExpired(token: string): boolean {
  try {
    if (token.split('.').length !== 3) return true;

    return false;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
}

export function redirectToLogin(): void {
  clearAuthData();

  const redirectUrl = window.location.pathname + window.location.search;
  if (redirectUrl !== '/login') {
    sessionStorage.setItem('redirect_after_login', redirectUrl);
  }

  window.location.href = '/login';
}
