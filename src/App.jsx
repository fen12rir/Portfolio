import { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PortfolioProvider, usePortfolio } from './context/PortfolioContext';
import PublicPortfolio from './components/PublicPortfolio';

const Login = lazy(() => import('./components/Login'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

const BrandLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-stone-900">
    <div className="text-center">
      <div className="text-xs uppercase tracking-[0.5em] text-teal-400/70">Loading</div>
      <div className="portfolio-logo mt-4 text-3xl">
        DIO
      </div>
      <div className="mt-6 flex justify-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-teal-400 animate-bounce"></span>
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:160ms]"></span>
        <span className="h-2.5 w-2.5 rounded-full bg-teal-300 animate-bounce [animation-delay:320ms]"></span>
      </div>
    </div>
  </div>
);

const getNormalizedPath = () => {
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  if (hash && hash.startsWith('#/')) {
    return hash.slice(1) || '/';
  }
  if (typeof window !== 'undefined') {
    return window.location.pathname || '/';
  }
  return '/';
};

const AppContent = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isLoading: portfolioLoading, portfolioData } = usePortfolio();
  const [currentPath, setCurrentPath] = useState(getNormalizedPath);

  const isLoading = authLoading || portfolioLoading;

  const navigateTo = (path, replace = false) => {
    if (replace) {
      window.history.replaceState({}, '', path);
    } else {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
  };

  useEffect(() => {
    const normalizedPath = getNormalizedPath();
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      window.history.replaceState({}, '', normalizedPath);
    }
    setCurrentPath(normalizedPath);

    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (currentPath === '/admin' && !isAuthenticated && !isLoading) {
      navigateTo('/login', true);
    }
  }, [currentPath, isAuthenticated, isLoading]);

  if (isLoading) {
    return <BrandLoader />;
  }

  if (!portfolioData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
        <div className="max-w-2xl rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center shadow-2xl shadow-cyan-950/30 backdrop-blur">
          <p className="text-sm uppercase tracking-[0.4em] text-cyan-300/70">Portfolio Setup Required</p>
          <h1 className="mt-4 text-4xl font-semibold text-white">No portfolio content is configured yet.</h1>
          <p className="mt-4 text-lg text-white/65">
            Open the <a href="/admin" className="text-cyan-300 underline underline-offset-4">admin dashboard</a> to
            add your real content and publish the public site.
          </p>
        </div>
      </div>
    );
  }

  if (currentPath === '/login') {
    return (
      <Suspense fallback={<BrandLoader />}>
        <Login />
      </Suspense>
    );
  }

  if (currentPath === '/admin') {
    if (!isAuthenticated) {
      return (
        <Suspense fallback={<BrandLoader />}>
          <Login />
        </Suspense>
      );
    }

    return (
      <Suspense fallback={<BrandLoader />}>
        <AdminDashboard />
      </Suspense>
    );
  }

  return <PublicPortfolio />;
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
