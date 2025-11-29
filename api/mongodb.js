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
    return connectionPromise;
  }

  // Start new connection
  isConnecting = true;
  connectionPromise = (async () => {
    try {
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

      await mongoose.connect(MONGODB_URI, mongooseOptions);
      console.log('✅ Connected to MongoDB Atlas');
      isConnecting = false;
      return mongoose.connection;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      isConnecting = false;
      connectionPromise = null;
      throw error;
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

