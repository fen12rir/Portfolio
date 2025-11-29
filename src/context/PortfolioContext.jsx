import { createContext, useContext, useState, useEffect } from 'react';
import { getPortfolioDataAsync, clearCache } from '../utils/storage';
import { defaultPortfolioData } from '../data/config';

const PortfolioContext = createContext();

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

export const PortfolioProvider = ({ children }) => {
  // Start with null - don't show default data until API responds
  const [portfolioData, setPortfolioData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPortfolioData = async () => {
    try {
      setIsLoading(true);
      const data = await getPortfolioDataAsync();
      
      // Check if the data is actually default data (by checking the default email)
      const isDefaultData = data && 
        data.personal?.email === "your.email@example.com";
      
      if (isDefaultData) {
        console.warn('⚠️ Received default portfolio data from API. This usually means:');
        console.warn('   1. MongoDB is not configured (MONGODB_URI not set in Vercel)');
        console.warn('   2. MongoDB connection failed');
        console.warn('   3. No custom data has been saved yet');
        console.warn('   To save custom data, go to /admin and update your portfolio.');
      }
      
      // Set data from API (or default if API failed)
      if (data && Object.keys(data).length > 0) {
        setPortfolioData(data);
      } else {
        // Fallback to default data if API returns empty
        setPortfolioData(defaultPortfolioData);
      }
    } catch (error) {
      console.error('Error loading portfolio data:', error);
      // On error, use default data
      setPortfolioData(defaultPortfolioData);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPortfolioData = async () => {
    clearCache();
    await loadPortfolioData();
  };

  useEffect(() => {
    // Load data in background without blocking render
    loadPortfolioData();
    
    // Listen for storage events (when data is updated in another tab/window)
    const handleStorageChange = (e) => {
      if (e.key === 'portfolio_data_updated') {
        refreshPortfolioData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom event for same-tab updates
    window.addEventListener('portfolioDataUpdated', refreshPortfolioData);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('portfolioDataUpdated', refreshPortfolioData);
    };
  }, []);

  const value = {
    portfolioData, // Can be null while loading
    isLoading,
    refreshPortfolioData,
  };

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
};

