export type UserRole = 'admin' | 'user';

export interface UserItem {
  _id: string;
  id: string;
  name: string;
  surname: string;
  username: string;
  email: string;
  enabled: boolean;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CreateUserPayload {
  name: string;
  surname: string;
  username: string;
  email: string;
  password: string;
  enabled?: boolean;
  role?: UserRole;
}

export type UpdateUserPayload = Partial<CreateUserPayload>;