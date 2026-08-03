import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../lib/admin';

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true });
}
