// Vercel serverless function for portfolio API routes
import express from 'express';
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

// Get portfolio data
router.get('/', (req, res) => {
  (async () => {
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
  })().catch(err => {
    console.error('Unhandled promise rejection in GET /:', err);
    if (!res.headersSent) {
      res.status(200).json(defaultPortfolioData);
    }
  });
});

// Save portfolio data
router.post('/', (req, res) => {
  (async () => {
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
      await PortfolioModel.updatePortfolio(data);
      res.json({ success: true, message: 'Portfolio data saved successfully' });
    } catch (error) {
      console.error('Error saving portfolio data:', error.message);
      res.status(500).json({ success: false, error: 'Failed to save portfolio data', details: error.message });
    }
  })().catch(err => {
    console.error('Unhandled promise rejection in POST /:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });
});

// Reset portfolio data
router.delete('/', (req, res) => {
  (async () => {
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
  })().catch(err => {
    console.error('Unhandled promise rejection in DELETE /:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });
});

export default router;
