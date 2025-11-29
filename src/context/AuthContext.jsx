import { createContext, useContext, useState, useEffect } from 'react';

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
    const authStatus = localStorage.getItem('portfolio_auth');
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = (password) => {
    const adminPassword = localStorage.getItem('portfolio_admin_password');
    
    // If no password is set, allow setting one (first time setup)
    if (!adminPassword) {
      if (password && password.length >= 6) {
        localStorage.setItem('portfolio_admin_password', password);
        localStorage.setItem('portfolio_auth', 'authenticated');
        setIsAuthenticated(true);
        return true;
      }
      return false;
    }
    
    if (password === adminPassword) {
      localStorage.setItem('portfolio_auth', 'authenticated');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('portfolio_auth');
    setIsAuthenticated(false);
  };

  const setPassword = (newPassword) => {
    localStorage.setItem('portfolio_admin_password', newPassword);
  };

  const value = {
    isAuthenticated,
    isLoading,
    login,
    logout,
    setPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

