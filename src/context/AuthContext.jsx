import { createContext, useContext, useState, useEffect } from 'react';
import { getAdminSession, loginAdmin, logoutAdmin } from '../utils/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      const authenticated = await getAdminSession();
      if (active) {
        setIsAuthenticated(authenticated);
        setIsLoading(false);
      }
    };

    loadSession();
    return () => {
      active = false;
    };
  }, []);

  const login = async (password) => {
    const result = await loginAdmin(password);
    if (result.success) {
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: result.error || 'Login failed' };
  };

  const logout = async () => {
    await logoutAdmin();
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

