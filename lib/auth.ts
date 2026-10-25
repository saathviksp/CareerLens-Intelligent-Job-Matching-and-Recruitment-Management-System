import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import dotenv from 'dotenv';
import { query } from './db';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'careerlens_super_secret_jwt_key_2026_pes_univ';
const COOKIE_NAME = 'careerlens_token';

export interface UserSession {
  userId: number;
  email: string;
  role: 'candidate' | 'recruiter';
  candidateId?: number;
  recruiterId?: number;
  companyId?: number;
  fullName: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch {
    return null;
  }
}

export async function getSessionFromCookies(): Promise<UserSession | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function fetchFullUserSession(userId: number): Promise<UserSession | null> {
  const userRes = await query('SELECT user_id, email, role FROM users WHERE user_id = $1', [userId]);
  if (userRes.rowCount === 0) return null;
  const user = userRes.rows[0];

  let candidateId: number | undefined;
  let recruiterId: number | undefined;
  let companyId: number | undefined;
  let fullName = '';

  if (user.role === 'candidate') {
    const candRes = await query('SELECT candidate_id, full_name FROM candidates WHERE user_id = $1', [userId]);
    if (candRes.rowCount && candRes.rowCount > 0) {
      candidateId = candRes.rows[0].candidate_id;
      fullName = candRes.rows[0].full_name;
    }
  } else if (user.role === 'recruiter') {
    const recRes = await query('SELECT recruiter_id, company_id, full_name FROM recruiters WHERE user_id = $1', [userId]);
    if (recRes.rowCount && recRes.rowCount > 0) {
      recruiterId = recRes.rows[0].recruiter_id;
      companyId = recRes.rows[0].company_id;
      fullName = recRes.rows[0].full_name;
    }
  }

  return {
    userId: user.user_id,
    email: user.email,
    role: user.role,
    candidateId,
    recruiterId,
    companyId,
    fullName: fullName || user.email.split('@')[0],
  };
}

export { COOKIE_NAME };
