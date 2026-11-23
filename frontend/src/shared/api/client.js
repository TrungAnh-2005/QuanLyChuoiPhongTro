import axios from 'axios';
export const clearSession = () => {
  for (const storage of [sessionStorage, localStorage]) {
    ['rental_token', 'rental_refresh_token', 'rental_user'].forEach(key => storage.removeItem(key));
  }
};
const api = axios.create({ baseURL: import.meta.env?.VITE_API_BASE_URL || '/api', timeout: 30000 });
let refreshPromise;
let testRole = 'STAFF';
export const setTestRole = role => { testRole = role; };
api.interceptors.request.use(config => {
  if (import.meta.env?.VITE_TEST_MODE === 'true') config.headers['X-Test-Role'] = testRole;
  const token = sessionStorage.getItem('rental_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(response => {
  if (response.data?.success === false) throw new Error(response.data.message || 'Yêu cầu không thành công');
  return response.data;
}, async error => {
  const config = error.config;
  const isAuthRequest = /^\/auth\/(login|register|refresh)(?:\?|$)/.test(config?.url || '');
  const refreshToken = sessionStorage.getItem('rental_refresh_token');
  if (error.response?.status === 401 && config && !isAuthRequest && !config._retried && refreshToken) {
    config._retried = true;
    try {
      if (!refreshPromise) {
        refreshPromise = api.post('/auth/refresh', { refreshToken }).then(response => {
          const session = response.data;
          if (!session?.accessToken || !session?.refreshToken) throw new Error('Invalid refresh response');
          sessionStorage.setItem('rental_token', session.accessToken);
          sessionStorage.setItem('rental_refresh_token', session.refreshToken);
          return session.accessToken;
        }).finally(() => { refreshPromise = null; });
      }
      config.headers.Authorization = `Bearer ${await refreshPromise}`;
      return api(config);
    } catch {
      clearSession();
      window.dispatchEvent(new Event('rental:unauthorized'));
      return Promise.reject(error);
    }
  }
  if (error.response?.status === 401 && !isAuthRequest) {
    clearSession(); window.dispatchEvent(new Event('rental:unauthorized'));
  }
  error.message = error.response?.data?.message || (error.response ? `Yêu cầu thất bại (${error.response.status})` : 'Không kết nối được máy chủ. Vui lòng thử lại.');
  window.dispatchEvent(new CustomEvent('rental:api-error', { detail: error.message }));
  return Promise.reject(error);
});
export default api;
