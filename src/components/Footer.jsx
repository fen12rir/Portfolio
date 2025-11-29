import { usePortfolio } from '../context/PortfolioContext';
import { useAuth } from '../context/AuthContext';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { isAuthenticated } = useAuth();
  const { portfolioData } = usePortfolio();
  
  if (!portfolioData) return null;

  return (
    <footer className="py-8 border-t border-stone-800/50 bg-stone-900/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-stone-500 text-sm mb-4 md:mb-0">
            © {currentYear} <span className="text-teal-400">{portfolioData.personal.name}</span>. All rights reserved.
          </p>
          
          {!isAuthenticated && (
            <a
              href="#/login"
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = '#/login';
                window.location.reload();
              }}
              className="text-stone-500 hover:text-teal-400 transition-colors duration-200"
              aria-label="Admin Login"
              title="Admin Login"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
