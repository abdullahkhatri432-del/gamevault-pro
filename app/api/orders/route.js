import { NextResponse } from 'next/server';
import { addOrder, readStore } from '../../../lib/store';

export async function GET() {
  const { orders } = await readStore();
  return NextResponse.json(orders);
}

export async function POST(request) {
  const payload = await request.json();

  if (!payload.name || !payload.email || !payload.game) {
    return NextResponse.json({ message: 'Please provide your name, email, and account selection.' }, { status: 400 });
  }

  const order = await addOrder(payload);
  return NextResponse.json(order, { status: 201 });
}
