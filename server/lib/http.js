export const parseJsonBody = async (req) => {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  if (!rawBody) {
    return {};
  }

  return JSON.parse(rawBody);
};

export const sendJson = (res, statusCode, payload) => {
  res.status(statusCode).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

export const parseCookies = (req) => {
  const cookieHeader = req.headers.cookie || '';
  return cookieHeader.split(';').reduce((accumulator, entry) => {
    const [rawName, ...rest] = entry.trim().split('=');
    if (!rawName) return accumulator;
    accumulator[rawName] = decodeURIComponent(rest.join('=') || '');
    return accumulator;
  }, {});
};
