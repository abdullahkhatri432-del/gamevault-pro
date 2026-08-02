import { NextResponse } from 'next/server';
import { createUser } from '../../../../lib/store';

export async function POST(request) {
  const payload = await request.json();

  try {
    const createdUser = await createUser(payload);
    return NextResponse.json({ ok: true, user: createdUser }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Unable to create the buyer account.' }, { status: 400 });
  }
}
