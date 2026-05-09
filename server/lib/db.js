import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

export const getDb = async () => {
  if (cachedDb) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'portfolio';

  if (!uri) {
    throw new Error('MONGODB_URI is not set.');
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db(dbName);
  return cachedDb;
};
