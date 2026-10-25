import { NextResponse } from 'next/server';
import { getSessionFromCookies, fetchFullUserSession } from '@/lib/auth';

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const updatedSession = await fetchFullUserSession(session.userId);
  return NextResponse.json({ user: updatedSession });
}
