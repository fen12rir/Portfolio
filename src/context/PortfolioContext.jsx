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

  const loadPortfolioData = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      const result = await getPortfolioDataWithStatus(forceRefresh);
      
      if (result && result.data && Object.keys(result.data).length > 0) {
        const hasData = result.data.personal || result.data.skills?.length > 0 || result.data.projects?.length > 0;
        if (hasData) {
          setPortfolioData(result.data);
          if (!result.isCustomized && import.meta.env.DEV) {
            console.info('ℹ️ Portfolio data loaded. Customize it in /admin if needed');
          }
        } else {
          setPortfolioData(null);
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
    clearCache();
    loadPortfolioData(true);
    
    const handleStorageChange = (e) => {
      if (e.key === 'portfolio_data_updated') {
        refreshPortfolioData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
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

