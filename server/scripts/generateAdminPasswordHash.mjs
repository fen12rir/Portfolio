import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password || password.length < 8) {
  console.error('Usage: node server/scripts/generateAdminPasswordHash.mjs "<your-strong-password>"');
  process.exit(1);
}

const rounds = 12;
const hash = await bcrypt.hash(password, rounds);
console.log(hash);
