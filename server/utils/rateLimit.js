const stores = new Map();

const getClientIdentifier = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

export const createRateLimiter = ({
  keyPrefix,
  windowMs,
  maxRequests,
  message = 'Too many requests',
}) => {
  if (!stores.has(keyPrefix)) {
    stores.set(keyPrefix, new Map());
  }
  const store = stores.get(keyPrefix);

  return (req, res, next) => {
    const clientId = getClientIdentifier(req);
    const now = Date.now();
    const entry = store.get(clientId) || { count: 0, resetAt: now + windowMs };

    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }

    entry.count += 1;
    store.set(clientId, entry);

    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - entry.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.floor(entry.resetAt / 1000)));

    if (entry.count > maxRequests) {
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ success: false, error: message });
    }

    return next();
  };
};
