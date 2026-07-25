import { readDatabase, User } from './db';

const SESSION_COOKIE_NAME = 'donmac_session';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'customer';
  walletBalance: number;
}

// Simple cookie parsing helper
export function getSessionFromCookie(cookieHeader?: string | null): SessionUser | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp('(^| )' + SESSION_COOKIE_NAME + '=([^;]+)'));
  if (match) {
    try {
      const decoded = decodeURIComponent(match[2]);
      const data = JSON.parse(decoded);
      // Verify user exists in fresh DB
      const db = readDatabase();
      const user = db.users.find(u => u.id === data.id);
      if (user) {
        return {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          walletBalance: user.walletBalance,
        };
      }
    } catch {
      return null;
    }
  }
  return null;
}
