import axios from 'axios';
import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore';

// Collect candidate URLs based on runtime environment
export const getCandidateUrls = (): string[] => {
  const urls: string[] = [];

  const addCandidate = (host?: string | null) => {
    if (!host) return;
    if (host.startsWith('http://') || host.startsWith('https://')) {
      const formatted = host.endsWith('/api') ? host : `${host.replace(/\/$/, '')}/api`;
      if (!urls.includes(formatted)) urls.push(formatted);
      return;
    }
    const cleanHost = host.split(':')[0].trim();
    if (cleanHost && !urls.some((u) => u.includes(`://${cleanHost}:`))) {
      urls.push(`http://${cleanHost}:5000/api`);
    }
  };

  // 1. Host from Expo Constants (most reliable in Expo development)
  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants.manifest2 as any)?.extra?.expoClient?.hostUri ||
      (Constants as any).manifest?.debuggerHost ||
      (Constants as any).experienceUrl;
    if (hostUri) {
      const match = hostUri.match(/^https?:\/\/([^/:]+)/) || hostUri.match(/^([^/:]+)/);
      if (match && match[1]) {
        addCandidate(match[1]);
      }
    }
  } catch {}

  // 2. Host from React Native SourceCode scriptURL
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/([^/:]+)/);
      if (match && match[1]) {
        addCandidate(match[1]);
      }
    }
  } catch {}

  // 3. Known Local / Wi-Fi development machine IPs
  addCandidate('10.138.166.201');
  addCandidate('192.168.1.10');
  addCandidate('192.168.114.1');
  addCandidate('192.168.240.1');
  addCandidate('192.168.56.1');

  // 4. Android Emulator loopback
  if (Platform.OS === 'android') {
    addCandidate('10.0.2.2');
  }

  // 5. ADB reverse / Localhost loopback
  addCandidate('127.0.0.1');
  addCandidate('localhost');

  // 6. Production Render Cloud Backend Fallback
  addCandidate('https://smart-resume-backend-7jeu.onrender.com/api');

  return urls.length > 0 ? urls : ['http://10.138.166.201:5000/api', 'https://smart-resume-backend-7jeu.onrender.com/api'];
};

const candidateList = getCandidateUrls();
let activeBaseUrl = candidateList[0] || 'http://10.138.166.201:5000/api';

export const getActiveBaseUrl = () => activeBaseUrl;
export const getActiveSocketUrl = () => activeBaseUrl.replace(/\/api$/, '');

// Background probe to test and lock onto the fastest responding backend URL
export const probeAndSetWorkingBaseUrl = async (): Promise<string> => {
  const candidates = getCandidateUrls();
  for (const baseUrl of candidates) {
    try {
      const healthUrl = baseUrl.replace(/\/api$/, '') + '/health';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(healthUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        activeBaseUrl = baseUrl;
        apiClient.defaults.baseURL = baseUrl;
        return baseUrl;
      }
    } catch {}
  }
  return activeBaseUrl;
};

// Start background probe immediately on module load
probeAndSetWorkingBaseUrl();

const apiClient = axios.create({
  baseURL: activeBaseUrl,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamic host and auth header injector
apiClient.interceptors.request.use((config) => {
  if (!config.baseURL) {
    config.baseURL = activeBaseUrl;
  }
  const token = useAuthStore.getState().token;
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatic multi-target failover fallback on network error
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const isNetworkError =
      !error.response ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK' ||
      error.message === 'Network Error' ||
      error.message?.includes('Network');

    if (isNetworkError && config && !config._networkRetryCount) {
      config._networkRetryCount = (config._networkRetryCount || 0) + 1;
      const candidates = getCandidateUrls();
      const currentUrl = config.baseURL || activeBaseUrl;
      const otherCandidates = candidates.filter((u) => u !== currentUrl);

      for (const nextBaseUrl of otherCandidates) {
        try {
          const retryConfig = {
            ...config,
            baseURL: nextBaseUrl,
            timeout: 6000,
          };
          const res = await axios(retryConfig);
          // Backend responded successfully! Update active base URL
          activeBaseUrl = nextBaseUrl;
          apiClient.defaults.baseURL = nextBaseUrl;
          return res;
        } catch (retryErr: any) {
          // If the server answered with an HTTP response (e.g. 400, 401, 403, 404, 500), connection was established!
          if (retryErr.response) {
            activeBaseUrl = nextBaseUrl;
            apiClient.defaults.baseURL = nextBaseUrl;
            return Promise.reject(retryErr);
          }
          // Otherwise try the next candidate
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
