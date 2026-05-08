import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import portfolioRoutes from './routes/portfolio.js';
import authRoutes from './routes/auth.js';
import { corsOptions } from './utils/cors.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio';

// Connection options optimized for MongoDB Atlas
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
};

// For Atlas, ensure retryWrites is included if not already in URI
if (MONGODB_URI.includes('mongodb+srv://') && !MONGODB_URI.includes('retryWrites')) {
  const separator = MONGODB_URI.includes('?') ? '&' : '?';
  MONGODB_URI = `${MONGODB_URI}${separator}retryWrites=true&w=majority`;
}

mongoose.connect(MONGODB_URI, mongooseOptions)
.then(() => {
  console.log('✅ Connected to MongoDB Atlas');
  console.log(`📊 Database: ${mongoose.connection.name}`);
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error.message);
  if (error.message.includes('authentication failed')) {
    console.log('💡 Check your username and password in MONGODB_URI');
  } else if (error.message.includes('IP')) {
    console.log('💡 Add your IP address to MongoDB Atlas Network Access whitelist');
  } else {
    console.log('⚠️  Server will continue running but MongoDB operations will fail');
    console.log('💡 To fix: Set MONGODB_URI in server/.env file');
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'ok', 
    mongodb: mongoStatus,
    timestamp: new Date().toISOString()
  });
});

// Start server only if not in Vercel environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
    console.log(`💾 MongoDB URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);
  });
}

export default app;

