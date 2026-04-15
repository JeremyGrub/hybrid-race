/**
 * Parse a time string (MM:SS or HH:MM:SS or H:MM:SS) into total seconds.
 * Returns null if invalid.
 */
function parseTimeToSeconds(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const trimmed = timeStr.trim();
  const parts = trimmed.split(':');
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10);
    const s = parseInt(parts[1], 10);
    if (isNaN(m) || isNaN(s) || s >= 60 || m < 0 || s < 0) return null;
    return m * 60 + s;
  }
  if (parts.length === 3) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const s = parseInt(parts[2], 10);
    if (isNaN(h) || isNaN(m) || isNaN(s) || m >= 60 || s >= 60 || h < 0 || m < 0 || s < 0) return null;
    return h * 3600 + m * 60 + s;
  }
  return null;
}

/**
 * Normalize a time string to HH:MM:SS format.
 */
function normalizeTime(timeStr) {
  const secs = parseTimeToSeconds(timeStr);
  if (secs === null) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

/**
 * Format seconds back to a display string.
 * Under 1 hour: MM:SS, otherwise HH:MM:SS
 */
function formatSeconds(secs) {
  if (secs === null || secs === undefined) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) {
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
  }
  return [m, s].map(v => String(v).padStart(2, '0')).join(':');
}

module.exports = { parseTimeToSeconds, normalizeTime, formatSeconds };
