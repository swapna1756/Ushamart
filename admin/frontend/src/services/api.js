/**
 * api.js — Centralised API client for the UshaMart Admin frontend.
 *
 * BASE URL resolution:
 *   Development  → VITE_API_URL is empty → Vite dev-server proxy handles
 *                  /api → http://localhost:5000 (no VITE_API_URL needed)
 *   Production   → VITE_API_URL=https://ushamart.onrender.com (set in netlify.toml)
 *                  → BASE becomes https://ushamart.onrender.com/api
 *
 * Rule: VITE_API_URL must NEVER end with /api — it is the bare origin.
 *       We always append /api here, exactly once.
 */
const _raw = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, ''); // strip trailing slashes
const BASE = _raw ? `${_raw}/api` : '/api';
const IS_DEV = import.meta.env.DEV;
const REQUEST_TIMEOUT_MS = 15000;

// Dev-only: log which base URL is in use so you can spot misconfiguration fast.
if (IS_DEV) {
  console.info(
    `[API] BASE = "${BASE}"`,
    _raw ? '(VITE_API_URL set — proxy bypassed)' : '(proxy mode — /api → localhost:5000)'
  );
}

function getToken() {
  return localStorage.getItem('ushamart_admin_token') || '';
}

async function request(method, path, body = null, isFormData = false) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const opts = { method, headers, signal: controller.signal };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);

  const url = `${BASE}${path}`;

  // Dev-only request log
  if (IS_DEV) {
    console.debug(`[API] ${method} ${url}`);
  }

  let res;
  try {
    res = await fetch(url, opts);
  } catch (networkErr) {
    window.clearTimeout(timeout);
    if (networkErr.name === 'AbortError') {
      throw new Error('The server took too long to respond. Please try again.');
    }
    // Dev: include full URL and hint; Production: clean message only
    if (IS_DEV) {
      console.error(`[API] Network error — ${method} ${url}`, networkErr);
    }
    throw new Error(
      IS_DEV
        ? `Network error — could not reach ${url}. ${networkErr.message}`
        : 'Unable to connect to the server. Please try again.'
    );
  }

  window.clearTimeout(timeout);

  // Dev-only response log
  if (IS_DEV) {
    console.debug(`[API] ${method} ${url} → ${res.status}`);
  }

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    if (!res.ok) {
      throw new Error(
        IS_DEV
          ? `Server error (${res.status}) from ${url}. Response was not JSON.`
          : `Server error (${res.status}). Please try again.`
      );
    }
    throw new Error(
      IS_DEV
        ? `Unexpected response from ${url}. Check the server logs.`
        : 'Unexpected server response. Please try again.'
    );
  }

  if (!res.ok) {
    const msg = json?.message || `Request failed with status ${res.status}`;
    if (IS_DEV) {
      console.error(`[API] ${method} ${url} failed:`, json);
    }
    throw new Error(msg);
  }
  return json;
}

const get   = (path)             => request('GET',    path);
const post  = (path, body)       => request('POST',   path, body);
const put   = (path, body)       => request('PUT',    path, body);
const patch = (path, body)       => request('PATCH',  path, body);
const del   = (path)             => request('DELETE', path);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email, password) => post('/auth/admin/login', { email, password }),
  me:    ()                => get('/auth/me'),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  get: () => get('/dashboard'),
};

// ── Products ──────────────────────────────────────────────────────────────────
export const productsApi = {
  getAll:       (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/products${qs ? '?' + qs : ''}`);
  },
  getById:      (id)          => get(`/products/${id}`),
  create:       (data)        => post('/products', data),
  update:       (id, data)    => put(`/products/${id}`, data),
  toggleStatus: (id, status)  => patch(`/products/${id}/status`, { status }),
  updateStock:  (id, stock)   => patch(`/products/${id}/stock`,  { stock }),
  delete:       (id)          => del(`/products/${id}`),
};

// ── Categories ────────────────────────────────────────────────────────────────
export const categoriesApi = {
  getAll:       ()           => get('/categories?status=all'),
  create:       (data)       => post('/categories', data),
  update:       (id, data)   => put(`/categories/${id}`, data),
  toggleStatus: (id, status) => patch(`/categories/${id}/status`, { status }),
  delete:       (id)         => del(`/categories/${id}`),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersApi = {
  getAll:       (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/orders${qs ? '?' + qs : ''}`);
  },
  getById:      (id)          => get(`/orders/${id}`),
  updateStatus: (id, status)  => patch(`/orders/${id}/status`, { status }),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll:      (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/users${qs ? '?' + qs : ''}`);
  },
  toggleBlock: (id)          => patch(`/users/${id}/block`, {}),
};

// ── Pincodes ──────────────────────────────────────────────────────────────────
export const pincodesApi = {
  getAll:  ()           => get('/pincodes/all'),
  create:  (data)       => post('/pincodes', data),
  update:  (code, data) => patch(`/pincodes/${code}`, data),
  delete:  (code)       => del(`/pincodes/${code}`),
};

// ── Banners ───────────────────────────────────────────────────────────────────
export const bannersApi = {
  getAll:  ()          => get('/banners/all'),
  create:  (data)      => post('/banners', data),
  update:  (id, data)  => put(`/banners/${id}`, data),
  delete:  (id)        => del(`/banners/${id}`),
};

// ── Special Offers ────────────────────────────────────────────────────────────
export const offersApi = {
  getAll:  ()          => get('/special-offers/all'),
  create:  (data)      => post('/special-offers', data),
  update:  (id, data)  => put(`/special-offers/${id}`, data),
  delete:  (id)        => del(`/special-offers/${id}`),
};

// ── Coupons ───────────────────────────────────────────────────────────────────
export const couponsApi = {
  getAll:  ()          => get('/coupons/all'),
  create:  (data)      => post('/coupons', data),
  update:  (id, data)  => put(`/coupons/${id}`, data),
  delete:  (id)        => del(`/coupons/${id}`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll:  ()          => get('/notifications/all'),
  create:  (data)      => post('/notifications', data),
  update:  (id, data)  => put(`/notifications/${id}`, data),
  delete:  (id)        => del(`/notifications/${id}`),
};

// ── Upload ────────────────────────────────────────────────────────────────────
export const uploadApi = {
  image: async (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return request('POST', '/upload/image', fd, true);
  },
  images: async (files) => {
    const fd = new FormData();
    files.forEach(f => fd.append('images', f));
    return request('POST', '/upload/images', fd, true);
  },
};
