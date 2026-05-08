import { connectMongo, isMongoConnected } from './mongodb.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const mongoConfigured = Boolean(process.env.MONGODB_URI);
  let mongoStatus = 'not_configured';
  let mongoError = null;

  if (mongoConfigured) {
    try {
      if (!isMongoConnected()) {
        await Promise.race([
          connectMongo(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('MongoDB health check timeout')), 5000)),
        ]);
      }

      mongoStatus = isMongoConnected() ? 'connected' : 'disconnected';
    } catch (error) {
      mongoStatus = 'disconnected';
      mongoError = error.message;
    }
  }

  const isHealthy = !mongoConfigured || mongoStatus === 'connected';

  return res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? process.uptime() : 0,
    mongodb: {
      configured: mongoConfigured,
      status: mongoStatus,
      error: mongoError,
    },
  });
}

