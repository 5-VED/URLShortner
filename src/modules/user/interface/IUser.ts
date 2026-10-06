export interface IUser {
  id: string;
  name: string | null;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Publicly safe user shape — omits the password hash */
export type PublicUser = Omit<IUser, 'password'>;
