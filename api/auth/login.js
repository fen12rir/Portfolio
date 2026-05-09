import { setCorsHeaders } from '../../server/utils/cors.js';
import { isAdminAuthConfigured, setAdminAuthCookie, signAdminToken, verifyAdminPassword } from '../../server/utils/adminAuth.js';
import { createRateLimiter } from '../../server/utils/rateLimit.js';

const loginLimiter = createRateLimiter({
  keyPrefix: 'api-auth-login',
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many login attempts. Please try again later.',
});

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  return loginLimiter(req, res, async () => {
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
}
