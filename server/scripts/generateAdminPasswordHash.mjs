import bcrypt from 'bcryptjs';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

try {
  const password = await rl.question('Enter admin password: ');

  if (!password || !password.trim()) {
    throw new Error('Password is required.');
  }

  const hash = await bcrypt.hash(password, 12);
  console.log('\nADMIN_PASSWORD_HASH=' + hash);
} catch (error) {
  console.error(error.message || 'Failed to generate password hash.');
  process.exitCode = 1;
} finally {
  rl.close();
}
