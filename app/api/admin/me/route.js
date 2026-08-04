import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../lib/admin';
import { clientIp, rateLimit } from '../../../../lib/ratelimit';

export async function GET(request) {
  if (!rateLimit(`admin-me:${clientIp(request)}`, 30, 60 * 1000)) {
    return NextResponse.json({ authenticated: false }, { status: 429 });
  }

  if (!(await isAdminRequest())) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true });
}
