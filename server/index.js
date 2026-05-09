import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { loginHandler, logoutHandler, sessionHandler } from './handlers/auth.js';
import {
  portfolioCoreHandler,
  portfolioHandler,
  portfolioSectionsHandler,
  portfolioUploadImageHandler,
} from './handlers/portfolio.js';
import { getDb } from './lib/db.js';
import { sendJson } from './lib/http.js';

const app = express();
const PORT = Number(process.env.PORT || 3003);
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', async (req, res) => {
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
});

app.post('/api/auth/login', loginHandler);
app.post('/api/auth/logout', logoutHandler);
app.get('/api/auth/session', sessionHandler);

app.get('/api/portfolio', portfolioHandler);
app.post('/api/portfolio', portfolioHandler);
app.delete('/api/portfolio', portfolioHandler);
app.get('/api/portfolio/core', portfolioCoreHandler);
app.get('/api/portfolio/sections', portfolioSectionsHandler);
app.post('/api/portfolio/upload-image', portfolioUploadImageHandler);

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
