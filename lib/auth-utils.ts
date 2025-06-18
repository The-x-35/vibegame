/**
 * Authentication utilities for managing JWT tokens and user sessions
 */

export interface AuthToken {
  token: string;
  expiresAt: number;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    wallet: string;
    name?: string;
  };
  expiresIn: number;
}

/**
 * Login with wallet address
 */
export async function loginWithWallet(wallet: string): Promise<LoginResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ wallet }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  const data: LoginResponse = await response.json();
  
  // Store the token
  storeAuthToken(data.token, data.expiresIn);
  
  return data;
}

/**
 * Store authentication token in localStorage
 */
export function storeAuthToken(token: string, expiresIn: number = 3600): void {
  const expiresAt = Date.now() + (expiresIn * 1000);
  const authData: AuthToken = { token, expiresAt };
  localStorage.setItem('authToken', JSON.stringify(authData));
}

/**
 * Get authentication token from localStorage
 */
export function getAuthToken(): string | null {
  try {
    const authData = localStorage.getItem('authToken');
    if (!authData) return null;

    const parsed: AuthToken = JSON.parse(authData);
    
    // Check if token is expired
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem('authToken');
      return null;
    }

    return parsed.token;
  } catch (error) {
    console.error('Error parsing auth token:', error);
    localStorage.removeItem('authToken');
    return null;
  }
}

/**
 * Remove authentication token from localStorage
 */
export function removeAuthToken(): void {
  localStorage.removeItem('authToken');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

/**
 * Get authorization header for API requests
 */
export function getAuthHeader(): { Authorization: string } | {} {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Create authenticated fetch options
 */
export function createAuthFetchOptions(options: RequestInit = {}): RequestInit {
  const token = getAuthToken();
  return {
    ...options,
    headers: {
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
} 