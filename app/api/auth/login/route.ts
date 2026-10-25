import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { comparePassword, signToken, fetchFullUserSession, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const res = await query('SELECT user_id, email, password_hash, role FROM users WHERE email = $1', [email]);
    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = res.rows[0];
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const fullSession = await fetchFullUserSession(user.user_id);
    if (!fullSession) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const token = signToken(fullSession);
    const response = NextResponse.json({ success: true, user: fullSession });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
