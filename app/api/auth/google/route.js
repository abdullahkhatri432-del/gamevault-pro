import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { googleAuthUrl, googleConfigured } from '../../../../lib/oauth';
import { clientIp, rateLimit } from '../../../../lib/ratelimit';

export async function GET(request) {
  if (!googleConfigured()) {
    return NextResponse.json(
      { message: 'Google sign-in is not configured.' },
      { status: 400 }
    );
  }

  const ip = clientIp(request);
  if (!rateLimit(`google-auth:${ip}`, 10, 60 * 1000)) {
    return NextResponse.json(
      { message: 'Too many authentication requests. Try again later.' },
      { status: 429 }
    );
  }

  const url = new URL(request.url);
  const redirectTo = url.searchParams.get('redirect') || '/';

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/google/callback`;
  const state = crypto.randomBytes(24).toString('hex');

  const cookieStore = await cookies();
  cookieStore.set({
    name: 'oauth_state',
    value: state,
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 10 * 60,
  });
  cookieStore.set({
    name: 'oauth_redirect',
    value: redirectTo,
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 10 * 60,
  });

  return NextResponse.redirect(googleAuthUrl(state, redirectUri));
}
