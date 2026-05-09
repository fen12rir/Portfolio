import authHandler from '../auth.js';

export default function handler(req, res) {
  const pathSegments = req.query.path || [];
  const subPath = Array.isArray(pathSegments) ? pathSegments.join('/') : (pathSegments || '');

  const queryParams = new URLSearchParams();
  Object.keys(req.query).forEach((key) => {
    if (key !== 'path') {
      queryParams.append(key, req.query[key]);
    }
  });
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  if (subPath) {
    req.url = `/${subPath}${queryString}`;
    req.originalUrl = `/api/auth/${subPath}${queryString}`;
  } else {
    req.url = `/${queryString}`;
    req.originalUrl = '/api/auth';
  }

  return authHandler(req, res);
}
