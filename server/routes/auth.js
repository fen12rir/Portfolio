import express from 'express';
import { clearAdminAuthCookie, setAdminAuthCookie, signAdminToken, verifyAdminPassword, requireAdminAuth, isAdminAuthConfigured } from '../utils/adminAuth.js';
import { createRateLimiter } from '../utils/rateLimit.js';

const router = express.Router();

const loginLimiter = createRateLimiter({
  keyPrefix: 'auth-login',
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

export default router;
