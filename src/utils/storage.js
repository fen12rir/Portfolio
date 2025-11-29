import { defaultPortfolioData } from '../data/config';

const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api');

if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL);
}

let cachedData = null;
let cacheTimestamp = null;
let dataVersion = 0;
let isLoading = false;
let loadPromise = null;
const CACHE_DURATION = 30000;
const STORAGE_KEY = 'portfolio_cache';
const VERSION_KEY = 'portfolio_version';

let broadcastChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('portfolio_updates');
    broadcastChannel.onmessage = (event) => {
      if (event.data.type === 'data_updated') {
        clearCache();
        if (event.data.version > dataVersion) {
          dataVersion = event.data.version;
          loadFromStorage();
        }
      }
    };
  } catch (e) {
    console.warn('BroadcastChannel not available:', e);
  }
}

export const isDefaultData = (data) => {
  if (!data || !data.personal) return false;
  return data.personal.email === "your.email@example.com";
};

const isCacheValid = () => {
  if (!cachedData || !cacheTimestamp) return false;
  const now = Date.now();
  return (now - cacheTimestamp) < CACHE_DURATION;
};

const saveToStorage = (data) => {
  if (typeof window === 'undefined') return;
  try {
    const storageData = {
      data,
      timestamp: Date.now(),
      version: dataVersion
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
    localStorage.setItem(VERSION_KEY, dataVersion.toString());
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
};

const loadFromStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const { data, timestamp, version } = JSON.parse(stored);
    const age = Date.now() - timestamp;
    
    if (age < CACHE_DURATION && data && !isDefaultData(data)) {
      cachedData = data;
      cacheTimestamp = timestamp;
      if (version) dataVersion = version;
      return data;
    }
  } catch (e) {
    console.warn('Failed to load from localStorage:', e);
  }
  return null;
};

const notifyOtherTabs = () => {
  dataVersion++;
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ 
        type: 'data_updated', 
        version: dataVersion,
        timestamp: Date.now()
      });
    } catch (e) {
      console.warn('Failed to broadcast update:', e);
    }
  }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(VERSION_KEY, dataVersion.toString());
      window.dispatchEvent(new StorageEvent('storage', {
        key: VERSION_KEY,
        newValue: dataVersion.toString(),
        url: window.location.href
      }));
    } catch (e) {
      console.warn('Failed to dispatch storage event:', e);
    }
  }
};

const initializeCache = async (timeout = 15000, forceRefresh = false) => {
  if (!forceRefresh) {
    const storedData = loadFromStorage();
    if (storedData && !isDefaultData(storedData)) {
      return Promise.resolve({ data: storedData, isCustomized: true });
    }
    
    if (cachedData && isCacheValid() && !isDefaultData(cachedData)) {
      return Promise.resolve({ data: cachedData, isCustomized: true });
    }
  }
  
  if (forceRefresh || isDefaultData(cachedData)) {
    cachedData = null;
    cacheTimestamp = null;
  }
  
  if (loadPromise && !forceRefresh) return loadPromise;
  
  loadPromise = (async () => {
    try {
      isLoading = true;
      const apiUrl = `${API_BASE_URL}/portfolio`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn('⚠️ API request timeout after', timeout, 'ms');
      }, timeout);
      
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const storedData = loadFromStorage();
        if (storedData && !isDefaultData(storedData)) {
          return { data: storedData, isCustomized: true };
        }
        return { data: defaultPortfolioData, isCustomized: false };
      }
      
      const result = await response.json();
      
      let data, isCustomized;
      if (result.data !== undefined && result.isCustomized !== undefined) {
        data = result.data;
        isCustomized = result.isCustomized;
      } else {
        data = result;
        isCustomized = !isDefaultData(data);
      }
      
      if (!data || Object.keys(data).length === 0) {
        const storedData = loadFromStorage();
        if (storedData && !isDefaultData(storedData)) {
          return { data: storedData, isCustomized: true };
        }
        data = defaultPortfolioData;
        isCustomized = false;
      }

      const hasRealData = data.personal?.name && 
        data.personal.name !== "DIO" && 
        data.personal.name.trim() !== "" &&
        (data.personal.email !== "your.email@example.com" || 
         (data.skills && data.skills.length > 0) ||
         (data.projects && data.projects.length > 0));

      if (!hasRealData && isDefaultData(data)) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ API returned default data. Check if database has custom data.');
        }
      } else if (hasRealData) {
        if (import.meta.env.DEV) {
          console.log('✅ Loaded custom portfolio data from API');
        }
      }
      
      cachedData = data;
      cacheTimestamp = Date.now();
      
      if (!isDefaultData(data)) {
        saveToStorage(data);
      }
      
      return { data, isCustomized };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error('❌ Request timeout after', timeout, 'ms - API is too slow or MongoDB connection failed');
        console.error('💡 Check Vercel logs to see if MongoDB is connecting properly');
      } else {
        console.error('❌ Error fetching portfolio data:', error.message);
      }
      
      const storedData = loadFromStorage();
      if (storedData && !isDefaultData(storedData)) {
        console.log('✅ Using cached data from localStorage');
        cachedData = storedData;
        cacheTimestamp = Date.now();
        return { data: storedData, isCustomized: true };
      }
      
      if (forceRefresh || !cachedData) {
        cachedData = defaultPortfolioData;
        cacheTimestamp = Date.now();
      }
      return { data: cachedData || defaultPortfolioData, isCustomized: false };
    } finally {
      isLoading = false;
      loadPromise = null;
    }
  })();
  
  return loadPromise;
};

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === VERSION_KEY && e.newValue) {
      const newVersion = parseInt(e.newValue, 10);
      if (newVersion > dataVersion) {
        dataVersion = newVersion;
        clearCache();
        loadFromStorage();
      }
    }
  });
}

