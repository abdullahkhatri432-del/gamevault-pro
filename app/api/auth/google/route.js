import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { googleAuthUrl, googleConfigured } from '../../../../lib/oauth';

export async function GET(request) {
  if (!googleConfigured()) {
    return NextResponse.json(
      { message: 'Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment.' },
      { status: 400 }
    );
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/google/callback`;
  const state = crypto.randomBytes(24).toString('hex');

  const cookieStore = await cookies();
  cookieStore.set({
    name: 'oauth_state',
    value: state,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 10 * 60,
  });

  return NextResponse.redirect(googleAuthUrl(state, redirectUri));
}
