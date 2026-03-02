const API_BASE = 'http://localhost:3001/api';

function getToken() {
  return localStorage.getItem('gait_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiLogin(email, password, role) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  return data;
}

export async function apiSignup(firstName, lastName, email, password, role) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, lastName, email, password, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Signup failed');
  return data;
}

export async function apiRegister(email, password, role, name) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function apiGetMe() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Auth check failed');
  return data;
}

export async function apiUploadCSV(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/data/upload`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

export async function apiGetSessions() {
  const res = await fetch(`${API_BASE}/data/sessions`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch sessions');
  return data;
}

export async function apiGetSession(id) {
  const res = await fetch(`${API_BASE}/data/sessions/${id}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch session');
  return data;
}

export async function apiSaveMetrics(sessionId, metrics) {
  const res = await fetch(`${API_BASE}/data/sessions/${sessionId}/metrics`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ metrics }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save metrics');
  return data;
}

export async function apiDeleteSession(id) {
  const res = await fetch(`${API_BASE}/data/sessions/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete session');
  return data;
}

export async function apiHealthCheck() {
  const res = await fetch(`${API_BASE}/health`);
  return res.ok;
}
