// Shared MongoDB connection for serverless functions
import mongoose from 'mongoose';

// Connection state
let isConnecting = false;
let connectionPromise = null;

// Initialize MongoDB connection
export const connectMongo = async () => {
  // If already connected, return
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If currently connecting, wait for that connection
  if (isConnecting && connectionPromise) {
    const result = await connectionPromise;
    return result;
  }

  // Start new connection
  isConnecting = true;
  connectionPromise = (async () => {
    try {
      let MONGODB_URI = process.env.MONGODB_URI;
      
      if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI environment variable is not set!');
        console.error('💡 Please set MONGODB_URI in Vercel Dashboard → Settings → Environment Variables');
        // Don't throw - let the calling code handle it gracefully
        return null;
      }

      const mongooseOptions = {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      if (MONGODB_URI.includes('mongodb+srv://') && !MONGODB_URI.includes('retryWrites')) {
        const separator = MONGODB_URI.includes('?') ? '&' : '?';
        MONGODB_URI = `${MONGODB_URI}${separator}retryWrites=true&w=majority`;
      }

      await mongoose.connect(MONGODB_URI, mongooseOptions);
      console.log('✅ Connected to MongoDB Atlas');
      isConnecting = false;
      return mongoose.connection;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      isConnecting = false;
      connectionPromise = null;
      // Don't throw - return null so calling code can handle gracefully
      return null;
    }
  })();

  return connectionPromise;
};

// Check if MongoDB is connected
export const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Export mongoose instance
export default mongoose;

