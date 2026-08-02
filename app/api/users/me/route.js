import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getUserById } from '../../../../lib/store';

export async function GET() {
  const userCookie = cookies().get('gamevault_user');
  if (!userCookie?.value) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const user = await getUserById(userCookie.value);
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, user });
}
