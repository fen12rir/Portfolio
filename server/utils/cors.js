const parseOrigins = (value) => {
  if (!value || typeof value !== 'string') return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

export const getAllowedOrigins = () => {
  const preferred = parseOrigins(process.env.CORS_ALLOWED_ORIGINS);
  const fallback = parseOrigins(process.env.CORS_ORIGIN);
  const configured = preferred.length > 0 ? preferred : fallback;

  if (configured.length > 0) {
    return configured;
  }

  if (process.env.NODE_ENV !== 'production') {
    return [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];
  }

  return [];
};

export const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.length === 0) {
    return process.env.NODE_ENV !== 'production';
  }
  return allowedOrigins.includes(origin);
};

export const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('CORS origin denied'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Partial-Update'],
  credentials: true,
};

export const setCorsHeaders = (req, res) => {
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Partial-Update, Cache-Control');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
};
