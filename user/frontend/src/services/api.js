const BASE = '/api';

function getToken() {
  return localStorage.getItem('ushamart_user_token') || '';
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${BASE}${path}`, opts);
  } catch {
    throw new Error('Cannot connect to server. Make sure the backend is running on port 5000.');
  }

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Server returned invalid response (${res.status}). Check the backend.`);
  }

  if (!res.ok) throw new Error(json?.message || `Error ${res.status}`);
  return json;
}

const get   = p      => request('GET',   p);
const post  = (p, b) => request('POST',  p, b);
const put   = (p, b) => request('PUT',   p, b);
const patch = (p, b) => request('PATCH', p, b);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login:  phone       => post('/auth/user/login', { phone }),
  me:     ()          => get('/auth/me'),
  update: (id, data)  => patch(`/users/${id}/profile`, data),
};

// ── Products ──────────────────────────────────────────────────────────────────
export const productsApi = {
  getAll: (params = {}) => {
    // Remove empty/undefined/null params so they don't pollute the query string
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
  getAll:  ()           => get('/orders'),
  getById: id           => get(`/orders/${id}`),
  create:  data         => post('/orders', data),
};

// ── Pincodes ──────────────────────────────────────────────────────────────────
export const pincodesApi = {
  check: code => post('/pincodes/check', { code }),
  getAll: ()  => get('/pincodes'),
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
  getAll: () => get('/notifications'),
};
