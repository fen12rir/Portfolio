import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const AUTH_COOKIE_NAME = 'portfolio_admin_token';
const DEFAULT_EXPIRY_SECONDS = 60 * 60 * 12;

const parseCookieHeader = (cookieHeader = '') => {
  return cookieHeader
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((accumulator, item) => {
      const separatorIndex = item.indexOf('=');
      if (separatorIndex === -1) return accumulator;
      const key = item.slice(0, separatorIndex).trim();
      const value = item.slice(separatorIndex + 1).trim();
      accumulator[key] = decodeURIComponent(value);
      return accumulator;
    }, {});
};

const getJwtSecret = () => {
  if (process.env.ADMIN_JWT_SECRET) {
    return process.env.ADMIN_JWT_SECRET;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('ADMIN_JWT_SECRET is required in production.');
  }

  return 'local-dev-admin-secret-change-me';
};

const getTokenFromRequest = (req) => {
  const cookies = parseCookieHeader(req.headers.cookie || '');
  if (cookies[AUTH_COOKIE_NAME]) {
    return cookies[AUTH_COOKIE_NAME];
  }

  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }

  return '';
};

export const signAdminToken = (payload = {}) => {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn: DEFAULT_EXPIRY_SECONDS });
};

export const verifyAdminToken = (token) => {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
};

export const setAdminAuthCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = DEFAULT_EXPIRY_SECONDS;
  const cookie = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${maxAge}`,
    'SameSite=Lax',
  ];
  if (isProd) {
    cookie.push('Secure');
  }
  res.setHeader('Set-Cookie', cookie.join('; '));
};

export const clearAdminAuthCookie = (res) => {
  const isProd = process.env.NODE_ENV === 'production';
  const cookie = [
    `${AUTH_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'Max-Age=0',
    'SameSite=Lax',
  ];
  if (isProd) {
    cookie.push('Secure');
  }
  res.setHeader('Set-Cookie', cookie.join('; '));
};

export const requireAdminAuth = (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const decoded = verifyAdminToken(token);
    req.adminUser = decoded;
    return next();
  } catch {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
};

export const verifyAdminPassword = async (password) => {
  if (!password || typeof password !== 'string') return false;

  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (passwordHash) {
    try {
      return await bcrypt.compare(password, passwordHash);
    } catch {
      return false;
    }
  }

  const fallbackPassword = process.env.ADMIN_PASSWORD;
  if (fallbackPassword && process.env.NODE_ENV !== 'production') {
    return password === fallbackPassword;
  }

  return false;
};

export const isAdminAuthConfigured = () => {
  if (process.env.ADMIN_PASSWORD_HASH) return true;
  if (process.env.NODE_ENV !== 'production' && process.env.ADMIN_PASSWORD) return true;
  return false;
};
