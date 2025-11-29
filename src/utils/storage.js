import { defaultPortfolioData } from '../data/config';

// Use environment variable or current origin for API
const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api');

// Log API URL in development for debugging
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL);
}

// Cache for portfolio data
let cachedData = null;
let isLoading = false;
let loadPromise = null;

export const isDefaultData = (data) => {
  if (!data || !data.personal) return false;
  return data.personal.email === "your.email@example.com";
};

const initializeCache = async (timeout = 3000) => {
  if (cachedData) {
    return Promise.resolve({ data: cachedData, isCustomized: !isDefaultData(cachedData) });
  }
  if (loadPromise) return loadPromise;
  
  loadPromise = (async () => {
    try {
      isLoading = true;
      const apiUrl = `${API_BASE_URL}/portfolio`;
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout);
      });
      
      const response = await Promise.race([
        fetch(apiUrl),
        timeoutPromise
      ]);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
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
        data = defaultPortfolioData;
      }
      
      cachedData = data;
      
      return { data, isCustomized };
    } catch (error) {
      return { data: defaultPortfolioData, isCustomized: false };
    } finally {
      isLoading = false;
      loadPromise = null;
    }
  })();
  
  return loadPromise;
};

// Don't initialize cache on module load - let it load on demand
// This prevents blocking the initial render

// Clear cache to force refresh
export const clearCache = () => {
  cachedData = null;
  loadPromise = null;
};

// Synchronous version for backward compatibility (returns cached data or default)
export const getPortfolioData = () => {
  return cachedData || defaultPortfolioData;
};

export const getPortfolioDataAsync = async () => {
  if (cachedData && !isLoading) {
    return cachedData;
  }
  const result = await initializeCache();
  return result.data || defaultPortfolioData;
};

export const getPortfolioDataWithStatus = async () => {
  if (cachedData && !isLoading) {
    return { data: cachedData, isCustomized: !isDefaultData(cachedData) };
  }
  return await initializeCache();
};

// Refresh data from server (clears cache and fetches fresh data)
export const refreshPortfolioData = async () => {
  clearCache();
  const result = await initializeCache();
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
    
    // Test if API endpoint is accessible first
    try {
      const testResponse = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
      if (!testResponse.ok) {
        console.warn('⚠️ Health check failed, API might not be accessible');
      } else {
        console.log('✅ API endpoint is accessible');
      }
    } catch (testError) {
      console.error('❌ Cannot reach API endpoint:', testError);
      throw new Error(`Cannot connect to API at ${API_BASE_URL}. Check your VITE_API_URL environment variable.`);
    }
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Partial-Update': isPartialUpdate ? 'true' : 'false',
        },
        body: payload,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Try to parse error response as JSON, but handle HTML errors
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

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.warn('Received non-JSON response from save API:', contentType, text.substring(0, 200));
        throw new Error('Invalid response format from server');
      }

      const result = await response.json();
      // Clear cache to force refresh on next load (especially important for partial updates)
      clearCache();
      // Don't update cache with partial data - let it reload from server
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
    
    // Provide more helpful error messages
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
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.warn('Received non-JSON response from reset API:', contentType, text.substring(0, 100));
      return defaultPortfolioData;
    }

    const result = await response.json();
    // Update cache
    cachedData = result.data || defaultPortfolioData;
    return cachedData;
  } catch (error) {
    console.error('Error resetting portfolio data:', error);
    return defaultPortfolioData;
  }
};
