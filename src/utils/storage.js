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

const mergePortfolioData = (existingData, incomingData) => {
  return {
    personal: { ...(existingData?.personal || {}), ...(incomingData?.personal || {}) },
    social: { ...(existingData?.social || {}), ...(incomingData?.social || {}) },
    skills: incomingData?.skills !== undefined ? incomingData.skills : (existingData?.skills || []),
    projects: incomingData?.projects !== undefined ? incomingData.projects : (existingData?.projects || []),
    experience: incomingData?.experience !== undefined ? incomingData.experience : (existingData?.experience || []),
    education: incomingData?.education !== undefined ? incomingData.education : (existingData?.education || []),
    certificates: incomingData?.certificates !== undefined ? incomingData.certificates : (existingData?.certificates || []),
    gallery: incomingData?.gallery !== undefined ? incomingData.gallery : (existingData?.gallery || []),
  };
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

export const getCachedPortfolioSnapshot = () => {
  const storedData = loadFromStorage();
  if (storedData) {
    return storedData;
  }

  if (cachedData && !isDefaultData(cachedData)) {
    return cachedData;
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
    let timeoutId = null;
    try {
      isLoading = true;
      const apiUrl = `${API_BASE_URL}/portfolio`;
      
      const controller = new AbortController();
      timeoutId = setTimeout(() => {
        controller.abort();
        console.warn('⚠️ API request timeout after', timeout, 'ms');
      }, timeout);
      
      const response = await fetch(apiUrl, {
        signal: controller.signal
      });
      
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
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
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
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

export const clearCache = (removeStorage = false) => {
  cachedData = null;
  cacheTimestamp = null;
  loadPromise = null;
  if (removeStorage && typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }
  }
};

// Synchronous version for backward compatibility (returns cached data or default)
export const getPortfolioData = () => {
  const snapshot = getCachedPortfolioSnapshot();
  return snapshot || cachedData || defaultPortfolioData;
};

export const getPortfolioDataAsync = async (forceRefresh = false) => {
  if (!forceRefresh && cachedData && isCacheValid() && !isDefaultData(cachedData) && !isLoading) {
    return cachedData;
  }
  const result = await initializeCache(20000, forceRefresh);
  return result.data || defaultPortfolioData;
};

export const getCorePortfolioData = async (forceRefresh = false) => {
  if (!forceRefresh) {
    const snapshot = getCachedPortfolioSnapshot();
    if (snapshot?.personal || snapshot?.social) {
      return {
        data: {
          personal: snapshot.personal || defaultPortfolioData.personal,
          social: snapshot.social || defaultPortfolioData.social,
        },
        isCustomized: !isDefaultData(snapshot),
      };
    }
  }

  const apiUrl = `${API_BASE_URL}/portfolio/core`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(apiUrl, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return { 
        data: { personal: defaultPortfolioData.personal, social: defaultPortfolioData.social }, 
        isCustomized: false 
      };
    }
    
    const result = await response.json();
    
    let data, isCustomized;
    if (result.data !== undefined && result.isCustomized !== undefined) {
      data = result.data;
      isCustomized = result.isCustomized;
    } else {
      data = { personal: defaultPortfolioData.personal, social: defaultPortfolioData.social };
      isCustomized = false;
    }
    
    return { data, isCustomized };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ Core data request timeout');
    } else {
      console.error('❌ Error fetching core portfolio data:', error.message);
    }
    
    return { 
      data: { personal: defaultPortfolioData.personal, social: defaultPortfolioData.social }, 
      isCustomized: false 
    };
  }
};

export const getPortfolioSections = async (sections = [], forceRefresh = false) => {
  if (sections.length === 0) {
    return {};
  }

  if (!forceRefresh) {
    const snapshot = getCachedPortfolioSnapshot();
    if (snapshot) {
      const cachedSections = sections.reduce((accumulator, section) => {
        if (snapshot[section] !== undefined) {
          accumulator[section] = snapshot[section];
        }
        return accumulator;
      }, {});

      if (Object.keys(cachedSections).length === sections.length) {
        return cachedSections;
      }
    }
  }
  
  const apiUrl = `${API_BASE_URL}/portfolio/sections?include=${sections.join(',')}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(apiUrl, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const defaultSections = {};
      sections.forEach(section => {
        defaultSections[section] = defaultPortfolioData[section] || [];
      });
      return defaultSections;
    }
    
    const result = await response.json();
    return result.data || {};
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ Sections request timeout');
    } else {
      console.error('❌ Error fetching portfolio sections:', error.message);
    }
    
    const defaultSections = {};
    sections.forEach(section => {
      defaultSections[section] = defaultPortfolioData[section] || [];
    });
    return defaultSections;
  }
};

export const getPortfolioDataWithStatus = async (forceRefresh = false) => {
  if (!forceRefresh && cachedData && isCacheValid() && !isDefaultData(cachedData) && !isLoading) {
    return { data: cachedData, isCustomized: true };
  }
  return await initializeCache(20000, forceRefresh);
};

export const refreshPortfolioData = async () => {
  clearCache();
  const result = await initializeCache(20000, true);
  return result.data;
};

export const uploadPortfolioImage = async ({
  imageData,
  fileName = '',
  folder = 'portfolio',
  assetType = 'general',
}) => {
  if (!imageData || typeof imageData !== 'string') {
    return { success: false, error: 'Missing image data for upload.' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    const response = await fetch(`${API_BASE_URL}/portfolio/upload-image`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        imageData,
        fileName,
        folder,
        assetType,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const payload = isJson ? await response.json() : { success: false, error: await response.text() };

    if (!response.ok || payload.success === false || !payload.url) {
      return {
        success: false,
        error: payload?.details || payload?.error || `Upload failed (HTTP ${response.status})`,
      };
    }

    return {
      success: true,
      url: payload.url,
      provider: payload.provider,
      key: payload.key,
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { success: false, error: 'Upload timeout. Please try a smaller image.' };
    }
    return { success: false, error: error.message || 'Upload failed.' };
  }
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
    
    const shouldRunHealthCheck = import.meta.env.DEV && /(localhost|127\.0\.0\.1)/i.test(API_BASE_URL);
    if (shouldRunHealthCheck) {
    try {
      const testResponse = await fetch(`${API_BASE_URL}/health`, { 
        method: 'GET',
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!testResponse.ok) {
        const healthBody = await testResponse.text().catch(() => '');
        const looksLikeProxyFailure =
          testResponse.status >= 500 &&
          (
            healthBody.includes('ECONNREFUSED') ||
            healthBody.includes('proxy') ||
            healthBody.includes('connect')
          );

        if (looksLikeProxyFailure) {
          throw new Error('Local API server is not running. Start it with "npm run server", then retry save.');
        }

        console.warn('⚠️ Health check failed, API might not be accessible');
      } else {
        console.log('✅ API endpoint is accessible');
      }
    } catch (testError) {
      console.error('❌ Cannot reach API endpoint:', testError);
      if (testError.message?.includes('Local API server is not running')) {
        throw testError;
      }
      throw new Error(`Cannot connect to API at ${API_BASE_URL}. Check your VITE_API_URL environment variable.`);
    }
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        credentials: 'include',
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
        let errorText = '';
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json().catch(() => ({}));
        } else {
          errorText = await response.text().catch(() => '');
          console.warn('Received non-JSON error response:', errorText.substring(0, 200));
        }

        const looksLikeProxyFailure =
          response.status >= 500 &&
          (
            errorText.includes('ECONNREFUSED') ||
            errorText.includes('proxy') ||
            errorText.includes('connect')
          );

        if (looksLikeProxyFailure) {
          throw new Error('Local API server is not running. Start it with "npm run server", then retry save.');
        }
        const errorMessage =
          errorData.details ||
          errorData.error ||
          errorData.message ||
          `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.warn('Received non-JSON response from save API:', contentType, text.substring(0, 200));
        throw new Error('Invalid response format from server');
      }

      const result = await response.json();
      const baseData = getCachedPortfolioSnapshot() || cachedData || defaultPortfolioData;
      const nextData = isPartialUpdate
        ? mergePortfolioData(baseData, data)
        : data;

      cachedData = JSON.parse(JSON.stringify(nextData));
      cacheTimestamp = Date.now();

      if (!isDefaultData(cachedData)) {
        saveToStorage(cachedData);
      } else if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }

      notifyOtherTabs();

      return { success: true, data: cachedData, ...result };
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
    } else if (error.message.includes('Local API server is not running')) {
      errorMessage = error.message;
    } else if (error.message.includes('HTTP error! status: 401') || error.message.toLowerCase().includes('unauthorized')) {
      errorMessage = 'Your admin session expired. Please log in again.';
    } else if (error.message.includes('HTTP error! status: 404')) {
      errorMessage =
        `API route not found (${API_BASE_URL}/portfolio).\n` +
          `If you are testing locally:\n` +
          `1. Run backend: npm run server\n` +
          `2. Run frontend: npm run dev\n` +
          `3. Open http://localhost:5173`;
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
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.warn('Received non-JSON response from reset API:', contentType, text.substring(0, 100));
      cachedData = JSON.parse(JSON.stringify(defaultPortfolioData));
      cacheTimestamp = Date.now();
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      notifyOtherTabs();
      return defaultPortfolioData;
    }

    const result = await response.json();
    cachedData = JSON.parse(JSON.stringify(result.data || defaultPortfolioData));
    cacheTimestamp = Date.now();
    if (!isDefaultData(cachedData)) {
      saveToStorage(cachedData);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    notifyOtherTabs();
    return cachedData;
  } catch (error) {
    console.error('Error resetting portfolio data:', error);
    const fallbackData = getCachedPortfolioSnapshot() || defaultPortfolioData;
    cachedData = JSON.parse(JSON.stringify(fallbackData));
    cacheTimestamp = Date.now();
    return fallbackData;
  }
};
