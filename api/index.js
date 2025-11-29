// Vercel serverless function - main API handler
import express from 'express';
import cors from 'cors';
import portfolioRoutes from './portfolio.js';

const app = express();

// Middleware
// CORS configuration - allow all origins for now (adjust in production)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware to handle Vercel path rewrites
// Vercel rewrites /api/portfolio to /api, but we need to extract the actual path
app.use((req, res, next) => {
  // Vercel passes the original path in x-rewrite-url header or we can use req.originalUrl
  // Check x-rewrite-url header first (Vercel sets this)
  const rewriteUrl = req.headers['x-rewrite-url'] || req.headers['x-vercel-rewrite-path'];
  const originalPath = rewriteUrl || req.originalUrl || req.url;
  
  // Extract path after /api/
  if (originalPath && originalPath.startsWith('/api/')) {
    req.url = originalPath.replace('/api', '');
  } else if (req.url.startsWith('/api/')) {
    req.url = req.url.replace('/api', '');
  } else if (req.url === '/api' && originalPath && originalPath !== '/api') {
    // If current URL is /api but original was different, extract from original
    const match = originalPath.match(/\/api\/(.+)/);
    if (match) {
      req.url = '/' + match[1];
    }
  }
  
  // Log for debugging
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[API] ${req.method} - URL: ${req.url}, Original: ${originalPath}, Rewrite: ${rewriteUrl}`);
  }
  
  next();
});

// Routes - ensure portfolioRoutes is a valid router
// Express routers are objects with a handle method, not functions
if (portfolioRoutes && typeof portfolioRoutes === 'object' && typeof portfolioRoutes.handle === 'function') {
  app.use('/portfolio', portfolioRoutes);
} else {
  console.error('portfolioRoutes is not a valid router:', typeof portfolioRoutes, portfolioRoutes);
  app.use('/portfolio', (req, res) => {
    res.status(500).json({ error: 'Portfolio routes not available' });
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Portfolio API',
    endpoints: {
      health: '/api/health',
      portfolio: '/api/portfolio'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  console.error('Error stack:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message 
  });
});

// Export as Vercel serverless function
export default app;
