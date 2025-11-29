import express from 'express';
import cors from 'cors';
import { defaultPortfolioData } from '../server/config/defaultData.js';
import { connectMongo, isMongoConnected } from './mongodb.js';

const router = express.Router();

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

const migrateOldData = async (OldPortfolio) => {
  try {
    const oldPortfolio = await OldPortfolio.findOne()
      .lean()
      .maxTimeMS(30000)
      .select('data isCustomized')
      .catch(() => null);
      
    if (!oldPortfolio || !oldPortfolio.data) {
      try {
        await OldPortfolio.deleteMany({}).maxTimeMS(5000);
      } catch (e) {
        console.log('Could not delete empty old portfolio');
      }
      return false;
    }

    const models = await getPortfolioModels();
    const data = oldPortfolio.data;
    
    if (!data || typeof data !== 'object') {
      await OldPortfolio.deleteMany({}).maxTimeMS(5000).catch(() => {});
      return false;
    }

    const portfolio = await models.Portfolio.create({
      personal: data.personal || {},
      social: data.social || {},
      isCustomized: oldPortfolio.isCustomized !== undefined ? oldPortfolio.isCustomized : (data.personal?.email !== "your.email@example.com")
    });

    const portfolioId = portfolio._id;

    if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
      const skillsToInsert = data.skills.map((skill, index) => ({
        portfolioId,
        name: skill.name || skill,
        level: skill.level || 0,
        order: index
      }));
      await models.Skill.insertMany(skillsToInsert);
    }

    if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
      const projectsToInsert = data.projects.map((project, index) => ({
        portfolioId,
        title: project.title,
        description: project.description || "",
        images: project.images || [],
        technologies: project.technologies || [],
        github: project.github || "",
        live: project.live || "",
        order: index
      }));
      await models.Project.insertMany(projectsToInsert);
    }

    if (data.experience && Array.isArray(data.experience) && data.experience.length > 0) {
      const experienceToInsert = data.experience.map((exp, index) => ({
        portfolioId,
        role: exp.role,
        company: exp.company,
        period: exp.period || "",
        description: exp.description || "",
        order: index
      }));
      await models.Experience.insertMany(experienceToInsert);
    }

    if (data.education && Array.isArray(data.education) && data.education.length > 0) {
      const educationToInsert = data.education.map((edu, index) => ({
        portfolioId,
        degree: edu.degree,
        institution: edu.institution,
        period: edu.period || "",
        order: index
      }));
      await models.Education.insertMany(educationToInsert);
    }

    if (data.certificates && Array.isArray(data.certificates) && data.certificates.length > 0) {
      const certificatesToInsert = data.certificates.map((cert, index) => ({
        portfolioId,
        name: cert.name || cert.title || "",
        issuer: cert.issuer || "",
        date: cert.date || "",
        url: cert.url || cert.credentialUrl || "",
        image: cert.image || "",
        order: index
      }));
      await models.Certificate.insertMany(certificatesToInsert);
    }

    if (data.gallery && Array.isArray(data.gallery) && data.gallery.length > 0) {
      const galleryToInsert = data.gallery.map((item, index) => ({
        portfolioId,
        title: item.title || "",
        description: item.description || "",
        url: item.url || "",
        order: index
      }));
      await models.Gallery.insertMany(galleryToInsert);
    }

    await OldPortfolio.deleteMany({}).maxTimeMS(5000);
    
    const mongoose = (await import('./mongodb.js')).default;
    const db = mongoose.connection.db;
    try {
      await db.collection('portfolios').drop().catch(() => {});
    } catch (dropError) {
      console.log('Could not drop old portfolios collection:', dropError.message);
    }
    
    return true;
  } catch (error) {
    console.error('Migration error:', error);
    try {
      await OldPortfolio.deleteMany({}).maxTimeMS(5000).catch(() => {});
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
    return false;
  }
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
      return res.status(200).json({ 
        data: defaultPortfolioData, 
        isCustomized: false,
        version: Date.now(),
        timestamp: new Date().toISOString()
      });
    }
    
    try {
      await connectMongo(3);
    } catch (mongoError) {
      console.error('MongoDB connection failed:', mongoError.message);
      return res.status(200).json({ 
        data: defaultPortfolioData, 
        isCustomized: false,
        version: Date.now(),
        timestamp: new Date().toISOString()
      });
    }
    
    if (!isMongoConnected()) {
      return res.status(200).json({ 
        data: defaultPortfolioData, 
        isCustomized: false,
        version: Date.now(),
        timestamp: new Date().toISOString()
      });
    }

    try {
      const models = await getPortfolioModels();
      let portfolio = await models.Portfolio.getPortfolio();
      
      if (!portfolio) {
        console.log('⚠️ No portfolio document found in normalized collection, checking old format...');
        try {
          const mongoose = (await import('./mongodb.js')).default;
          const db = mongoose.connection.db;
          const oldCollection = db.collection('portfolios');
          const oldCount = await oldCollection.countDocuments({}, { maxTimeMS: 5000 }).catch(() => 0);
          
          if (oldCount > 0) {
            console.log(`Found ${oldCount} document(s) in old portfolios collection, migrating...`);
            const OldPortfolioModule = await import('../server/models/Portfolio.js');
            const OldPortfolio = OldPortfolioModule.createPortfolioModel(mongoose);
            const migrated = await migrateOldData(OldPortfolio);
            if (migrated) {
              portfolio = await models.Portfolio.getPortfolio();
              console.log('✅ Migration successful');
              try {
                await oldCollection.drop({ maxTimeMS: 10000 });
                console.log('Successfully dropped old portfolios collection');
              } catch (dropError) {
                console.log('Migration successful but could not drop old collection:', dropError.message);
              }
            } else {
              console.log('⚠️ Migration failed or no data to migrate');
            }
          } else {
            console.log('⚠️ No data found in old collection either');
          }
        } catch (migrationError) {
          console.error('Migration attempt failed:', migrationError.message);
        }
      } else {
        console.log('✅ Found portfolio document in database');
      }

      if (!portfolio) {
        console.log('⚠️ No portfolio found after all checks, returning default data');
        return res.status(200).json({ 
          data: defaultPortfolioData, 
          isCustomized: false,
          version: Date.now(),
          timestamp: new Date().toISOString()
        });
      }

      const fullPortfolio = await models.Portfolio.getFullPortfolio();
      if (!fullPortfolio) {
        console.log('⚠️ getFullPortfolio returned null, portfolio exists but has no data');
        return res.status(200).json({ 
          data: defaultPortfolioData, 
          isCustomized: false,
          version: Date.now(),
          timestamp: new Date().toISOString()
        });
      }

      const hasCustomData = fullPortfolio.personal?.email && 
        fullPortfolio.personal.email !== "your.email@example.com" &&
        fullPortfolio.personal.email !== "";
      
      const isCustomized = fullPortfolio.isCustomized !== undefined 
        ? fullPortfolio.isCustomized 
        : hasCustomData;
      
      if (!isCustomized && hasCustomData) {
        portfolio.isCustomized = true;
        await portfolio.save().catch(err => console.error('Error updating isCustomized:', err));
      }

      const hasAnyData = fullPortfolio.personal?.name || 
        (fullPortfolio.skills && fullPortfolio.skills.length > 0) ||
        (fullPortfolio.projects && fullPortfolio.projects.length > 0) ||
        (fullPortfolio.experience && fullPortfolio.experience.length > 0) ||
        (fullPortfolio.education && fullPortfolio.education.length > 0);

      if (!hasAnyData) {
        console.log('⚠️ Portfolio exists but has no data, returning default');
        return res.status(200).json({ 
          data: defaultPortfolioData, 
          isCustomized: false,
          version: Date.now(),
          timestamp: new Date().toISOString()
        });
      }

      console.log('✅ Returning portfolio data from database:', {
        hasCustomData,
        isCustomized,
        hasPersonal: !!fullPortfolio.personal?.name,
        skillsCount: fullPortfolio.skills?.length || 0,
        projectsCount: fullPortfolio.projects?.length || 0
      });
      
      return res.status(200).json({ 
        data: fullPortfolio, 
        isCustomized: hasCustomData || isCustomized,
        version: portfolio.updatedAt ? new Date(portfolio.updatedAt).getTime() : Date.now(),
        timestamp: new Date().toISOString()
      });
    } catch (modelError) {
      console.error('Error with Portfolio model:', modelError);
      console.error('Error stack:', modelError.stack);
      return res.status(200).json({ 
        data: defaultPortfolioData, 
        isCustomized: false,
        version: Date.now(),
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Unexpected error fetching portfolio data:', error);
    console.error('Error stack:', error.stack);
    return res.status(200).json({ 
      data: defaultPortfolioData, 
      isCustomized: false,
      version: Date.now(),
      timestamp: new Date().toISOString()
    });
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

    const models = await getPortfolioModels();
    
    let dataToSave = data;
    
    if (isPartialUpdate) {
      let existingData = defaultPortfolioData;
      try {
        const existingPortfolio = await models.Portfolio.getFullPortfolio();
        if (existingPortfolio) {
          existingData = existingPortfolio;
        }
      } catch (fetchError) {
        console.warn('Could not fetch existing portfolio for partial update:', fetchError.message);
      }
      
      dataToSave = {
        personal: { ...existingData.personal, ...(data.personal || {}) },
        social: { ...existingData.social, ...(data.social || {}) },
        skills: data.skills !== undefined ? data.skills : (existingData.skills || []),
        projects: data.projects !== undefined ? data.projects : (existingData.projects || []),
        experience: data.experience !== undefined ? data.experience : (existingData.experience || []),
        education: data.education !== undefined ? data.education : (existingData.education || []),
        certificates: data.certificates !== undefined ? data.certificates : (existingData.certificates || []),
        gallery: data.gallery !== undefined ? data.gallery : (existingData.gallery || []),
      };
    }
    
    const updatedPortfolio = await models.Portfolio.updatePortfolio(dataToSave);
    
    res.json({ 
      success: true, 
      message: 'Portfolio data saved successfully',
      version: updatedPortfolio.updatedAt ? new Date(updatedPortfolio.updatedAt).getTime() : Date.now(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving portfolio data:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, error: 'Failed to save portfolio data', details: error.message });
  }
}));

