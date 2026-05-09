import jwt from 'jsonwebtoken';
import { parseCookies } from './http.js';

const COOKIE_NAME = 'portfolio_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const getSecret = () => {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error('ADMIN_JWT_SECRET is not set.');
  }
  return secret;
};

export const createSessionToken = () => {
  return jwt.sign({
    role: 'admin',
  }, getSecret(), {
    expiresIn: SESSION_TTL_SECONDS,
  });
};

export const verifySessionToken = (token) => {
  if (!token) {
    return false;
  }

  try {
    const payload = jwt.verify(token, getSecret());
    return payload?.role === 'admin';
  } catch {
    return false;
  }
};

export const setSessionCookie = (res) => {
  const token = createSessionToken();
  const isProduction = process.env.NODE_ENV === 'production';
  const cookie = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];

  if (isProduction) {
    cookie.push('Secure');
  }

  res.setHeader('Set-Cookie', cookie.join('; '));
};

export const clearSessionCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookie = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];

  if (isProduction) {
    cookie.push('Secure');
  }

  res.setHeader('Set-Cookie', cookie.join('; '));
};

export const isAuthenticatedRequest = (req) => {
  const cookies = parseCookies(req);
  return verifySessionToken(cookies[COOKIE_NAME]);
};
