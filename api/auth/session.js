import { sessionHandler } from '../../server/handlers/auth.js';

export default async function handler(req, res) {
  return sessionHandler(req, res);
}
