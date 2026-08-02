// Base URL — proxied via Vite in dev, absolute in prod
const BASE = '/api';

function getToken() {
  return localStorage.getItem('ushamart_admin_token') || '';
}

async function request(method, path, body = null, isFormData = false) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const opts = { method, headers };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${BASE}${path}`, opts);
  } catch (networkErr) {
    // Backend is not running or unreachable
    throw new Error('Cannot connect to server. Please make sure the backend is running on port 5000.');
  }

  // Try to parse JSON — handle empty or non-JSON responses
  let json;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    // Response was not valid JSON (e.g. HTML error page from proxy)
    if (!res.ok) {
      throw new Error(`Server error (${res.status}). Make sure the backend is running on port 5000.`);
    }
    throw new Error('Unexpected server response. Please check the backend.');
  }

  if (!res.ok) {
    const msg = json?.message || `Request failed with status ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

const get  = (path)        => request('GET',    path);
const post = (path, body)  => request('POST',   path, body);
const put  = (path, body)  => request('PUT',    path, body);
const patch= (path, body)  => request('PATCH',  path, body);
const del  = (path)        => request('DELETE', path);

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
  update:  (code, data) => patch(`/pincodes/${code}`, data),   // PATCH for partial update
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
