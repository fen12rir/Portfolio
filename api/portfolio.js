import { portfolioHandler } from '../server/handlers/portfolio.js';

export default async function handler(req, res) {
  return portfolioHandler(req, res);
}
