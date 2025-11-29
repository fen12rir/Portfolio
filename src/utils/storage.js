import { defaultPortfolioData } from '../data/config';

// Use environment variable or current origin for API
const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api');

// Cache for portfolio data
let cachedData = null;
let isLoading = false;
let loadPromise = null;

// Initialize cache with timeout to prevent blocking
const initializeCache = async (timeout = 3000) => {
  if (cachedData) return cachedData;
  if (loadPromise) return loadPromise;
  
  loadPromise = (async () => {
    try {
      isLoading = true;
      const apiUrl = `${API_BASE_URL}/portfolio`;
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout);
      });
      
      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(apiUrl),
        timeoutPromise
      ]);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Check if response is actually JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // If we got HTML or other non-JSON, use default data
        cachedData = defaultPortfolioData;
        return defaultPortfolioData;
      }
      
      const data = await response.json();
      cachedData = data;
      return data;
    } catch (error) {
      // Silently fallback to default data on timeout or error
      cachedData = defaultPortfolioData;
      return defaultPortfolioData;
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

// Async version for explicit loading (forces refresh if cache is cleared)
export const getPortfolioDataAsync = async () => {
  if (cachedData && !isLoading) {
    return cachedData;
  }
  return await initializeCache();
};

// Refresh data from server (clears cache and fetches fresh data)
export const refreshPortfolioData = async () => {
  clearCache();
  return await initializeCache();
};

// Compress base64 image data
const compressImage = (base64String, maxWidth = 1200, quality = 0.8) => {
  return new Promise((resolve) => {
    if (!base64String || !base64String.startsWith('data:image')) {
      resolve(base64String);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Resize if too large
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to compressed base64
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => resolve(base64String); // Return original on error
    img.src = base64String;
  });
};

// Recursively compress all images in the data object
const compressImagesInData = async (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  if (Array.isArray(obj)) {
    return Promise.all(obj.map(item => compressImagesInData(item)));
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.startsWith('data:image')) {
      result[key] = await compressImage(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = await compressImagesInData(value);
    } else {
      result[key] = value;
    }
  }
  return result;
};

export const savePortfolioData = async (data) => {
  try {
    // Compress images before sending to reduce payload size
    const compressedData = await compressImagesInData(data);
    
    // Check payload size
    const payload = JSON.stringify(compressedData);
    const sizeInMB = new Blob([payload]).size / (1024 * 1024);
    
    if (sizeInMB > 4) {
      console.warn(`Payload size is ${sizeInMB.toFixed(2)}MB, which may exceed Vercel's limit`);
    }

    const response = await fetch(`${API_BASE_URL}/portfolio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
    });

    if (!response.ok) {
      // Try to parse error response as JSON, but handle HTML errors
      const contentType = response.headers.get('content-type');
      let errorData = {};
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json().catch(() => ({}));
      } else {
        const text = await response.text();
        console.warn('Received non-JSON error response:', text.substring(0, 100));
      }
      const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.warn('Received non-JSON response from save API:', contentType, text.substring(0, 100));
      throw new Error('Invalid response format from server');
    }

    const result = await response.json();
    // Clear cache to force refresh on next load
    clearCache();
    // Update cache with saved data immediately
    cachedData = data;
    return { success: true, ...result };
  } catch (error) {
    console.error('Error saving portfolio data:', error);
    return { success: false, error: error.message };
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
