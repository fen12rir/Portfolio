import { useState, useEffect, lazy, Suspense, memo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PortfolioProvider, usePortfolio } from './context/PortfolioContext';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';

const Skills = lazy(() => import('./components/Skills'));
const Projects = lazy(() => import('./components/Projects'));
const Certificates = lazy(() => import('./components/Certificates'));
const ImageGallery = lazy(() => import('./components/ImageGallery'));
const Contact = lazy(() => import('./components/Contact'));
const Footer = lazy(() => import('./components/Footer'));
const Login = lazy(() => import('./components/Login'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

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
    if (!portfolioData) return 'DIO';
    if (portfolioData.personal?.headerLogo) {
      return portfolioData.personal.headerLogo;
    }
    if (portfolioData.personal?.name) {
      return portfolioData.personal.name.split(' ')[0];
    }
    return 'DIO';
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900">
        <div className="text-center">
          <div className="relative inline-block">
            <a 
              href="#home" 
              className="text-2xl font-bold bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-500 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient inline-block"
            >
              {portfolioData ? getLogoName() : 'DIO'}
            </a>
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/20 via-emerald-400/20 to-teal-500/20 rounded-lg blur-lg animate-pulse"></div>
          </div>
          <div className="mt-8 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!portfolioData && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900 px-4">
        <div className="text-center max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-500 to-emerald-400 bg-clip-text text-transparent mb-4">
            Portfolio Setup Required
          </h1>
          <p className="text-stone-400 mb-6 text-lg">
            No custom portfolio data has been configured yet.
          </p>
          <p className="text-stone-500 mb-8">
            Go to <a href="#/admin" className="text-teal-400 hover:text-teal-300 underline">Admin Dashboard</a> to customize your portfolio.
          </p>
          <div className="text-sm text-stone-600 space-y-1">
            <p>This is normal if:</p>
            <ul className="list-disc list-inside space-y-1 text-left max-w-md mx-auto">
              <li>No custom data has been saved yet</li>
              <li>MongoDB is not configured (set MONGODB_URI in Vercel)</li>
              <li>MongoDB connection failed</li>
            </ul>
          </div>
          {import.meta.env.DEV && (
            <div className="mt-8 p-4 bg-stone-800/50 rounded-lg text-left text-xs text-stone-500">
              <p className="font-semibold mb-2">Debug Info:</p>
              <p>Check browser console for API response details</p>
              <p>API URL: {import.meta.env.VITE_API_URL || `${window.location.origin}/api`}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentPath === '/login' || currentPath === '#/login') {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-stone-900">
          <div className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-emerald-400 bg-clip-text text-transparent">
            DIO
          </div>
        </div>
      }>
        <Login />
      </Suspense>
    );
  }

  if (currentPath === '/admin' || currentPath === '#/admin') {
    if (!isAuthenticated) {
      return (
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-stone-900">
            <div className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-emerald-400 bg-clip-text text-transparent">
              DIO
            </div>
          </div>
        }>
          <Login />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-stone-900">
          <div className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-emerald-400 bg-clip-text text-transparent">
            DIO
          </div>
        </div>
      }>
        <AdminDashboard />
      </Suspense>
    );
  }

  return (
    <div className="App">
      <Header />
      <Hero />
      <About />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-stone-400">Loading...</div>
        </div>
      }>
        <ImageGallery />
        <Skills />
        <Projects />
        <Certificates />
        <Contact />
        <Footer />
      </Suspense>
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
