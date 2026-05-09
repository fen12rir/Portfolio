const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api');

const withJson = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }
  return response.json().catch(() => null);
};

export const loginAdmin = async (password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({ password }),
    });

    const payload = await withJson(response);
    if (!response.ok || !payload?.success) {
      return { success: false, error: payload?.error || 'Login failed' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || 'Login failed' };
  }
};

export const logoutAdmin = async () => {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
  } catch {
    // Ignore logout network errors; local UI state still clears.
  }
};

export const getAdminSession = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/session`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      return false;
    }

    const payload = await withJson(response);
    return Boolean(payload?.authenticated || payload?.success);
  } catch {
    return false;
  }
};
