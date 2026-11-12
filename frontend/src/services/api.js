import axios from 'axios';
export const clearSession = () => {
  for (const storage of [sessionStorage, localStorage]) {
    ['rental_token', 'rental_refresh_token', 'rental_user'].forEach(key => storage.removeItem(key));
  }
};
const api = axios.create({ baseURL: import.meta.env?.VITE_API_BASE_URL || '/api', timeout: 30000 });
api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('rental_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(response => {
  if (response.data?.success === false) throw new Error(response.data.message || 'Yêu cầu không thành công');
  return response.data;
}, error => {
  if (error.response?.status === 401 && !error.config?.url?.startsWith('/auth/login')) {
    clearSession(); window.dispatchEvent(new Event('rental:unauthorized'));
  }
  error.message = error.response?.data?.message || (error.response ? `Yêu cầu thất bại (${error.response.status})` : 'Không kết nối được máy chủ. Vui lòng thử lại.');
  window.dispatchEvent(new CustomEvent('rental:api-error', { detail: error.message }));
  return Promise.reject(error);
});
export default api;
