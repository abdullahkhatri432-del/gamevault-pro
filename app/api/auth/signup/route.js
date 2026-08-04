import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { hashPassword } from '../../../../lib/password';
import { createUserWithPassword, getUserByEmailWithPassword } from '../../../../lib/store';
import { sign } from '../../../../lib/session';

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!name || name.length < 2) {
      return NextResponse.json({ message: 'Name must be at least 2 characters.' }, { status: 400 });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const existingUser = await getUserByEmailWithPassword(email);
    if (existingUser) {
      return NextResponse.json({ message: 'An account with this email already exists.' }, { status: 409 });
    }

    const passwordHash = hashPassword(password);
    const user = await createUserWithPassword(name, email, passwordHash);

    const response = NextResponse.json({ message: 'Account created successfully.', user: { id: user.id, name: user.name, email: user.email } });

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
