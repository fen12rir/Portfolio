import { portfolioSectionsHandler } from '../../server/handlers/portfolio.js';

export default async function handler(req, res) {
  return portfolioSectionsHandler(req, res);
}
