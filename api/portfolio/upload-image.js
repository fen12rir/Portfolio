import { portfolioUploadImageHandler } from '../../server/handlers/portfolio.js';

export default async function handler(req, res) {
  return portfolioUploadImageHandler(req, res);
}
