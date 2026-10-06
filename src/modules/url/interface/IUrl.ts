export interface Url {
  id: string;
  url: string;
  shortCode: string;
  createdAt: Date;
  deletedAt: Date | null;
  isDeleted: boolean;
  isActive: boolean;
  userId: string;
}
