const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

// ============ HEALTH CHECK ============

export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error('Health check failed');
    }

    return await response.json();
  } catch (error) {
    // If health check fails, throw a more informative error
    throw error instanceof Error ? error : new Error('Health check request failed');
  }
}

// ============ AUTH API ============

export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  return await response.json();
}

export async function signup(email: string, password: string, confirmPassword: string) {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, confirmPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Signup failed');
  }

  return await response.json();
}

// ============ ACCOUNT MANAGEMENT API ============

export async function fetchAccounts() {
  const response = await fetch(`${API_BASE_URL}/admin/accounts`);

  if (!response.ok) {
    throw new Error('Failed to fetch accounts');
  }

  const data = await response.json();
  return data.accounts;
}

export async function createAccount(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/admin/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create account');
  }

  return await response.json();
}

export async function deleteAccount(id: string) {
  const response = await fetch(`${API_BASE_URL}/admin/accounts/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete account');
  }

  return await response.json();
}

export async function updateAccountPassword(id: string, newPassword: string) {
  const response = await fetch(`${API_BASE_URL}/admin/accounts/${id}/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update password');
  }

  return await response.json();
}

// ============ LOCATIONS API ============

export async function fetchLocations() {
  const response = await fetch(`${API_BASE_URL}/locations`);

  if (!response.ok) {
    throw new Error('Failed to fetch locations');
  }

  const data = await response.json();
  return data.locations;
}

export async function addLocation(locationData: {
  name: string;
  latitude: number;
  longitude: number;
  description: string;
  researcher1: string;
  researcher2?: string;
  radiusKm: number;
}) {
  const response = await fetch(`${API_BASE_URL}/locations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(locationData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add location');
  }

  return await response.json();
}

export async function deleteLocation(id: string) {
  const response = await fetch(`${API_BASE_URL}/locations/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete location');
  }

  return await response.json();
}
