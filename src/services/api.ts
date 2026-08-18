import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Integration switch
// ---------------------------------------------------------------------------
// DEV (yerel backend + adb reverse):
//   - Backend'i çalıştırın:  cd backend && npm start  (port 5000)
//   - Cihazdan erişim için:  adb reverse tcp:5000 tcp:5000
//   - Bu durumda cihazın "localhost:5000"ı host'un backend'ine bağlanır.
//
// PROD (deploy edilmiş uzak backend):
//   - Uzak sunucuya Aşama 1 kodlarını deploy edin, ardından bu satırı açın:
//     const BASE_URL = 'http://88.198.198.175:5000/api';
const BASE_URL = 'http://10.66.150.88:5000/api';
// ---------------------------------------------------------------------------

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.removeItem('token');
    }
    return Promise.reject(err);
  }
);

export default api;

// Root URL of the backend (without /api) — used to build absolute image URLs.
export const API_ROOT = BASE_URL.replace(/\/api$/, '');

// image_url in DB is stored as a relative path (e.g. /uploads/beru-123.jpg).
export const resolveImageUrl = (path?: string | null) =>
  path ? (path.startsWith('http') ? path : API_ROOT + path) : '';
