import { defaultPortfolioData } from '../data/config';

const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api');

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
  } catch (error) {
    console.warn('BroadcastChannel not available:', error);
  }
}

export const isDefaultData = (data) => {
  if (!data || !data.personal) return false;
  return data.personal.email === 'your.email@example.com';
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
      version: dataVersion,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
    localStorage.setItem(VERSION_KEY, dataVersion.toString());
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
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
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
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
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn('Failed to broadcast update:', error);
    }
  }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(VERSION_KEY, dataVersion.toString());
      window.dispatchEvent(new StorageEvent('storage', {
        key: VERSION_KEY,
        newValue: dataVersion.toString(),
        url: window.location.href,
      }));
    } catch (error) {
      console.warn('Failed to dispatch storage event:', error);
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
      timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(apiUrl, {
        signal: controller.signal,
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

      let data;
      let isCustomized;
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

      const storedData = loadFromStorage();
      if (storedData && !isDefaultData(storedData)) {
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
  window.addEventListener('storage', (event) => {
    if (event.key === VERSION_KEY && event.newValue) {
      const newVersion = parseInt(event.newValue, 10);
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
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }
};

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
        isCustomized: false,
      };
    }

    const result = await response.json();

    let data;
    let isCustomized;
    if (result.data !== undefined && result.isCustomized !== undefined) {
      data = result.data;
      isCustomized = result.isCustomized;
    } else {
      data = { personal: defaultPortfolioData.personal, social: defaultPortfolioData.social };
      isCustomized = false;
    }

    return { data, isCustomized };
  } catch (error) {
    return {
      data: { personal: defaultPortfolioData.personal, social: defaultPortfolioData.social },
      isCustomized: false,
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
      sections.forEach((section) => {
        defaultSections[section] = defaultPortfolioData[section] || [];
      });
      return defaultSections;
    }

    const result = await response.json();
    return result.data || {};
  } catch (error) {
    const defaultSections = {};
    sections.forEach((section) => {
      defaultSections[section] = defaultPortfolioData[section] || [];
    });
    return defaultSections;
  }
};

export const getPortfolioDataWithStatus = async (forceRefresh = false) => {
  if (!forceRefresh && cachedData && isCacheValid() && !isDefaultData(cachedData) && !isLoading) {
    return { data: cachedData, isCustomized: true };
  }
  return initializeCache(20000, forceRefresh);
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
  try {
    const payload = JSON.stringify(data);
    const apiUrl = `${API_BASE_URL}/portfolio`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Partial-Update': isPartialUpdate ? 'true' : 'false',
          'Cache-Control': 'no-cache',
        },
        body: payload,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        const errorData = contentType && contentType.includes('application/json')
          ? await response.json().catch(() => ({}))
          : {};
        const errorMessage =
          errorData.details ||
          errorData.error ||
          errorData.message ||
          `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
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
        throw new Error('Request timeout - the server took too long to respond.');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error saving portfolio data:', error);
    return { success: false, error: error.message || 'Save failed' };
  }
};

export const resetPortfolioData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/portfolio`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
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
    console.error('Error resetting data:', error);
    const fallbackData = getCachedPortfolioSnapshot() || defaultPortfolioData;
    cachedData = JSON.parse(JSON.stringify(fallbackData));
    cacheTimestamp = Date.now();
    return fallbackData;
  }
};
