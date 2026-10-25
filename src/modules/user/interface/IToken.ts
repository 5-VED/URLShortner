export interface IToken {
  sub: string;
  sid: string;
  iat: string;
  exp: string;
  iss: string;
}

export interface IRefreshToken extends IToken {
  jti: string;
}

export interface IAccessToken extends IToken {
  email: string;
  role?: string | null;
}
