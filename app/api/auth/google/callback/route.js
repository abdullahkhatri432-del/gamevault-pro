import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { exchangeGoogleCode, fetchGoogleProfile } from '../../../../../lib/oauth';
import { findOrCreateGoogleUser } from '../../../../../lib/store';
import { sign } from '../../../../../lib/session';

function clearStateCookie(response) {
  response.cookies.set({
    name: 'oauth_state',
    value: '',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get('oauth_state');

  const home = new URL('/', request.url);

  if (error) {
    const response = NextResponse.redirect(home);
    return clearStateCookie(response);
  }

  if (!state || !stateCookie || state !== stateCookie.value) {
    const response = NextResponse.redirect(home);
    home.searchParams.set('auth', 'failed');
    return clearStateCookie(response);
  }

  const redirectUri = `${url.origin}/api/auth/google/callback`;

  try {
    const token = await exchangeGoogleCode(code, redirectUri);
    const profile = await fetchGoogleProfile(token.access_token);

    const user = await findOrCreateGoogleUser({
      googleId: profile.sub,
      name: profile.name,
      email: profile.email,
    });

    const response = NextResponse.redirect(home);
    response.cookies.set({
      name: 'gamevault_user',
      value: sign({ scope: 'user', id: user.id, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }),
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return clearStateCookie(response);
  } catch (oauthError) {
    const response = NextResponse.redirect(home);
    home.searchParams.set('auth', 'failed');
    return clearStateCookie(response);
  }
}
