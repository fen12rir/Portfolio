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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Partial-Update']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mount router
app.use('/', router);

// Get portfolio data
router.get('/', asyncHandler(async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) {
      return res.status(200).json({ data: defaultPortfolioData, isCustomized: false });
    }
    
    try {
      await connectMongo();
    } catch (mongoError) {
      console.error('MongoDB connection failed:', mongoError.message);
      return res.status(200).json({ data: defaultPortfolioData, isCustomized: false });
    }
    
    if (!isMongoConnected()) {
      return res.status(200).json({ data: defaultPortfolioData, isCustomized: false });
    }

    try {
      const PortfolioModel = await getPortfolioModel();
      if (!PortfolioModel || typeof PortfolioModel.getPortfolio !== 'function') {
        console.error('Portfolio model is null or getPortfolio is not a function');
        return res.status(200).json({ data: defaultPortfolioData, isCustomized: false });
      }
      const portfolio = await PortfolioModel.getPortfolio();
      
      if (!portfolio || !portfolio.data || typeof portfolio.data !== 'object' || Object.keys(portfolio.data).length === 0) {
        return res.status(200).json({ data: defaultPortfolioData, isCustomized: false });
      }
      
      const isCustomized = portfolio.isCustomized !== undefined ? portfolio.isCustomized : (portfolio.data.personal?.email !== "your.email@example.com");
      return res.status(200).json({ data: portfolio.data, isCustomized });
    } catch (modelError) {
      console.error('Error with Portfolio model:', modelError);
      console.error('Error stack:', modelError.stack);
      return res.status(200).json({ data: defaultPortfolioData, isCustomized: false });
    }
  } catch (error) {
    console.error('Unexpected error fetching portfolio data:', error);
    console.error('Error stack:', error.stack);
    return res.status(200).json({ data: defaultPortfolioData, isCustomized: false });
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
    
    let dataToSave = data;
    
    if (isPartialUpdate) {
      const existingPortfolio = await PortfolioModel.getPortfolio();
      const existingData = existingPortfolio && existingPortfolio.data && Object.keys(existingPortfolio.data).length > 0
        ? existingPortfolio.data
        : defaultPortfolioData;
      
      dataToSave = {
        ...existingData,
        ...data,
        personal: { ...existingData.personal, ...(data.personal || {}) },
        social: { ...existingData.social, ...(data.social || {}) },
        skills: data.skills !== undefined ? data.skills : existingData.skills,
        projects: data.projects !== undefined ? data.projects : existingData.projects,
        experience: data.experience !== undefined ? data.experience : existingData.experience,
        education: data.education !== undefined ? data.education : existingData.education,
        certificates: data.certificates !== undefined ? data.certificates : existingData.certificates,
        gallery: data.gallery !== undefined ? data.gallery : existingData.gallery,
      };
    }
    
    const savedPortfolio = await PortfolioModel.updatePortfolio(dataToSave);
    
    if (!savedPortfolio || !savedPortfolio.data) {
      throw new Error('Failed to save portfolio data');
    }
    
    res.json({ success: true, message: 'Portfolio data saved successfully' });
  } catch (error) {
    console.error('Error saving portfolio data:', error.message);
    console.error('Error stack:', error.stack);
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

export default function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Max-Age', '86400');
      return res.status(200).end();
    }
    
    const originalUrl = req.url;
    if (req.url.startsWith('/api/portfolio')) {
      req.url = req.url.replace('/api/portfolio', '') || '/';
      req.originalUrl = req.originalUrl || originalUrl;
    }
    
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
