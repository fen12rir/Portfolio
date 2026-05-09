import { portfolioCoreHandler } from '../../server/handlers/portfolio.js';

export default async function handler(req, res) {
  return portfolioCoreHandler(req, res);
}
