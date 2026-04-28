const BASE = '/api';

// ── Auth token management ──────────────────────────────────
export function getToken() {
  return localStorage.getItem('rg_token');
}
export function setToken(token) {
  localStorage.setItem('rg_token', token);
}
export function clearToken() {
  localStorage.removeItem('rg_token');
  localStorage.removeItem('rg_gym');
}
export function getStoredGym() {
  try { return JSON.parse(localStorage.getItem('rg_gym')); } catch { return null; }
}
export function setStoredGym(gym) {
  localStorage.setItem('rg_gym', JSON.stringify(gym));
}

// ── Core request helper ────────────────────────────────────
async function request(method, path, { body, pin, multipart } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (pin) headers['X-Event-Pin'] = String(pin);

  let fetchBody;
  if (multipart) {
    // Don't set Content-Type — browser sets it with boundary for FormData
    fetchBody = body; // body is FormData
  } else {
    headers['Content-Type'] = 'application/json';
    fetchBody = body ? JSON.stringify(body) : undefined;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: fetchBody,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export const api = {
  // ── Events ──────────────────────────────────────────────
  getEvents: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/events${q ? `?${q}` : ''}`);
  },
  getEvent: (id) => request('GET', `/events/${id}`),
  createEvent: (formData) => request('POST', '/events', { body: formData, multipart: true }),
  updateEvent: (id, body) => request('PUT', `/events/${id}`, { body }),
  deleteEvent: (id) => request('DELETE', `/events/${id}`),
  verifyPin: (id, pin) => request('POST', `/events/${id}/verify-pin`, { body: { pin } }),

  // ── Racers ───────────────────────────────────────────────
  getRacers: (eventId) => request('GET', `/events/${eventId}/racers`),
  addRacer: (eventId, body, pin) => request('POST', `/events/${eventId}/racers`, { body, pin }),
  updateRacer: (racerId, body, pin) => request('PUT', `/racers/${racerId}`, { body, pin }),
  deleteRacer: (racerId, pin) => request('DELETE', `/racers/${racerId}`, { pin }),

  // ── Results ──────────────────────────────────────────────
  getResults: (eventId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/events/${eventId}/results${q ? `?${q}` : ''}`);
  },
  updateResult: (racerId, body, pin) => request('PUT', `/racers/${racerId}/result`, { body, pin }),
  bulkResults: (eventId, results, pin) =>
    request('POST', `/events/${eventId}/results/bulk`, { body: { results }, pin }),

  // ── Auth ─────────────────────────────────────────────────
  signup: (body) => request('POST', '/auth/signup', { body }),
  login: (body) => request('POST', '/auth/login', { body }),
  getMe: () => request('GET', '/auth/me'),
  stripeConnect: () => request('POST', '/auth/stripe/connect'),

  // ── Registrations ────────────────────────────────────────
  validateMemberCode: (eventId, code) => request('POST', `/events/${eventId}/validate-member-code`, { body: { code } }),
  checkout: (eventId, body) => request('POST', `/events/${eventId}/checkout`, { body }),
  getRegistrations: (eventId) => request('GET', `/events/${eventId}/registrations`),
  getConfirmation: (params) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/registration/confirmation?${q}`);
  },
};
