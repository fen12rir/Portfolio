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
  // Start with default data immediately - don't wait for API
  const [portfolioData, setPortfolioData] = useState(defaultPortfolioData);
  const [isLoading, setIsLoading] = useState(false); // Start as false since we have default data

  const loadPortfolioData = async () => {
    try {
      // Don't set loading to true - we already have default data to show
      const data = await getPortfolioDataAsync();
      // Only update if we got valid data from server
      if (data && Object.keys(data).length > 0) {
        setPortfolioData(data);
      }
    } catch (error) {
      console.error('Error loading portfolio data:', error);
      // Keep default data on error
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

