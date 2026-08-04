import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sanitizeString, truncate } from '@/lib/validate';

const db = getDb();

function ensureWaitlistTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS waitlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL,
      launcher_name TEXT NOT NULL,
      email TEXT NOT NULL,
      discord_username TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

ensureWaitlistTable();

const insertWaitlist = db.prepare('INSERT INTO waitlist (game_id, launcher_name, email, discord_username) VALUES (@gameId, @launcherName, @email, @discordUsername)');
const getWaitlistCount = db.prepare('SELECT COUNT(*) as count FROM waitlist WHERE game_id = @gameId AND launcher_name = @launcherName');
const getWaitlistByEmail = db.prepare('SELECT * FROM waitlist WHERE email = @email AND game_id = @gameId AND launcher_name = @launcherName');

export async function POST(request) {
  const body = await request.json();
  const gameId = truncate(sanitizeString(body.gameId), 20);
  const launcherName = truncate(sanitizeString(body.launcherName), 100);
  const email = truncate(sanitizeString(body.email), 200);
  const discordUsername = truncate(sanitizeString(body.discordUsername), 200);

  if (!gameId || !launcherName || !email) {
    return NextResponse.json({ message: 'Game, launcher, and email are required.' }, { status: 400 });
  }

  const existing = getWaitlistByEmail.get({ email, gameId, launcherName });
  if (existing) {
    return NextResponse.json({ message: 'You are already on the waitlist for this launcher.' }, { status: 400 });
  }

  insertWaitlist.run({ gameId, launcherName, email, discordUsername });

  const count = getWaitlistCount.get({ gameId, launcherName });

  return NextResponse.json({
    message: 'Added to waitlist. We will notify you when slots open.',
    waitlistPosition: count.count,
  }, { status: 201 });
}
