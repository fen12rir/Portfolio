// Vercel serverless function - main API handler
import express from 'express';
import cors from 'cors';

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
// Wrap Express app in a handler function for Vercel compatibility
export default function handler(req, res) {
  // Explicitly handle OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  
  // Normalize the URL for Express routing
  // In Vercel, api/index.js receives requests to /api
  // But our router expects /, so we need to adjust the URL
  const originalUrl = req.url;
  if (req.url === '/api' || req.url.startsWith('/api/')) {
    // Remove /api prefix for Express routing
    req.url = req.url.replace('/api', '') || '/';
    req.originalUrl = req.originalUrl || originalUrl;
  }
  
  return app(req, res);
}
