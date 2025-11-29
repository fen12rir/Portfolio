// Vercel serverless function for portfolio API
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import mongoose from 'mongoose';
import Portfolio from '../server/models/Portfolio.js';
import { defaultPortfolioData } from '../server/config/defaultData.js';

const router = express.Router();

// Helper function to check if MongoDB is connected
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Initialize MongoDB connection
const connectMongo = async () => {
  if (mongoose.connection.readyState === 1) {
    return; // Already connected
  }

  let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio';

  const mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  if (MONGODB_URI.includes('mongodb+srv://') && !MONGODB_URI.includes('retryWrites')) {
    const separator = MONGODB_URI.includes('?') ? '&' : '?';
    MONGODB_URI = `${MONGODB_URI}${separator}retryWrites=true&w=majority`;
  }

  try {
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
  }
};

// Initialize connection on module load
connectMongo();

// Get portfolio data
router.get('/', async (req, res) => {
  try {
    await connectMongo();
    
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
    res.json(defaultPortfolioData);
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

    await Portfolio.updatePortfolio(data);
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

    await Portfolio.resetPortfolio(defaultPortfolioData);
    res.json({ success: true, message: 'Portfolio data reset successfully', data: defaultPortfolioData });
  } catch (error) {
    console.error('Error resetting portfolio data:', error.message);
    res.status(500).json({ success: false, error: 'Failed to reset portfolio data', details: error.message });
  }
});

export default router;

