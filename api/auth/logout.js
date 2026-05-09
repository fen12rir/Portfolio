import { logoutHandler } from '../../server/handlers/auth.js';

export default async function handler(req, res) {
  return logoutHandler(req, res);
}
