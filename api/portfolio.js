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
      const PortfolioModule = await import('../server/models/Portfolio.js');
      Portfolio = PortfolioModule.default;
    } catch (error) {
      console.error('Error loading Portfolio model:', error);
      throw error;
    }
  }
  return Portfolio;
};

// Get portfolio data
router.get('/', async (req, res) => {
  try {
    await connectMongo();
    
    if (!isMongoConnected()) {
      console.log('⚠️  MongoDB not connected - returning default data');
      return res.json(defaultPortfolioData);
    }

    const PortfolioModel = await getPortfolioModel();
    const portfolio = await PortfolioModel.getPortfolio();
    const data = portfolio.data && Object.keys(portfolio.data).length > 0 
      ? portfolio.data 
      : defaultPortfolioData;
    res.json(data);
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    console.error('Error stack:', error.stack);
    // Always return default data on error to prevent 500
    return res.json(defaultPortfolioData);
  }
});

// Save portfolio data
router.post('/', async (req, res) => {
  try {
    await connectMongo();
    
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
    await PortfolioModel.updatePortfolio(data);
    res.json({ success: true, message: 'Portfolio data saved successfully' });
  } catch (error) {
    console.error('Error saving portfolio data:', error.message);
    res.status(500).json({ success: false, error: 'Failed to save portfolio data', details: error.message });
  }
});

// Reset portfolio data
router.delete('/', async (req, res) => {
  try {
    await connectMongo();
    
    if (!isMongoConnected()) {
      return res.status(503).json({ 
        success: false,
        error: 'MongoDB not connected',
        data: defaultPortfolioData
      });
    }

    const PortfolioModel = await getPortfolioModel();
    await PortfolioModel.resetPortfolio(defaultPortfolioData);
    res.json({ success: true, message: 'Portfolio data reset successfully', data: defaultPortfolioData });
  } catch (error) {
    console.error('Error resetting portfolio data:', error.message);
    res.status(500).json({ success: false, error: 'Failed to reset portfolio data', details: error.message });
  }
});

export default router;
