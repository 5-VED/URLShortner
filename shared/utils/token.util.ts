import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';

export interface TokenPayload {
  sub: string;   // user id
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenConfig {
  accessSecret: string;
  /** Must be a valid ms-compatible string, e.g. "15m", "1h", "7d" */
  accessExpiry: string;
  refreshSecret: string;
  /** Must be a valid ms-compatible string, e.g. "7d" */
  refreshExpiry: string;
}

/**
 * Generates a JWT access + refresh token pair for the given payload.
 * Both tokens are signed with separate secrets so a compromised
 * refresh secret does not also compromise short-lived access tokens.
 */
export async function generateTokenPair(
  jwtService: JwtService,
  payload: TokenPayload,
  config: TokenConfig,
): Promise<TokenPair> {
  const [accessToken, refreshToken] = await Promise.all([
    jwtService.signAsync(payload, {
      secret: config.accessSecret,
      // Cast to StringValue: the ms library brands duration strings;
      // we trust the caller to pass a valid format (validated by JWT at runtime).
      expiresIn: config.accessExpiry as StringValue,
    }),
    jwtService.signAsync(payload, {
      secret: config.refreshSecret,
      expiresIn: config.refreshExpiry as StringValue,
    }),
  ]);

  return { accessToken, refreshToken };
}
