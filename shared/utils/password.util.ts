import * as bcrypt from 'bcrypt';

/** Number of bcrypt salt rounds — high enough to be secure, low enough not to block the event loop */
const SALT_ROUNDS = 12;


export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}


export async function comparePassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
