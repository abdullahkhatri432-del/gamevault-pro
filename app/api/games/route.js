import { NextResponse } from 'next/server';
import { getGamesArray, getGameById } from '@/lib/games';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const gameId = url.searchParams.get('id');

    if (gameId) {
      const game = getGameById(gameId);
      if (!game) {
        return NextResponse.json({ message: 'Game not found.' }, { status: 404 });
      }
      return NextResponse.json(game);
    }

    const games = getGamesArray();
    return NextResponse.json({ games });
  } catch (error) {
    return NextResponse.json({ message: 'Unable to load games.' }, { status: 500 });
  }
}
