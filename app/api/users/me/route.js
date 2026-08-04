import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth';
import { clientIp, rateLimit } from '../../../../lib/ratelimit';

export async function GET(request) {
  if (!rateLimit(`user-me:${clientIp(request)}`, 30, 60 * 1000)) {
    return NextResponse.json({ authenticated: false }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, user });
}
