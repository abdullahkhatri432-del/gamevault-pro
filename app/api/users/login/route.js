import { NextResponse } from 'next/server';
import { loginUser } from '../../../../lib/store';

export async function POST(request) {
  const payload = await request.json();

  try {
    const user = await loginUser(payload);
    const response = NextResponse.json({ ok: true, user });
    response.cookies.set({
      name: 'gamevault_user',
      value: String(user.id),
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Unable to sign in.' }, { status: 401 });
  }
}
