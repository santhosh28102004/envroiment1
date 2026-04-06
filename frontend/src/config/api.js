const normalizeBaseUrl = (value) => String(value || '').replace(/\/+$/, '');

const envBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

export const API_BASE_URL = envBaseUrl || '/api';
