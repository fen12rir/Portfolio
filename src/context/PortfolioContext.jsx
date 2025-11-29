import { createContext, useContext, useState, useEffect } from 'react';
import { getPortfolioDataWithStatus, clearCache } from '../utils/storage';

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
      const result = await getPortfolioDataWithStatus();
      
      if (result && result.data && Object.keys(result.data).length > 0) {
        setPortfolioData(result.data);
        if (!result.isCustomized && import.meta.env.DEV) {
          console.info('ℹ️ Showing default portfolio data. Customize it in /admin');
        }
      } else {
        setPortfolioData(null);
      }
    } catch (error) {
      console.error('Error loading portfolio data:', error);
      setPortfolioData(null);
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

