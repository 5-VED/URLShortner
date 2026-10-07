export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  profilePic?: string | null;
  phoneNo?: string | null;
  role?: string | null;
  isDeleted: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Publicly safe user shape — omits the password hash */
export type PublicUser = Omit<IUser, 'password'>;
