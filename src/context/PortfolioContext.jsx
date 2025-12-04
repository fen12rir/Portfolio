import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getCorePortfolioData, getPortfolioSections, clearCache } from '../utils/storage';

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
      
      const coreResult = await getCorePortfolioData(forceRefresh);
      
      if (!mountedRef.current) return;
      
      if (coreResult && coreResult.data) {
        const coreData = {
          ...coreResult.data,
          skills: [],
          projects: [],
          experience: [],
          education: [],
          certificates: [],
          gallery: []
        };
        
        setPortfolioData(coreData);
        
        const prioritySections = ['experience', 'education'];
        const priorityData = await getPortfolioSections(prioritySections, forceRefresh);
        
        if (!mountedRef.current) return;
        
        if (priorityData && Object.keys(priorityData).length > 0) {
          setPortfolioData(prev => ({
            ...prev,
            ...priorityData
          }));
        }
        
        setIsLoading(false);
        
        if (import.meta.env.DEV) {
          console.log('✅ Core portfolio data loaded:', {
            name: coreData.personal?.name,
            isCustomized: coreResult.isCustomized
          });
        }
        
        const remainingSections = ['skills', 'projects', 'certificates', 'gallery'];
        const sectionsData = await getPortfolioSections(remainingSections, forceRefresh);
        
        if (!mountedRef.current) return;
        
        if (sectionsData && Object.keys(sectionsData).length > 0) {
          setPortfolioData(prev => ({
            ...prev,
            ...sectionsData
          }));
          
          if (import.meta.env.DEV) {
            console.log('✅ Portfolio sections loaded:', {
              sections: Object.keys(sectionsData),
              projects: sectionsData.projects?.length || 0
            });
          }
        }
        
        const finalData = { ...coreData, ...priorityData, ...sectionsData };
        
        const hasData = finalData.personal?.name || 
          (finalData.skills && finalData.skills.length > 0) || 
          (finalData.projects && finalData.projects.length > 0) ||
          (finalData.experience && finalData.experience.length > 0) ||
          (finalData.education && finalData.education.length > 0);
        
        const isDefault = finalData.personal?.email === "your.email@example.com" &&
          (!finalData.skills || finalData.skills.length === 0) &&
          (!finalData.projects || finalData.projects.length === 0);
        
        if (!hasData || isDefault) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ No portfolio data found, showing setup message');
          }
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

