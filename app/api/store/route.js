import { NextResponse } from 'next/server';
import { readStore } from '../../../lib/store';
import { clientIp, rateLimit } from '../../../lib/ratelimit';

export async function GET(request) {
  if (!rateLimit(`store:${clientIp(request)}`, 60, 60 * 1000)) {
    return NextResponse.json({ message: 'Too many requests.' }, { status: 429 });
  }

  const url = new URL(request.url);
  const gameId = url.searchParams.get('gameId');
  const store = await readStore(gameId);
  return NextResponse.json(store);
}
