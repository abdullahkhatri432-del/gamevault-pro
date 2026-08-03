import { NextResponse } from 'next/server';
import { clientIp, rateLimit } from '../../../lib/ratelimit';
import { addReview, readStore } from '../../../lib/store';

export async function GET() {
  const { reviews } = await readStore();
  return NextResponse.json(reviews);
}

export async function POST(request) {
  const payload = await request.json();

  if (!rateLimit(`create-review:${clientIp(request)}`, 3, 10 * 60 * 1000)) {
    return NextResponse.json({ message: 'Too many reviews from your connection. Try again later.' }, { status: 429 });
  }

  try {
    const review = await addReview(payload);
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Unable to submit the review.' }, { status: 400 });
  }
}
