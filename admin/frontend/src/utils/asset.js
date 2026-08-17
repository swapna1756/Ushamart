export function resolveImageUrl(url) {
  if (!url || typeof url !== 'string') return '/logo.png';

  const value = url.trim();
  if (!value || value === 'null' || value === 'undefined') return '/logo.png';

  if (/^https?:\/\//i.test(value) || /^data:/i.test(value) || value.startsWith('blob:')) {
    return value;
  }

  if (value.startsWith('//')) {
    return `https:${value}`;
  }

  // Get base URL of backend API
  const rawApiUrl = import.meta.env.VITE_API_URL || '';
  const backendBase = rawApiUrl.replace(/\/+$/, '');

  if (value.startsWith('/')) {
    return backendBase ? `${backendBase}${value}` : value;
  }

  if (value.startsWith('uploads/') || value.startsWith('images/')) {
    return backendBase ? `${backendBase}/${value}` : `/${value}`;
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  return backendBase ? `${backendBase}/${value}` : `/${value}`;
}