router.post('/cleanup', asyncHandler(async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) {
      return res.status(503).json({ 
        success: false,
        error: 'MongoDB not configured'
      });
    }

    await connectMongo();
    if (!isMongoConnected()) {
      return res.status(503).json({ 
        success: false,
        error: 'MongoDB not connected'
      });
    }

    const mongoose = (await import('./mongodb.js')).default;
    const db = mongoose.connection.db;
    
    try {
      const oldCollection = db.collection('portfolios');
      const count = await oldCollection.countDocuments({}, { maxTimeMS: 5000 });
      
      if (count > 0) {
        await oldCollection.drop({ maxTimeMS: 10000 });
        return res.json({ 
          success: true, 
          message: `Deleted old portfolios collection with ${count} document(s)` 
        });
      } else {
        return res.json({ 
          success: true, 
          message: 'Old portfolios collection does not exist or is empty' 
        });
      }
    } catch (dropError) {
      if (dropError.codeName === 'NamespaceNotFound') {
        return res.json({ 
          success: true, 
          message: 'Old portfolios collection does not exist' 
        });
      }
      throw dropError;
    }
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to cleanup old collection', 
      details: error.message 
    });
  }
}));

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

    const models = await getPortfolioModels();
    const resetPortfolio = await models.Portfolio.resetPortfolio(defaultPortfolioData);
    res.json({ 
      success: true, 
      message: 'Portfolio data reset successfully', 
      data: defaultPortfolioData,
      version: resetPortfolio.updatedAt ? new Date(resetPortfolio.updatedAt).getTime() : Date.now(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error resetting portfolio data:', error.message);
    res.status(500).json({ success: false, error: 'Failed to reset portfolio data', details: error.message });
  }
}));

export default function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Partial-Update, Cache-Control');
    
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Max-Age', '86400');
      return res.status(200).end();
    }
    
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30, stale-while-revalidate=60');
    } else {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
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
