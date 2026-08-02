import { NextResponse } from 'next/server';
import { addReview, readStore } from '../../../lib/store';

export async function GET() {
  const { reviews } = await readStore();
  return NextResponse.json(reviews);
}

export async function POST(request) {
  const payload = await request.json();

  if (!payload.name || !payload.comment || !payload.rating) {
    return NextResponse.json({ message: 'Please share your name, rating, and review comment.' }, { status: 400 });
  }

  const review = await addReview(payload);
  return NextResponse.json(review, { status: 201 });
}
