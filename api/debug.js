import { connectMongo, isMongoConnected } from './mongodb.js';
import { defaultPortfolioData } from '../server/config/defaultData.js';

let PortfolioModels = null;
const getPortfolioModels = async () => {
  if (!PortfolioModels) {
    try {
      const mongoose = (await import('./mongodb.js')).default;
      const NormalizedModule = await import('../server/models/PortfolioNormalized.js');
      PortfolioModels = NormalizedModule.createPortfolioNormalizedModels(mongoose);
    } catch (error) {
      console.error('Error loading normalized Portfolio models:', error);
      throw new Error('Failed to load Portfolio models: ' + error.message);
    }
  }
  return PortfolioModels;
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const debugInfo = {
    timestamp: new Date().toISOString(),
    mongodb_uri_set: !!process.env.MONGODB_URI,
    mongodb_connected: false,
    portfolio_exists: false,
    portfolio_data: null,
    error: null
  };

  try {
    if (!process.env.MONGODB_URI) {
      debugInfo.error = 'MONGODB_URI not set';
      return res.status(200).json(debugInfo);
    }

    try {
      await connectMongo(3);
      debugInfo.mongodb_connected = isMongoConnected();
    } catch (mongoError) {
      debugInfo.error = `MongoDB connection failed: ${mongoError.message}`;
      return res.status(200).json(debugInfo);
    }

    if (!isMongoConnected()) {
      debugInfo.error = 'MongoDB not connected after connection attempt';
      return res.status(200).json(debugInfo);
    }

    try {
      const models = await getPortfolioModels();
      const portfolio = await models.Portfolio.getPortfolio();
      
      if (portfolio) {
        debugInfo.portfolio_exists = true;
        const fullPortfolio = await models.Portfolio.getFullPortfolio();
        
        if (fullPortfolio) {
          debugInfo.portfolio_data = {
            hasPersonal: !!fullPortfolio.personal?.name,
            personalName: fullPortfolio.personal?.name || 'N/A',
            personalEmail: fullPortfolio.personal?.email || 'N/A',
            skillsCount: fullPortfolio.skills?.length || 0,
            projectsCount: fullPortfolio.projects?.length || 0,
            experienceCount: fullPortfolio.experience?.length || 0,
            educationCount: fullPortfolio.education?.length || 0,
            isCustomized: fullPortfolio.isCustomized || false
          };
        } else {
          debugInfo.error = 'Portfolio exists but getFullPortfolio returned null';
        }
      } else {
        debugInfo.error = 'No portfolio document found in database';
        
        try {
          const mongoose = (await import('./mongodb.js')).default;
          const db = mongoose.connection.db;
          const oldCollection = db.collection('portfolios');
          const oldCount = await oldCollection.countDocuments({}, { maxTimeMS: 5000 }).catch(() => 0);
          debugInfo.old_collection_count = oldCount;
        } catch (e) {
          debugInfo.old_collection_error = e.message;
        }
      }
    } catch (modelError) {
      debugInfo.error = `Model error: ${modelError.message}`;
      debugInfo.error_stack = modelError.stack;
    }

    return res.status(200).json(debugInfo);
  } catch (error) {
    debugInfo.error = `Unexpected error: ${error.message}`;
    debugInfo.error_stack = error.stack;
    return res.status(200).json(debugInfo);
  }
}

