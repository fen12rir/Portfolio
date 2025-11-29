import { defaultPortfolioData } from '../data/config';

// Use environment variable or current origin for API
const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api');

// Cache for portfolio data
let cachedData = null;
let isLoading = false;
let loadPromise = null;

// Initialize cache on module load
const initializeCache = async () => {
  if (cachedData) return cachedData;
  if (loadPromise) return loadPromise;
  
  loadPromise = (async () => {
    try {
      isLoading = true;
      const response = await fetch(`${API_BASE_URL}/portfolio`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      cachedData = data;
      return data;
    } catch (error) {
      console.error('Error loading portfolio data:', error);
      // Fallback to default data if API fails
      cachedData = defaultPortfolioData;
      return defaultPortfolioData;
    } finally {
      isLoading = false;
      loadPromise = null;
    }
  })();
  
  return loadPromise;
};

// Initialize cache immediately
initializeCache();

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

export const savePortfolioData = async (data) => {
  try {
    console.log(`Saving to ${API_BASE_URL}/portfolio`);
    const response = await fetch(`${API_BASE_URL}/portfolio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
      console.error('Save failed with status:', response.status, errorData);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Save successful:', result);
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

    const result = await response.json();
    // Update cache
    cachedData = result.data || defaultPortfolioData;
    return cachedData;
  } catch (error) {
    console.error('Error resetting portfolio data:', error);
    return defaultPortfolioData;
  }
};
