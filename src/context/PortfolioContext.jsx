import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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
  const [portfolioData, setPortfolioData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  const loadPortfolioData = useCallback(async (forceRefresh = false) => {
    if (loadingRef.current && !forceRefresh) {
      return;
    }

    try {
      loadingRef.current = true;
      setIsLoading(true);
      
      const result = await getPortfolioDataWithStatus(forceRefresh);
      
      if (!mountedRef.current) return;
      
      if (result && result.data && Object.keys(result.data).length > 0) {
        const hasData = result.data.personal?.name || 
          result.data.skills?.length > 0 || 
          result.data.projects?.length > 0 ||
          result.data.experience?.length > 0 ||
          result.data.education?.length > 0;
        
        const isDefault = result.data.personal?.email === "your.email@example.com" &&
          (!result.data.skills || result.data.skills.length === 0) &&
          (!result.data.projects || result.data.projects.length === 0);
        
        if (hasData && !isDefault) {
          setPortfolioData(result.data);
          if (import.meta.env.DEV) {
            console.log('✅ Portfolio data loaded:', {
              name: result.data.personal?.name,
              isCustomized: result.isCustomized,
              projects: result.data.projects?.length || 0
            });
          }
        } else if (hasData) {
          setPortfolioData(result.data);
        } else {
          if (import.meta.env.DEV) {
            console.warn('⚠️ No portfolio data found, showing setup message');
          }
          setPortfolioData(null);
        }
      } else {
        if (import.meta.env.DEV) {
          console.warn('⚠️ Empty result from API');
        }
        setPortfolioData(null);
      }
    } catch (error) {
      console.error('Error loading portfolio data:', error);
      if (mountedRef.current) {
        setPortfolioData(null);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
      loadingRef.current = false;
    }
  }, []);

  const refreshPortfolioData = useCallback(async () => {
    clearCache();
    await loadPortfolioData(true);
  }, [loadPortfolioData]);

  useEffect(() => {
    mountedRef.current = true;
    
    clearCache();
    loadPortfolioData(true);
    
    const handleStorageChange = (e) => {
      if (e.key === 'portfolio_version' || e.key === 'portfolio_cache') {
        if (!loadingRef.current) {
          loadPortfolioData(true);
        }
      }
    };
    
    const handlePortfolioUpdate = () => {
      if (!loadingRef.current) {
        refreshPortfolioData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('portfolioDataUpdated', handlePortfolioUpdate);
    
    return () => {
      mountedRef.current = false;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('portfolioDataUpdated', handlePortfolioUpdate);
    };
  }, [loadPortfolioData, refreshPortfolioData]);

  const value = {
    portfolioData,
    isLoading,
    refreshPortfolioData,
  };

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
};

