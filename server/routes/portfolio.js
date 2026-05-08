import express from 'express';
import mongoose from 'mongoose';
import Portfolio from '../models/Portfolio.js';
import { defaultPortfolioData } from '../config/defaultData.js';
import { uploadImageFromDataUrl, getConfiguredImageProvider } from '../utils/imageStorage.js';
import { requireAdminAuth } from '../utils/adminAuth.js';
import { createRateLimiter } from '../utils/rateLimit.js';

const router = express.Router();

// Helper function to check if MongoDB is connected
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

const mergePortfolioData = (existingData, incomingData) => {
  return {
    personal: { ...(existingData?.personal || {}), ...(incomingData?.personal || {}) },
    social: { ...(existingData?.social || {}), ...(incomingData?.social || {}) },
    skills: incomingData?.skills !== undefined ? incomingData.skills : (existingData?.skills || []),
    projects: incomingData?.projects !== undefined ? incomingData.projects : (existingData?.projects || []),
    experience: incomingData?.experience !== undefined ? incomingData.experience : (existingData?.experience || []),
    education: incomingData?.education !== undefined ? incomingData.education : (existingData?.education || []),
    certificates: incomingData?.certificates !== undefined ? incomingData.certificates : (existingData?.certificates || []),
    gallery: incomingData?.gallery !== undefined ? incomingData.gallery : (existingData?.gallery || []),
  };
};

const writeLimiter = createRateLimiter({
  keyPrefix: 'portfolio-write-local',
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Too many write requests. Please slow down.',
});

const uploadLimiter = createRateLimiter({
  keyPrefix: 'portfolio-upload-local',
  windowMs: 60 * 1000,
  maxRequests: 20,
  message: 'Too many image uploads. Please wait a moment.',
});

router.post('/upload-image', requireAdminAuth, uploadLimiter, async (req, res) => {
  try {
    const { imageData, fileName, folder, assetType } = req.body || {};

    if (!imageData || typeof imageData !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing imageData in request body',
      });
    }

    const uploaded = await uploadImageFromDataUrl({
      dataUrl: imageData,
      fileName: fileName || '',
      folder: folder || 'portfolio',
      assetType: assetType || 'general',
    });

    return res.status(200).json({
      success: true,
      provider: uploaded.provider || getConfiguredImageProvider(),
      url: uploaded.url,
      key: uploaded.key,
      bytes: uploaded.bytes,
      width: uploaded.width,
      height: uploaded.height,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error uploading image:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload image',
      details: error.message,
    });
  }
});

// Core portfolio endpoint for frontend incremental loading
router.get('/core', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(200).json({
        data: { personal: defaultPortfolioData.personal, social: defaultPortfolioData.social },
        isCustomized: false,
        version: Date.now(),
        timestamp: new Date().toISOString(),
      });
    }

    const portfolio = await Portfolio.getPortfolio();
    const data = portfolio?.data || defaultPortfolioData;
    const hasCustomData = data?.personal?.email && data.personal.email !== 'your.email@example.com';

    return res.status(200).json({
      data: {
        personal: data.personal || defaultPortfolioData.personal,
        social: data.social || defaultPortfolioData.social,
      },
      isCustomized: Boolean(portfolio?.isCustomized || hasCustomData),
      version: portfolio?.updatedAt ? new Date(portfolio.updatedAt).getTime() : Date.now(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching core portfolio data:', error.message);
    return res.status(200).json({
      data: { personal: defaultPortfolioData.personal, social: defaultPortfolioData.social },
      isCustomized: false,
      version: Date.now(),
      timestamp: new Date().toISOString(),
    });
  }
});

// Sections endpoint for frontend progressive loading
router.get('/sections', async (req, res) => {
  try {
    const includeParam = req.query.include || '';
    const sections = includeParam.split(',').map(s => s.trim()).filter(Boolean);

    if (sections.length === 0) {
      return res.status(400).json({ error: 'No sections specified. Use ?include=skills,projects,...' });
    }

    if (!isMongoConnected()) {
      const defaultSections = {};
      sections.forEach(section => {
        defaultSections[section] = defaultPortfolioData[section] || [];
      });
      return res.status(200).json({
        data: defaultSections,
        version: Date.now(),
        timestamp: new Date().toISOString(),
      });
    }

    const portfolio = await Portfolio.getPortfolio();
    const data = portfolio?.data || defaultPortfolioData;
    const sectionData = {};
    sections.forEach(section => {
      sectionData[section] = data?.[section] ?? defaultPortfolioData[section] ?? [];
    });

    return res.status(200).json({
      data: sectionData,
      version: portfolio?.updatedAt ? new Date(portfolio.updatedAt).getTime() : Date.now(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching portfolio sections:', error.message);
    const includeParam = req.query.include || '';
    const sections = includeParam.split(',').map(s => s.trim()).filter(Boolean);
    const defaultSections = {};
    sections.forEach(section => {
      defaultSections[section] = defaultPortfolioData[section] || [];
    });
    return res.status(200).json({
      data: defaultSections,
      version: Date.now(),
      timestamp: new Date().toISOString(),
    });
  }
});

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
router.post('/', requireAdminAuth, writeLimiter, async (req, res) => {
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
    const isPartialUpdate = req.headers['x-partial-update'] === 'true';
    
    // Validate data structure
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    let dataToSave = data;
    if (isPartialUpdate) {
      const existingPortfolio = await Portfolio.getPortfolio();
      const existingData = existingPortfolio?.data || defaultPortfolioData;
      dataToSave = mergePortfolioData(existingData, data);
    }

    const updatedPortfolio = await Portfolio.updatePortfolio(dataToSave);
    res.json({
      success: true,
      message: 'Portfolio data saved successfully',
      version: updatedPortfolio?.updatedAt ? new Date(updatedPortfolio.updatedAt).getTime() : Date.now(),
      timestamp: new Date().toISOString(),
    });
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
router.delete('/', requireAdminAuth, writeLimiter, async (req, res) => {
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
