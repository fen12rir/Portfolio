import { isAuthenticatedRequest } from '../lib/auth.js';
import { parseJsonBody, sendJson } from '../lib/http.js';
import { defaultPortfolioData } from '../lib/defaultData.js';
import { getImageStorageProvider, uploadImageFromDataUrl } from '../lib/imageStorage.js';
import { getStoredPortfolio, resetStoredPortfolio, saveStoredPortfolio } from '../lib/portfolioStore.js';

const isDefaultData = (data) => {
  if (!data?.personal) return false;
  return data.personal.email === 'your.email@example.com';
};

const getSections = (data, sections = []) => {
  return sections.reduce((accumulator, section) => {
    if (data[section] !== undefined) {
      accumulator[section] = data[section];
    } else {
      accumulator[section] = section === 'personal' || section === 'social'
        ? defaultPortfolioData[section]
        : [];
    }
    return accumulator;
  }, {});
};

const requireAuth = (req, res) => {
  if (!isAuthenticatedRequest(req)) {
    sendJson(res, 401, { success: false, error: 'Unauthorized' });
    return false;
  }
  return true;
};

export const portfolioHandler = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const data = await getStoredPortfolio();
      return sendJson(res, 200, {
        success: true,
        data,
        isCustomized: !isDefaultData(data),
      });
    }

    if (req.method === 'POST') {
      if (!requireAuth(req, res)) return;
      const body = await parseJsonBody(req);
      const isPartialUpdate = String(req.headers['x-partial-update']).toLowerCase() === 'true';
      const data = await saveStoredPortfolio(body, isPartialUpdate);
      return sendJson(res, 200, { success: true, data });
    }

    if (req.method === 'DELETE') {
      if (!requireAuth(req, res)) return;
      const data = await resetStoredPortfolio();
      return sendJson(res, 200, { success: true, data });
    }

    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  } catch (error) {
    return sendJson(res, 500, { success: false, error: error.message || 'Portfolio request failed' });
  }
};

export const portfolioCoreHandler = async (req, res) => {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  }

  try {
    const data = await getStoredPortfolio();
    return sendJson(res, 200, {
      success: true,
      data: {
        personal: data.personal || defaultPortfolioData.personal,
        social: data.social || defaultPortfolioData.social,
      },
      isCustomized: !isDefaultData(data),
    });
  } catch (error) {
    return sendJson(res, 500, { success: false, error: error.message || 'Portfolio core request failed' });
  }
};

export const portfolioSectionsHandler = async (req, res) => {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  }

  try {
    const include = typeof req.query?.include === 'string'
      ? req.query.include
      : new URL(req.url, 'http://localhost').searchParams.get('include') || '';
    const sections = include.split(',').map((section) => section.trim()).filter(Boolean);
    const data = await getStoredPortfolio();
    return sendJson(res, 200, {
      success: true,
      data: getSections(data, sections),
    });
  } catch (error) {
    return sendJson(res, 500, { success: false, error: error.message || 'Portfolio sections request failed' });
  }
};

export const portfolioUploadImageHandler = async (req, res) => {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  }

  if (!requireAuth(req, res)) return;

  try {
    const body = await parseJsonBody(req);
    if (!body?.imageData || typeof body.imageData !== 'string') {
      return sendJson(res, 400, { success: false, error: 'Missing imageData' });
    }

    const uploadResult = await uploadImageFromDataUrl({
      imageData: body.imageData,
      fileName: body.fileName,
      folder: body.folder,
      assetType: body.assetType,
    });

    return sendJson(res, 200, {
      success: true,
      url: uploadResult.url,
      provider: uploadResult.provider,
      key: uploadResult.key,
      configuredProvider: getImageStorageProvider(),
    });
  } catch (error) {
    return sendJson(res, 500, { success: false, error: error.message || 'Image upload failed' });
  }
};
