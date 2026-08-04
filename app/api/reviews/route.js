import { NextResponse } from 'next/server';
import { clientIp, rateLimit } from '../../../lib/ratelimit';
import { addReview, readStore } from '../../../lib/store';
import { sanitizeString, validateRating, truncate } from '../../../lib/validate';

const MAX_JSON_SIZE = 1024 * 1024;

function checkRequestSize(request) {
  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > MAX_JSON_SIZE) {
    return true;
  }
  return false;
}

export async function GET() {
  const { reviews } = await readStore();
  return NextResponse.json(reviews);
}

export async function POST(request) {
  if (checkRequestSize(request)) {
    return NextResponse.json({ message: 'Request too large.' }, { status: 413 });
  }

  const payload = await request.json();

  if (!rateLimit(`create-review:${clientIp(request)}`, 3, 10 * 60 * 1000)) {
    return NextResponse.json({ message: 'Too many reviews from your connection. Try again later.' }, { status: 429 });
  }

  try {
    const name = truncate(sanitizeString(payload.name), 80);
    const comment = truncate(sanitizeString(payload.comment), 2000);
    const rating = validateRating(payload.rating);

    if (!name || !comment) {
      return NextResponse.json({ message: 'A valid name and comment are required.' }, { status: 400 });
    }

    const review = await addReview({ name, comment, rating });
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Unable to submit the review.' }, { status: 400 });
  }
}
