import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'careerlens_token';

interface TokenPayload {
  userId: number;
  email: string;
  role: 'candidate' | 'recruiter';
  candidateId?: number;
  recruiterId?: number;
  fullName: string;
  exp?: number;
}

function parseTokenPayload(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload) as TokenPayload;
    if (parsed.exp && parsed.exp * 1000 < Date.now()) {
      return null; // Expired
    }
    return parsed;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? parseTokenPayload(token) : null;

  // 1. Redirect logged-in users away from auth pages
  if (session && (pathname === '/login' || pathname === '/register')) {
    if (session.role === 'recruiter') {
      return NextResponse.redirect(new URL('/recruiter/dashboard', req.url));
    } else {
      return NextResponse.redirect(new URL('/matches', req.url));
    }
  }

  // 2. Protect Recruiter Portal Routes
  if (pathname.startsWith('/recruiter')) {
    if (!session) {
      const url = new URL('/login', req.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    if (session.role !== 'recruiter') {
      // Forbidden: Candidate trying to access recruiter dashboard/jobs
      return NextResponse.redirect(new URL('/jobs?error=forbidden', req.url));
    }
  }

  // 3. Protect Candidate Portal Routes
  if (pathname.startsWith('/matches') || pathname.startsWith('/profile') || pathname.startsWith('/applications')) {
    if (!session) {
      const url = new URL('/login', req.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    if (session.role !== 'candidate') {
      // Forbidden: Recruiter trying to access candidate pages
      return NextResponse.redirect(new URL('/recruiter/dashboard?error=forbidden', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/recruiter/:path*',
    '/matches',
    '/profile',
    '/applications',
  ],
};
