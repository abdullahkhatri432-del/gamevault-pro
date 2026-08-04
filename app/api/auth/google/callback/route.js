import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { exchangeGoogleCode, fetchGoogleProfile } from '../../../../../lib/oauth';
import { findOrCreateGoogleUser } from '../../../../../lib/store';
import { sign } from '../../../../../lib/session';

function clearOAuthCookies(response) {
  response.cookies.set({
    name: 'oauth_state',
    value: '',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  response.cookies.set({
    name: 'oauth_redirect',
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
  const redirectCookie = cookieStore.get('oauth_redirect');
  const redirectTo = redirectCookie?.value || '/';

  const home = new URL('/', request.url);

  if (error) {
    const failUrl = new URL('/', request.url);
    failUrl.searchParams.set('auth', 'failed');
    const response = NextResponse.redirect(failUrl);
    return clearOAuthCookies(response);
  }

  if (!state || !stateCookie || state !== stateCookie.value) {
    const failUrl = new URL('/', request.url);
    failUrl.searchParams.set('auth', 'failed');
    const response = NextResponse.redirect(failUrl);
    return clearOAuthCookies(response);
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

    const destUrl = new URL(redirectTo, request.url);
    const response = NextResponse.redirect(destUrl);
    response.cookies.set({
      name: 'gamevault_user',
      value: sign({ scope: 'user', id: user.id, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }),
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return clearOAuthCookies(response);
  } catch (oauthError) {
    const failUrl = new URL('/', request.url);
    failUrl.searchParams.set('auth', 'failed');
    const response = NextResponse.redirect(failUrl);
    return clearOAuthCookies(response);
  }
}
