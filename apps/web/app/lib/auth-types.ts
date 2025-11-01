export interface AuthUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

export interface AuthSession {
  user: AuthUser;
  issuedAt: number;
  expiresAt: number;
}
