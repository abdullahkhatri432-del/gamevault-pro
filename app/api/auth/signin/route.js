import { NextResponse } from 'next/server';
import { verifyPassword } from '../../../../lib/password';
import { getUserByEmailWithPassword } from '../../../../lib/store';
import { sign } from '../../../../lib/session';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    const user = await getUserByEmailWithPassword(email);
    if (!user || !user.password_hash) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    const response = NextResponse.json({ message: 'Signed in successfully.', user: { id: user.id, name: user.name, email: user.email } });

    response.cookies.set({
      name: 'gamevault_user',
      value: sign({ scope: 'user', id: user.id, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }),
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ message: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
