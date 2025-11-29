import mongoose from 'mongoose';

let cachedConnection = null;
let isConnecting = false;
let connectionPromise = null;
const CONNECTION_TIMEOUT = 6000;

const getConnection = () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  return null;
};

export const connectMongo = async () => {
  const existing = getConnection();
  if (existing) {
    return existing;
  }

  if (cachedConnection && cachedConnection.readyState === 1) {
    return cachedConnection;
  }

  if (isConnecting && connectionPromise) {
    try {
      return await Promise.race([
        connectionPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), CONNECTION_TIMEOUT))
      ]);
    } catch (e) {
      isConnecting = false;
      connectionPromise = null;
    }
  }

  if (!process.env.MONGODB_URI) {
    return null;
  }

  isConnecting = true;
  connectionPromise = (async () => {
    try {
      let uri = process.env.MONGODB_URI;
      
      if (uri.includes('mongodb+srv://')) {
        if (!uri.includes('retryWrites')) {
          uri += (uri.includes('?') ? '&' : '?') + 'retryWrites=true&w=majority';
        }
        if (!uri.includes('maxPoolSize')) {
          uri += (uri.includes('?') ? '&' : '?') + 'maxPoolSize=1&minPoolSize=1';
        }
      }

      const options = {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 20000,
        connectTimeoutMS: 5000,
        maxPoolSize: 1,
        minPoolSize: 1,
        bufferCommands: false,
      };

      await Promise.race([
        mongoose.connect(uri, options),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), CONNECTION_TIMEOUT))
      ]);

      cachedConnection = mongoose.connection;
      isConnecting = false;
      
      mongoose.connection.on('error', () => {
        cachedConnection = null;
      });
      
      mongoose.connection.on('disconnected', () => {
        cachedConnection = null;
      });

      return cachedConnection;
    } catch (error) {
      isConnecting = false;
      connectionPromise = null;
      cachedConnection = null;
      throw error;
    }
  })();

  return connectionPromise;
};

export const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

export default mongoose;
