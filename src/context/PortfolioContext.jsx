import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getCorePortfolioData, getPortfolioSections, getCachedPortfolioSnapshot } from '../utils/storage';

const PortfolioContext = createContext();

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

export const PortfolioProvider = ({ children }) => {
  const initialSnapshotRef = useRef(getCachedPortfolioSnapshot());
  const [portfolioData, setPortfolioData] = useState(initialSnapshotRef.current);
  const [isLoading, setIsLoading] = useState(() => !initialSnapshotRef.current);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  const loadPortfolioData = useCallback(async (forceRefresh = false) => {
    if (loadingRef.current && !forceRefresh) {
      return;
    }

    try {
      loadingRef.current = true;
      setIsLoading(prev => prev || !initialSnapshotRef.current);
      
      const coreResult = await getCorePortfolioData(forceRefresh);
      
      if (!mountedRef.current) return;
      
      if (coreResult && coreResult.data) {
        const coreData = coreResult.data;
        
        setPortfolioData(prev => ({
          skills: prev?.skills || [],
          projects: prev?.projects || [],
          experience: prev?.experience || [],
          education: prev?.education || [],
          certificates: prev?.certificates || [],
          gallery: prev?.gallery || [],
          ...(prev || {}),
          ...coreData,
        }));
        setIsLoading(false);
        
        if (import.meta.env.DEV) {
          console.log('✅ Core portfolio data loaded:', {
            name: coreData.personal?.name,
            isCustomized: coreResult.isCustomized
          });
        }
        
        const prioritySections = ['experience', 'education'];
        getPortfolioSections(prioritySections, forceRefresh).then(priorityData => {
          if (!mountedRef.current) return;
          
          if (priorityData && Object.keys(priorityData).length > 0) {
            setPortfolioData(prev => ({
              ...(prev || {}),
              ...priorityData
            }));
          }
        }).catch(error => {
          if (import.meta.env.DEV) {
            console.error('Error loading priority sections:', error);
          }
        });
        
        const remainingSections = ['skills', 'projects', 'certificates', 'gallery'];
        getPortfolioSections(remainingSections, forceRefresh).then(sectionsData => {
          if (!mountedRef.current) return;
          
          if (sectionsData && Object.keys(sectionsData).length > 0) {
            setPortfolioData(prev => ({
              ...(prev || {}),
              ...sectionsData
            }));
            
            if (import.meta.env.DEV) {
              console.log('✅ Portfolio sections loaded:', {
                sections: Object.keys(sectionsData),
                projects: sectionsData.projects?.length || 0
              });
            }
          }
        }).catch(error => {
          if (import.meta.env.DEV) {
            console.error('Error loading remaining sections:', error);
          }
        });
      } else {
        if (import.meta.env.DEV) {
          console.warn('⚠️ Empty result from API');
        }
        setPortfolioData(null);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error loading portfolio data:', error);
      if (mountedRef.current) {
        setPortfolioData(null);
        setIsLoading(false);
      }
    } finally {
      loadingRef.current = false;
    }
  }, []);

  const refreshPortfolioData = useCallback(async () => {
    await loadPortfolioData(true);
  }, [loadPortfolioData]);

  useEffect(() => {
    mountedRef.current = true;

    loadPortfolioData(false);
    
    const handleStorageChange = (e) => {
      if (e.key === 'portfolio_version' || e.key === 'portfolio_cache') {
        if (!loadingRef.current) {
          loadPortfolioData(false);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      mountedRef.current = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadPortfolioData]);

  const value = {
    portfolioData,
    isLoading,
    refreshPortfolioData,
  };

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
};
