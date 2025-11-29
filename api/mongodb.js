// Shared MongoDB connection for serverless functions
import mongoose from 'mongoose';

// Connection state
let isConnecting = false;
let connectionPromise = null;

// Initialize MongoDB connection
export const connectMongo = async (retries = 3) => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (isConnecting && connectionPromise) {
    const result = await connectionPromise;
    return result;
  }

  isConnecting = true;
  connectionPromise = (async () => {
    let lastError = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        let MONGODB_URI = process.env.MONGODB_URI;
        
        if (!MONGODB_URI) {
          console.error('❌ MONGODB_URI environment variable is not set!');
          console.error('💡 Please set MONGODB_URI in Vercel Dashboard → Settings → Environment Variables');
          isConnecting = false;
          return null;
        }

        const mongooseOptions = {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          maxPoolSize: 10,
          minPoolSize: 2,
        };

        if (MONGODB_URI.includes('mongodb+srv://') && !MONGODB_URI.includes('retryWrites')) {
          const separator = MONGODB_URI.includes('?') ? '&' : '?';
          MONGODB_URI = `${MONGODB_URI}${separator}retryWrites=true&w=majority`;
        }

        await mongoose.connect(MONGODB_URI, mongooseOptions);
        console.log(`✅ Connected to MongoDB Atlas (attempt ${attempt}/${retries})`);
        isConnecting = false;
        return mongoose.connection;
      } catch (error) {
        lastError = error;
        console.error(`❌ MongoDB connection error (attempt ${attempt}/${retries}):`, error.message);
        
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error('❌ Failed to connect to MongoDB after', retries, 'attempts');
    console.error('Last error:', lastError?.message);
    isConnecting = false;
    connectionPromise = null;
    return null;
  })();

  return connectionPromise;
};

// Check if MongoDB is connected
export const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Export mongoose instance
export default mongoose;

