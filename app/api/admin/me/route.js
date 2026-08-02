import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const adminCookie = cookies().get('gamevault_admin');

  if (adminCookie?.value !== 'true') {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true });
}
