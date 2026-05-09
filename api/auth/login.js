import { loginHandler } from '../../server/handlers/auth.js';

export default async function handler(req, res) {
  return loginHandler(req, res);
}
