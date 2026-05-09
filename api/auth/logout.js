import { setCorsHeaders } from '../../server/utils/cors.js';
import { clearAdminAuthCookie } from '../../server/utils/adminAuth.js';

export default function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  clearAdminAuthCookie(res);
  return res.status(200).json({ success: true });
}
