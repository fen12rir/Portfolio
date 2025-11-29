import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PortfolioProvider, usePortfolio } from './context/PortfolioContext';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Projects from './components/Projects';
import Certificates from './components/Certificates';
import ImageGallery from './components/ImageGallery';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';

const AppContent = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isLoading: portfolioLoading, portfolioData } = usePortfolio();
  const [currentPath, setCurrentPath] = useState(() => {
    const path = window.location.hash.slice(1) || window.location.pathname;
    return path || '/';
  });
  
  const isLoading = authLoading || portfolioLoading;
  
  // Get logo/name for loading screen
  const getLogoName = () => {
    if (!portfolioData) return 'Portfolio';
    if (portfolioData.personal?.headerLogo) {
      return portfolioData.personal.headerLogo;
    }
    if (portfolioData.personal?.name) {
      return portfolioData.personal.name.split(' ')[0];
    }
    return 'Portfolio';
  };

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.slice(1) || '/');
    };

    const handlePopState = () => {
      setCurrentPath(window.location.hash.slice(1) || window.location.pathname);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (currentPath === '/admin' && !isAuthenticated && !isLoading) {
      window.location.hash = '#/login';
      setCurrentPath('/login');
    }
  }, [currentPath, isAuthenticated, isLoading]);

  // Show loading screen while auth or portfolio data is loading
  if (isLoading || !portfolioData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900">
        <div className="text-center">
          <a 
            href="#home" 
            className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-emerald-400 bg-clip-text text-transparent hover:from-teal-400 hover:to-emerald-300 transition-all duration-300 inline-block"
          >
            {getLogoName()}
          </a>
        </div>
      </div>
    );
  }

  if (currentPath === '/login' || currentPath === '#/login') {
    return <Login />;
  }

  if (currentPath === '/admin' || currentPath === '#/admin') {
    if (!isAuthenticated) {
      return <Login />;
    }
    return <AdminDashboard />;
  }

  return (
    <div className="App">
      <Header />
      <Hero />
      <About />
      <ImageGallery />
      <Skills />
      <Projects />
      <Certificates />
      <Contact />
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <PortfolioProvider>
        <AppContent />
      </PortfolioProvider>
    </AuthProvider>
  );
}

export default App;
