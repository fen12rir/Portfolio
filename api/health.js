import { getDb } from '../server/lib/db.js';
import { sendJson } from '../server/lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  }

  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return sendJson(res, 200, {
      success: true,
      mongodb: 'connected',
      database: db.databaseName,
      imageStorageProvider: process.env.IMAGE_STORAGE_PROVIDER || 'inline',
    });
  } catch (error) {
    return sendJson(res, 500, {
      success: false,
      mongodb: 'disconnected',
      error: error.message || 'Health check failed',
    });
  }
}
