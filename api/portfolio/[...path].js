import portfolioHandler from '../portfolio.js';

export default function handler(req, res) {
  const pathSegments = req.query.path || [];
  const subPath = Array.isArray(pathSegments) ? pathSegments.join('/') : (pathSegments || '');
  
  const queryParams = new URLSearchParams();
  Object.keys(req.query).forEach(key => {
    if (key !== 'path') {
      queryParams.append(key, req.query[key]);
    }
  });
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  if (subPath) {
    req.url = `/${subPath}${queryString}`;
    req.originalUrl = `/api/portfolio/${subPath}${queryString}`;
  } else {
    req.url = `/${queryString}`;
  }
  
  return portfolioHandler(req, res);
}

