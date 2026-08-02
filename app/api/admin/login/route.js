import { NextResponse } from 'next/server';

export async function POST(request) {
  const payload = await request.json();
  const username = String(payload.username || '').trim();
  const password = String(payload.password || '').trim();

  const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
  const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (username !== expectedUsername || password !== expectedPassword) {
    return NextResponse.json({ message: 'Invalid admin credentials.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: 'gamevault_admin',
    value: 'true',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return response;
}
