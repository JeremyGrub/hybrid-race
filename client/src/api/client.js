const BASE = '/api';

async function request(method, path, { body, pin } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (pin) headers['X-Event-Pin'] = String(pin);

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export const api = {
  // Events
  getEvents: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/events${q ? `?${q}` : ''}`);
  },
  getEvent: (id) => request('GET', `/events/${id}`),
  createEvent: (body) => request('POST', '/events', { body }),
  updateEvent: (id, body, pin) => request('PUT', `/events/${id}`, { body, pin }),
  deleteEvent: (id, pin) => request('DELETE', `/events/${id}`, { pin }),
  verifyPin: (id, pin) => request('POST', `/events/${id}/verify-pin`, { body: { pin } }),

  // Racers
  getRacers: (eventId) => request('GET', `/events/${eventId}/racers`),
  addRacer: (eventId, body, pin) => request('POST', `/events/${eventId}/racers`, { body, pin }),
  updateRacer: (racerId, body, pin) => request('PUT', `/racers/${racerId}`, { body, pin }),
  deleteRacer: (racerId, pin) => request('DELETE', `/racers/${racerId}`, { pin }),

  // Results
  getResults: (eventId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/events/${eventId}/results${q ? `?${q}` : ''}`);
  },
  updateResult: (racerId, body, pin) => request('PUT', `/racers/${racerId}/result`, { body, pin }),
  bulkResults: (eventId, results, pin) =>
    request('POST', `/events/${eventId}/results/bulk`, { body: { results }, pin }),
};
