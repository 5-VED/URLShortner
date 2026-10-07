import * as bcrypt from 'bcrypt';

/** Number of bcrypt salt rounds — high enough to be secure, low enough not to block the event loop */
const SALT_ROUNDS = 12;

/**
 * Hashes a plain-text password using bcrypt.
 * @param plain - the raw password from the user
 * @returns the bcrypt hash to persist in the database
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * Compares a plain-text password against a stored bcrypt hash.
 * @param plain - the raw password from the login request
 * @param hash  - the stored bcrypt hash from the database
 * @returns `true` if they match, `false` otherwise
 */
export async function comparePassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
