import express from 'express';
import cors from 'cors';
import { corsOptions, setCorsHeaders } from '../server/utils/cors.js';
import { clearAdminAuthCookie, requireAdminAuth, setAdminAuthCookie, signAdminToken, verifyAdminPassword, isAdminAuthConfigured } from '../server/utils/adminAuth.js';
import { createRateLimiter } from '../server/utils/rateLimit.js';

const app = express();
const router = express.Router();

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/', router);

const loginLimiter = createRateLimiter({
  keyPrefix: 'api-auth-login',
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many login attempts. Please try again later.',
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    if (!isAdminAuthConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Admin auth is not configured. Set ADMIN_PASSWORD_HASH and ADMIN_JWT_SECRET.',
      });
    }

    const { password } = req.body || {};
    const valid = await verifyAdminPassword(password);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = signAdminToken({ role: 'admin' });
    setAdminAuthCookie(res, token);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Login failed', details: error.message });
  }
});

router.get('/session', requireAdminAuth, (req, res) => {
  return res.status(200).json({ success: true, authenticated: true });
});

router.post('/logout', (req, res) => {
  clearAdminAuthCookie(res);
  return res.status(200).json({ success: true });
});

export default function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }

  let path = req.url || '/';
  const originalUrl = req.originalUrl || path;

  const xIncomingPath = req.headers['x-incoming-path'] || req.headers['x-vercel-rewrite-path'];
  if (xIncomingPath) {
    path = xIncomingPath;
  }

  if (path === '/api/auth' && req.query && typeof req.query.path === 'string') {
    path = `/api/auth/${req.query.path}`;
  } else if (path === '/api/auth' && req.query && Array.isArray(req.query.path) && req.query.path.length > 0) {
    path = `/api/auth/${req.query.path.join('/')}`;
  }

  const queryIndex = path.indexOf('?');
  const queryString = queryIndex !== -1 ? path.substring(queryIndex) : '';
  const pathOnly = queryIndex !== -1 ? path.substring(0, queryIndex) : path;

  let normalizedPath = pathOnly;
  if (normalizedPath.startsWith('/api/auth/')) {
    normalizedPath = normalizedPath.replace('/api/auth', '') || '/';
  } else if (normalizedPath === '/api/auth') {
    normalizedPath = '/';
  } else if (normalizedPath.startsWith('/auth/')) {
    normalizedPath = normalizedPath.replace('/auth', '') || '/';
  } else if (normalizedPath === '/auth') {
    normalizedPath = '/';
  }

  req.url = normalizedPath + queryString;
  req.originalUrl = originalUrl;

  return app(req, res);
}