export const clearCache = () => {
  cachedData = null;
  cacheTimestamp = null;
  loadPromise = null;
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }
  }
};

// Synchronous version for backward compatibility (returns cached data or default)
export const getPortfolioData = () => {
  return cachedData || defaultPortfolioData;
};

export const getPortfolioDataAsync = async (forceRefresh = false) => {
  if (!forceRefresh && cachedData && isCacheValid() && !isDefaultData(cachedData) && !isLoading) {
    return cachedData;
  }
  const result = await initializeCache(5000, forceRefresh);
  return result.data || defaultPortfolioData;
};

export const getPortfolioDataWithStatus = async (forceRefresh = false) => {
  if (!forceRefresh && cachedData && isCacheValid() && !isDefaultData(cachedData) && !isLoading) {
    return { data: cachedData, isCustomized: true };
  }
  return await initializeCache(5000, forceRefresh);
};

export const refreshPortfolioData = async () => {
  clearCache();
  const result = await initializeCache(5000, true);
  return result.data;
};

export const savePortfolioData = async (data, isPartialUpdate = false) => {
  let payloadSizeMB = 0;
  try {
    const payload = JSON.stringify(data);
    const payloadSize = new Blob([payload]).size;
    payloadSizeMB = payloadSize / (1024 * 1024);
    const apiUrl = `${API_BASE_URL}/portfolio`;
    
    console.log(`Saving portfolio data:`, {
      url: apiUrl,
      size: `${payloadSizeMB.toFixed(2)}MB`,
      partialUpdate: isPartialUpdate,
      sections: Object.keys(data)
    });
    
    try {
      const testResponse = await fetch(`${API_BASE_URL}/health`, { 
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!testResponse.ok) {
        console.warn('⚠️ Health check failed, API might not be accessible');
      } else {
        console.log('✅ API endpoint is accessible');
      }
    } catch (testError) {
      console.error('❌ Cannot reach API endpoint:', testError);
      throw new Error(`Cannot connect to API at ${API_BASE_URL}. Check your VITE_API_URL environment variable.`);
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Partial-Update': isPartialUpdate ? 'true' : 'false',
          'Cache-Control': 'no-cache'
        },
        body: payload,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorData = {};
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json().catch(() => ({}));
        } else {
          const text = await response.text();
          console.warn('Received non-JSON error response:', text.substring(0, 200));
        }
        const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.warn('Received non-JSON response from save API:', contentType, text.substring(0, 200));
        throw new Error('Invalid response format from server');
      }

      const result = await response.json();
      clearCache();
      const freshResult = await initializeCache(5000, true);
      if (freshResult && freshResult.data) {
        cachedData = freshResult.data;
        cacheTimestamp = Date.now();
        if (!isDefaultData(freshResult.data)) {
          saveToStorage(freshResult.data);
          notifyOtherTabs();
        }
      }
      return { success: true, ...result };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout - the server took too long to respond. Try reducing image sizes.');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error saving portfolio data:', error);
    
    let errorMessage = error.message;
    if (error.message === 'Failed to fetch') {
      errorMessage = `Network error: Could not connect to ${API_BASE_URL}/portfolio. ` +
        `Check that:\n` +
        `1. VITE_API_URL is set correctly in Vercel\n` +
        `2. The API endpoint is deployed and accessible\n` +
        `3. Your internet connection is working\n` +
        `Test the API: ${API_BASE_URL}/health`;
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timeout: The data might be too large. Try removing or compressing images.';
    } else if (error.message.includes('Cannot connect to API')) {
      errorMessage = error.message;
    }
    
    console.error('Save error details:', {
      url: `${API_BASE_URL}/portfolio`,
      error: errorMessage,
      payloadSize: payloadSizeMB > 0 ? `${payloadSizeMB.toFixed(2)}MB` : 'unknown'
    });
    
    return { success: false, error: errorMessage };
  }
};

export const resetPortfolioData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/portfolio`, {
      method: 'DELETE',
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.warn('Received non-JSON response from reset API:', contentType, text.substring(0, 100));
      clearCache();
      notifyOtherTabs();
      return defaultPortfolioData;
    }

    const result = await response.json();
    cachedData = result.data || defaultPortfolioData;
    cacheTimestamp = Date.now();
    clearCache();
    notifyOtherTabs();
    return cachedData;
  } catch (error) {
    console.error('Error resetting portfolio data:', error);
    clearCache();
    return defaultPortfolioData;
  }
};
