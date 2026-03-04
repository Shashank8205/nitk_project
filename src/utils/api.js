const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('gait_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse(res) {
  const contentType = res.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    return await res.json();
  } else {
    const text = await res.text();
    // If response is HTML or plain text, throw a more descriptive error
    if (res.status === 500) {
      throw new Error('Server error - backend may not be running or database connection failed');
    } else if (res.status === 404) {
      throw new Error('API endpoint not found - backend may not be running');
    } else if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}: ${text.substring(0, 100)}`);
    }
    return { status: res.status, text };
  }
}

export async function apiLogin(email, password, role) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    
    const data = await parseResponse(res);
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
  } catch (err) {
    throw new Error(err.message || 'Login failed - please ensure backend is running');
  }
}

export async function apiSignup(firstName, lastName, email, password, role) {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, password, role }),
    });
    const data = await parseResponse(res);
    if (!res.ok) throw new Error(data.message || 'Signup failed');
    return data;
  } catch (err) {
    throw new Error(err.message || 'Signup failed - please ensure backend is running');
  }
}

export async function apiRegister(email, password, role, name, phone, uniqueId) {
  try {
    const body = { email, password, role, name };
    if (phone) body.phone = phone;
    if (uniqueId) body.uniqueId = uniqueId;
    
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await parseResponse(res);
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  } catch (err) {
    throw new Error(err.message || 'Registration failed - please ensure backend is running');
  }
}

export async function apiGetMe() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: authHeaders(),
    });
    const data = await parseResponse(res);
    if (!res.ok) throw new Error(data.error || 'Auth check failed');
    return data;
  } catch (err) {
    throw new Error(err.message || 'Auth check failed - please ensure backend is running');
  }
}

export async function apiUploadCSV(file, patientId) {
  try {
    // Parse the CSV file first
    const Papa = await import('papaparse');
    const parsedData = await new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const cleaned = results.data.filter((row) =>
            Object.values(row).some((v) => v !== null && v !== undefined && v !== '')
          );
          resolve(cleaned);
        },
        error: (err) => reject(err),
      });
    });

    // Send the parsed data as JSON
    const body = {
      filename: file.name,
      data: parsedData,
      metrics: {
        duration: parsedData.length > 0 ? parsedData.length : 0
      }
    };

    // When a doctor uploads on behalf of a patient, include patientId
    if (patientId) {
      body.patientId = patientId;
    }

    const res = await fetch(`${API_BASE}/sessions/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    });
    const responseData = await parseResponse(res);
    if (!res.ok) throw new Error(responseData.error || 'Upload failed');
    return responseData;
  } catch (err) {
    throw new Error(err.message || 'Upload failed - please ensure backend is running');
  }
}

export async function apiGetSessions() {
  try {
    const res = await fetch(`${API_BASE}/sessions`, {
      headers: authHeaders(),
    });
    const data = await parseResponse(res);
    if (!res.ok) throw new Error(data.error || 'Failed to fetch sessions');
    return data;
  } catch (err) {
    throw new Error(err.message || 'Failed to fetch sessions - please ensure backend is running');
  }
}

export async function apiGetSession(id) {
  try {
    const res = await fetch(`${API_BASE}/sessions/${id}`, {
      headers: authHeaders(),
    });
    const data = await parseResponse(res);
    if (!res.ok) throw new Error(data.error || 'Failed to fetch session');
    return data;
  } catch (err) {
    throw new Error(err.message || 'Failed to fetch session - please ensure backend is running');
  }
}

export async function apiSaveMetrics(sessionId, metrics) {
  try {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/metrics`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ metrics }),
    });
    const data = await parseResponse(res);
    if (!res.ok) throw new Error(data.error || 'Failed to save metrics');
    return data;
  } catch (err) {
    throw new Error(err.message || 'Failed to save metrics - please ensure backend is running');
  }
}

export async function apiDeleteSession(id) {
  try {
    const res = await fetch(`${API_BASE}/sessions/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = await parseResponse(res);
    if (!res.ok) throw new Error(data.error || 'Failed to delete session');
    return data;
  } catch (err) {
    throw new Error(err.message || 'Failed to delete session - please ensure backend is running');
  }
}

export async function apiHealthCheck() {
  const res = await fetch(`${API_BASE}/health`);
  return res.ok;
}

export async function apiAddPatient(firstName, lastName, email, password, phone, age, height, weight) {
  try {
    const res = await fetch(`${API_BASE}/auth/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ firstName, lastName, email, password, phone, age, height, weight }),
    });
    const data = await parseResponse(res);
    if (!res.ok) throw new Error(data.error || 'Failed to add patient');
    return data;
  } catch (err) {
    throw new Error(err.message || 'Failed to add patient - please ensure backend is running');
  }
}

export async function apiGetPatients() {
  try {
    const res = await fetch(`${API_BASE}/auth/patients`, {
      headers: authHeaders(),
    });
    const data = await parseResponse(res);
    if (!res.ok) throw new Error(data.error || 'Failed to fetch patients');
    return data;
  } catch (err) {
    throw new Error(err.message || 'Failed to fetch patients - please ensure backend is running');
  }
}

export async function apiDeletePatient(patientId) {
  try {
    const res = await fetch(`${API_BASE}/auth/patients/${patientId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = await parseResponse(res);
    if (!res.ok) throw new Error(data.message || data.error || 'Failed to delete patient');
    return data;
  } catch (err) {
    throw new Error(err.message || 'Failed to delete patient - please ensure backend is running');
  }
}
