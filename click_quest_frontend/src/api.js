const DEFAULT_BASE = 'http://localhost:3001';

/**
 * Resolve backend base URL from environment variables.
 * Priority: REACT_APP_API_BASE -> REACT_APP_BACKEND_URL -> DEFAULT_BASE
 */
function getBaseUrl() {
  const base =
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_BACKEND_URL ||
    DEFAULT_BASE;
  try {
    // Basic validation without throwing sensitive info
    const url = new URL(base);
    return url.toString().replace(/\/+$/, '');
  } catch {
    return DEFAULT_BASE;
  }
}

async function safeFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const body = isJson ? await res.json().catch(() => ({})) : await res.text();

    if (!res.ok) {
      const msg = isJson && body && body.error ? body.error : `HTTP ${res.status}`;
      const error = new Error(typeof msg === 'string' ? msg : 'Request failed');
      error.status = res.status;
      error.body = body;
      throw error;
    }

    return body;
  } finally {
    clearTimeout(timeout);
  }
}

// PUBLIC_INTERFACE
export async function getLeaderboard(limit = 10) {
  /** Fetch leaderboard from backend. */
  const base = getBaseUrl();
  const url = `${base}/api/leaderboard?limit=${encodeURIComponent(limit)}`;
  return safeFetch(url, { method: 'GET' });
}

// PUBLIC_INTERFACE
export async function submitScore({ name, score, durationMs }) {
  /** Submit a player score to backend. */
  const base = getBaseUrl();
  const url = `${base}/api/scores`;
  const payload = { name, score, durationMs };
  return safeFetch(url, { method: 'POST', body: JSON.stringify(payload) });
}

export const __test = { getBaseUrl };
