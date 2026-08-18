/**
 * api.js — Centralised API client for the UshaMart User frontend.
 *
 * BASE URL resolution:
 *   Development  → Vite dev-server proxy handles /api → http://localhost:5000
 *                  (no VITE_API_URL needed; just use relative /api)
 *   Production   → VITE_API_URL=https://ushamart.onrender.com
 *                  → BASE becomes https://ushamart.onrender.com/api
 *
 * Rule: VITE_API_URL must NEVER end with /api — it is the bare origin.
 *       We always append /api here, exactly once.
 */
const _raw = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const BASE = _raw ? `${_raw}/api` : '/api';
const REQUEST_TIMEOUT_MS = 15000;

function getToken() {
  const token = localStorage.getItem('ushamart_user_token');
  return token && token !== 'undefined' && token !== 'null' ? token.trim() : '';
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const opts = { method, headers, signal: controller.signal };
  if (body) opts.body = JSON.stringify(body);

  const url = `${BASE}${path}`;

  let res;
  try {
    res = await fetch(url, opts);
  } catch (networkErr) {
    window.clearTimeout(timeout);
    if (networkErr.name === 'AbortError') {
      throw new Error('The server took too long to respond. Please try again.');
    }
    throw new Error(`Network error — could not reach ${url}. ${networkErr.message}`);
  }

  window.clearTimeout(timeout);
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Server returned non-JSON response (${res.status}) from ${url}.`);
  }

  if (res.status === 401) {
    localStorage.removeItem('ushamart_user_token');
    const err = new Error(json?.message || 'Session expired. Please log in again.');
    err.isAuthError = true;
    throw err;
  }

  if (!res.ok) throw new Error(json?.message || `Error ${res.status}`);
  return json;
}

const get   = p      => request('GET',    p);
const post  = (p, b) => request('POST',   p, b);
const put   = (p, b) => request('PUT',    p, b);
const patch = (p, b) => request('PATCH',  p, b);
const del   = p      => request('DELETE', p);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login:  payload     => post('/auth/user/login', typeof payload === 'string' ? { phone: payload } : payload),
  firebaseLogin: payload => post('/auth/user/firebase-login', payload),
  me:     ()          => get('/auth/me'),
  update: (id, data)  => patch(`/users/${id}/profile`, data),
};

// ── Products ──────────────────────────────────────────────────────────────────
export const productsApi = {
  getAll: (params = {}) => {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const qs = new URLSearchParams(clean).toString();
    return get(`/products${qs ? '?' + qs : ''}`);
  },
  getById: id => get(`/products/${id}`),
};

// ── Categories ────────────────────────────────────────────────────────────────
export const categoriesApi = {
  getAll: () => get('/categories'),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersApi = {
  getAll:  ()    => get('/orders'),
  getById: id    => get(`/orders/${id}`),
  create:  data  => post('/orders', data),
};

export const addressesApi = {
  getAll:  ()         => get('/addresses'),
  create:  data       => post('/addresses', data),
  update:  (id, data) => put(`/addresses/${id}`, data),
  delete:  id         => del(`/addresses/${id}`),
};

// ── Pincodes ──────────────────────────────────────────────────────────────────
export const pincodesApi = {
  check:  code => post('/pincodes/check', { code }),
  getAll: ()   => get('/pincodes'),
};

// ── Banners + Offers ──────────────────────────────────────────────────────────
export const bannersApi       = { getAll: () => get('/banners') };
export const specialOffersApi = { getAll: () => get('/special-offers') };

// ── Coupons ───────────────────────────────────────────────────────────────────
export const couponsApi = {
  getAll:   ()              => get('/coupons'),
  validate: (code, total)   => post('/coupons/validate', { code, orderTotal: total }),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll:   ()   => get('/notifications'),
  markRead: (id) => post(`/notifications/${id}/read`, {}),
};

// ── Wishlist ──────────────────────────────────────────────────────────────────
export const wishlistApi = {
  getAll:  ()          => get('/wishlist'),
  add:     (productId) => post(`/wishlist/${productId}`, {}),
  remove:  (productId) => del(`/wishlist/${productId}`),
  clear:   ()          => del('/wishlist/clear'),
};

// ── Cart (server-side persistence) ───────────────────────────────────────────
export const cartApi = {
  // Returns { [cartKey]: quantity } for the logged-in user
  get:    ()             => get('/cart'),
  // Full sync: replace the server cart with the local map
  sync:   (cart)         => put('/cart', { cart }),
  // Update a single item (quantity 0 removes it)
  update: (cartKey, qty) => patch(`/cart/${encodeURIComponent(cartKey)}`, { quantity: qty }),
  // Clear entire cart (called after order is placed)
  clear:  ()             => del('/cart'),
};
