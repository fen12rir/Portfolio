// Vercel serverless function - main API handler
import express from 'express';
import cors from 'cors';
import portfolioRoutes from './portfolio.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes - ensure portfolioRoutes is a valid router
if (portfolioRoutes && typeof portfolioRoutes === 'function') {
  app.use('/portfolio', portfolioRoutes);
} else {
  console.error('portfolioRoutes is not a valid router:', typeof portfolioRoutes);
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
