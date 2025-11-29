import express from 'express';
import mongoose from 'mongoose';
import Portfolio from '../models/Portfolio.js';
import { defaultPortfolioData } from '../config/defaultData.js';

const router = express.Router();

// Helper function to check if MongoDB is connected
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Get portfolio data
router.get('/', async (req, res) => {
  try {
    // Check if MongoDB is connected before attempting query
    if (!isMongoConnected()) {
      console.log('⚠️  MongoDB not connected - returning default data');
      return res.json(defaultPortfolioData);
    }

    const portfolio = await Portfolio.getPortfolio();
    const data = portfolio.data && Object.keys(portfolio.data).length > 0 
      ? portfolio.data 
      : defaultPortfolioData;
    res.json(data);
  } catch (error) {
    console.error('Error fetching portfolio data:', error.message);
    // Return default data for any MongoDB-related errors
    if (error.name === 'MongooseError' || 
        error.name === 'MongooseServerSelectionError' || 
        error.message === 'MongoDB not connected' ||
        error.message.includes('buffering timed out') ||
        error.message.includes('ECONNREFUSED')) {
      console.log('⚠️  MongoDB connection issue - returning default data');
      return res.json(defaultPortfolioData);
    }
    // For other errors, still return default data but log the error
    console.error('Unexpected error, returning default data:', error);
    res.json(defaultPortfolioData);
  }
});

// Save portfolio data
router.post('/', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (!isMongoConnected()) {
      return res.status(503).json({ 
        success: false,
        error: 'MongoDB not connected', 
        message: 'Please set up MongoDB connection. See MONGODB_SETUP.md for instructions.',
        details: 'Create server/.env file with MONGODB_URI'
      });
    }

    const data = req.body;
    
    // Validate data structure
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    await Portfolio.updatePortfolio(data);
    res.json({ success: true, message: 'Portfolio data saved successfully' });
  } catch (error) {
    console.error('Error saving portfolio data:', error.message);
    if (error.name === 'MongooseError' || 
        error.name === 'MongooseServerSelectionError' || 
        error.message === 'MongoDB not connected' ||
        error.message.includes('buffering timed out') ||
        error.message.includes('ECONNREFUSED')) {
      res.status(503).json({ 
        success: false,
        error: 'MongoDB not connected', 
        message: 'Please set up MongoDB connection. See MONGODB_SETUP.md for instructions.',
        details: 'Create server/.env file with MONGODB_URI'
      });
    } else {
      res.status(500).json({ success: false, error: 'Failed to save portfolio data', details: error.message });
    }
  }
});

// Reset portfolio data
router.delete('/', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (!isMongoConnected()) {
      return res.status(503).json({ 
        success: false,
        error: 'MongoDB not connected', 
        message: 'Please set up MongoDB connection. See MONGODB_SETUP.md for instructions.',
        data: defaultPortfolioData
      });
    }

    await Portfolio.resetPortfolio(defaultPortfolioData);
    res.json({ success: true, message: 'Portfolio data reset successfully', data: defaultPortfolioData });
  } catch (error) {
    console.error('Error resetting portfolio data:', error.message);
    if (error.name === 'MongooseError' || 
        error.name === 'MongooseServerSelectionError' || 
        error.message === 'MongoDB not connected' ||
        error.message.includes('buffering timed out') ||
        error.message.includes('ECONNREFUSED')) {
      res.status(503).json({ 
        success: false,
        error: 'MongoDB not connected', 
        message: 'Please set up MongoDB connection. See MONGODB_SETUP.md for instructions.',
        data: defaultPortfolioData
      });
    } else {
      res.status(500).json({ success: false, error: 'Failed to reset portfolio data', details: error.message });
    }
  }
});

export default router;

