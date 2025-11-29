// Vercel serverless function for portfolio API routes
console.log('Portfolio API module loading...');
import express from 'express';
import cors from 'cors';
import { defaultPortfolioData } from '../server/config/defaultData.js';
import { connectMongo, isMongoConnected } from './mongodb.js';

const router = express.Router();

// Lazy load Portfolio model to avoid import-time issues
let Portfolio = null;
const getPortfolioModel = async () => {
  if (!Portfolio) {
    try {
      // Import mongoose from shared module first
      const mongoose = (await import('./mongodb.js')).default;
      // Import Portfolio model factory
      const PortfolioModule = await import('../server/models/Portfolio.js');
      // Create model with shared mongoose instance
      Portfolio = PortfolioModule.createPortfolioModel(mongoose);
    } catch (error) {
      console.error('Error loading Portfolio model:', error);
      console.error('Error stack:', error.stack);
      // Fallback: try default export (for local dev)
      try {
        const PortfolioModule = await import('../server/models/Portfolio.js');
        Portfolio = PortfolioModule.default;
        if (!Portfolio) {
          throw new Error('Portfolio model not available');
        }
      } catch (fallbackError) {
        console.error('Fallback Portfolio model load failed:', fallbackError);
        throw new Error('Failed to load Portfolio model: ' + error.message);
      }
    }
  }
  return Portfolio;
};

// Helper to wrap async route handlers
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Create Express app for this serverless function
const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mount router
app.use('/', router);

// Get portfolio data
router.get('/', asyncHandler(async (req, res) => {
  try {
    // Always return default data if MONGODB_URI is not set
    if (!process.env.MONGODB_URI) {
      console.log('⚠️  MONGODB_URI not set - returning default data');
      return res.status(200).json(defaultPortfolioData);
    }
    
    try {
      await connectMongo();
    } catch (mongoError) {
      console.error('MongoDB connection failed:', mongoError.message);
      return res.status(200).json(defaultPortfolioData);
    }
    
    if (!isMongoConnected()) {
      console.log('⚠️  MongoDB not connected - returning default data');
      return res.status(200).json(defaultPortfolioData);
    }

    try {
      const PortfolioModel = await getPortfolioModel();
      if (!PortfolioModel || typeof PortfolioModel.getPortfolio !== 'function') {
        console.error('Portfolio model is null or getPortfolio is not a function');
        return res.status(200).json(defaultPortfolioData);
      }
      const portfolio = await PortfolioModel.getPortfolio();
      const data = portfolio && portfolio.data && Object.keys(portfolio.data).length > 0 
        ? portfolio.data 
        : defaultPortfolioData;
      return res.status(200).json(data);
    } catch (modelError) {
      console.error('Error with Portfolio model:', modelError);
      return res.status(200).json(defaultPortfolioData);
    }
  } catch (error) {
    console.error('Unexpected error fetching portfolio data:', error);
    console.error('Error stack:', error.stack);
    return res.status(200).json(defaultPortfolioData);
  }
}));

// Save portfolio data
router.post('/', asyncHandler(async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) {
      return res.status(503).json({ 
        success: false,
        error: 'MongoDB not configured', 
        message: 'Please configure MONGODB_URI environment variable in Vercel.'
      });
    }

    try {
      await connectMongo();
    } catch (mongoError) {
      return res.status(503).json({ 
        success: false,
        error: 'MongoDB connection failed', 
        message: mongoError.message
      });
    }
    
    if (!isMongoConnected()) {
      return res.status(503).json({ 
        success: false,
        error: 'MongoDB not connected', 
        message: 'Please configure MONGODB_URI environment variable in Vercel.'
      });
    }

    const data = req.body;
    const isPartialUpdate = req.headers['x-partial-update'] === 'true';
    
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    const PortfolioModel = await getPortfolioModel();
    if (!PortfolioModel) {
      return res.status(500).json({ 
        success: false, 
        error: 'Portfolio model not available' 
      });
    }
    
    // If partial update, merge with existing data
    if (isPartialUpdate) {
      const existingPortfolio = await PortfolioModel.getPortfolio();
      const existingData = existingPortfolio && existingPortfolio.data && Object.keys(existingPortfolio.data).length > 0
        ? existingPortfolio.data
        : defaultPortfolioData;
      
      // Deep merge the partial update with existing data
      const mergedData = {
        ...existingData,
        ...data,
        // Deep merge nested objects
        personal: { ...existingData.personal, ...(data.personal || {}) },
        social: { ...existingData.social, ...(data.social || {}) },
        skills: data.skills !== undefined ? data.skills : existingData.skills,
        projects: data.projects !== undefined ? data.projects : existingData.projects,
        experience: data.experience !== undefined ? data.experience : existingData.experience,
        education: data.education !== undefined ? data.education : existingData.education,
        certificates: data.certificates !== undefined ? data.certificates : existingData.certificates,
        gallery: data.gallery !== undefined ? data.gallery : existingData.gallery,
      };
      
      await PortfolioModel.updatePortfolio(mergedData);
    } else {
      // Full update
      await PortfolioModel.updatePortfolio(data);
    }
    
    res.json({ success: true, message: 'Portfolio data saved successfully' });
  } catch (error) {
    console.error('Error saving portfolio data:', error.message);
    res.status(500).json({ success: false, error: 'Failed to save portfolio data', details: error.message });
  }
}));

// Reset portfolio data
router.delete('/', asyncHandler(async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) {
      return res.status(503).json({ 
        success: false,
        error: 'MongoDB not configured',
        data: defaultPortfolioData
      });
    }

    try {
      await connectMongo();
    } catch (mongoError) {
      return res.status(503).json({ 
        success: false,
        error: 'MongoDB connection failed',
        data: defaultPortfolioData
      });
    }
    
    if (!isMongoConnected()) {
      return res.status(503).json({ 
        success: false,
        error: 'MongoDB not connected',
        data: defaultPortfolioData
      });
    }

    const PortfolioModel = await getPortfolioModel();
    if (!PortfolioModel) {
      return res.status(500).json({ 
        success: false, 
        error: 'Portfolio model not available' 
      });
    }
    await PortfolioModel.resetPortfolio(defaultPortfolioData);
    res.json({ success: true, message: 'Portfolio data reset successfully', data: defaultPortfolioData });
  } catch (error) {
    console.error('Error resetting portfolio data:', error.message);
    res.status(500).json({ success: false, error: 'Failed to reset portfolio data', details: error.message });
  }
}));

// Export as Vercel serverless function
// Wrap Express app in a handler function for Vercel compatibility
console.log('Portfolio API handler exported');
export default function handler(req, res) {
  try {
    // Explicitly handle OPTIONS requests for CORS preflight
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Max-Age', '86400');
      return res.status(200).end();
    }
    
    // Log for debugging
    console.log('Portfolio API handler called:', {
      method: req.method,
      url: req.url,
      path: req.path,
      originalUrl: req.originalUrl
    });
    
    // Normalize the URL for Express routing
    // In Vercel, api/portfolio.js receives requests to /api/portfolio
    // But our router expects /, so we need to adjust the URL
    const originalUrl = req.url;
    if (req.url.startsWith('/api/portfolio')) {
      req.url = req.url.replace('/api/portfolio', '') || '/';
      req.originalUrl = req.originalUrl || originalUrl;
    }
    
    console.log('Normalized URL:', {
      original: originalUrl,
      normalized: req.url
    });
    
    // Handle the request with Express app
    return app(req, res);
  } catch (error) {
    console.error('Error in portfolio handler:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
