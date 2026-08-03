import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminToken } from '../../../../lib/admin';
import { clientIp, rateLimit } from '../../../../lib/ratelimit';

const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';

function safeEqual(a, b) {
  const bufferA = Buffer.from(String(a));
  const bufferB = Buffer.from(String(b));
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufferA, bufferB);
}

export async function POST(request) {
  const payload = await request.json();
  const username = String(payload.username || '').trim();
  const password = String(payload.password || '');

  if (!rateLimit(`admin-login:${clientIp(request)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ message: 'Too many sign-in attempts. Try again later.' }, { status: 429 });
  }

  if (!safeEqual(username, expectedUsername) || !safeEqual(password, expectedPassword)) {
    return NextResponse.json({ message: 'Invalid admin credentials.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: 'gamevault_admin',
    value: createAdminToken(),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return response;
}
