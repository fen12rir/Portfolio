import bcrypt from 'bcryptjs';
import { clearSessionCookie, isAuthenticatedRequest, setSessionCookie } from '../lib/auth.js';
import { parseJsonBody, sendJson } from '../lib/http.js';

export const loginHandler = async (req, res) => {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  }

  try {
    const body = await parseJsonBody(req);
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!passwordHash) {
      return sendJson(res, 500, { success: false, error: 'ADMIN_PASSWORD_HASH is not configured' });
    }

    const passwordMatches = body?.password
      ? await bcrypt.compare(body.password, passwordHash)
      : false;

    if (!passwordMatches) {
      return sendJson(res, 401, { success: false, error: 'Incorrect password' });
    }

    setSessionCookie(res);
    return sendJson(res, 200, { success: true });
  } catch (error) {
    return sendJson(res, 500, { success: false, error: error.message || 'Login failed' });
  }
};

export const logoutHandler = async (req, res) => {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  }

  clearSessionCookie(res);
  return sendJson(res, 200, { success: true });
};

export const sessionHandler = async (req, res) => {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  }

  return sendJson(res, 200, {
    success: true,
    authenticated: isAuthenticatedRequest(req),
  });
};
