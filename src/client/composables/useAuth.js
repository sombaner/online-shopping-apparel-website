/**
 * Auth Composable
 *
 * Provides authentication state and methods for Vue components.
 */

import { ref, computed, readonly } from 'vue';

// Auth state
const user = ref(null);
const accessToken = ref(null);
const refreshToken = ref(null);
const isAuthenticated = computed(() => !!accessToken.value && !!user.value);
const isLoading = ref(false);
const error = ref(null);

// Initialize from localStorage on load
function initializeAuth() {
  try {
    const storedUser = localStorage.getItem('user');
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');

    if (storedUser && storedAccessToken) {
      user.value = JSON.parse(storedUser);
      accessToken.value = storedAccessToken;
      refreshToken.value = storedRefreshToken;
    }
  } catch {
    clearAuth();
  }
}

/**
 * Clears authentication state
 */
function clearAuth() {
  user.value = null;
  accessToken.value = null;
  refreshToken.value = null;
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

/**
 * Sets authentication state
 */
function setAuth(authData) {
  user.value = authData.user;
  accessToken.value = authData.accessToken;
  refreshToken.value = authData.refreshToken;
  localStorage.setItem('user', JSON.stringify(authData.user));
  localStorage.setItem('accessToken', authData.accessToken);
  localStorage.setItem('refreshToken', authData.refreshToken);
}

/**
 * Login with email and password
 */
async function login(email, password) {
  isLoading.value = true;
  error.value = null;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      error.value = data.error?.message || 'Login failed';
      return { success: false, error: error.value };
    }

    setAuth(data);
    return { success: true, user: data.user };
  } catch {
    error.value = 'An error occurred during login';
    return { success: false, error: error.value };
  } finally {
    isLoading.value = false;
  }
}

/**
 * Register a new user
 */
async function register(userData) {
  isLoading.value = true;
  error.value = null;

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.error?.details?.errors) {
        error.value = data.error.details.errors.join('. ');
      } else {
        error.value = data.error?.message || 'Registration failed';
      }
      return { success: false, error: error.value };
    }

    return { success: true, message: data.message };
  } catch {
    error.value = 'An error occurred during registration';
    return { success: false, error: error.value };
  } finally {
    isLoading.value = false;
  }
}

/**
 * Logout the current user
 */
function logout() {
  clearAuth();
}

/**
 * Refresh access token
 */
async function refreshAccessToken() {
  if (!refreshToken.value) {
    return { success: false, error: 'No refresh token available' };
  }

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshToken.value }),
    });

    const data = await response.json();

    if (!response.ok) {
      clearAuth();
      return { success: false, error: data.error?.message || 'Token refresh failed' };
    }

    accessToken.value = data.accessToken;
    refreshToken.value = data.refreshToken;
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    return { success: true };
  } catch {
    clearAuth();
    return { success: false, error: 'Token refresh failed' };
  }
}

/**
 * Fetch current user profile
 */
async function fetchCurrentUser() {
  if (!accessToken.value) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Try to refresh token
        const refreshResult = await refreshAccessToken();
        if (refreshResult.success) {
          return fetchCurrentUser();
        }
        clearAuth();
      }
      return { success: false, error: 'Failed to fetch user' };
    }

    const data = await response.json();
    user.value = data.user;
    localStorage.setItem('user', JSON.stringify(data.user));

    return { success: true, user: data.user };
  } catch {
    return { success: false, error: 'Failed to fetch user' };
  }
}

/**
 * Request password reset
 */
async function requestPasswordReset(email) {
  isLoading.value = true;
  error.value = null;

  try {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      error.value = data.error?.message || 'Request failed';
      return { success: false, error: error.value };
    }

    return { success: true, message: data.message };
  } catch {
    error.value = 'An error occurred';
    return { success: false, error: error.value };
  } finally {
    isLoading.value = false;
  }
}

/**
 * Create authenticated fetch wrapper
 */
async function authFetch(url, options = {}) {
  if (!accessToken.value) {
    throw new Error('Not authenticated');
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken.value}`,
  };

  let response = await fetch(url, { ...options, headers });

  // If unauthorized, try to refresh token
  if (response.status === 401) {
    const refreshResult = await refreshAccessToken();
    if (refreshResult.success) {
      headers.Authorization = `Bearer ${accessToken.value}`;
      response = await fetch(url, { ...options, headers });
    } else {
      clearAuth();
      throw new Error('Session expired');
    }
  }

  return response;
}

// Composable export
export function useAuth() {
  // Initialize auth state on first use
  initializeAuth();

  return {
    // State (readonly)
    user: readonly(user),
    accessToken: readonly(accessToken),
    isAuthenticated,
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Methods
    login,
    register,
    logout,
    refreshAccessToken,
    fetchCurrentUser,
    requestPasswordReset,
    authFetch,
    clearAuth,
  };
}

export default useAuth;
