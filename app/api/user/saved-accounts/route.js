import { NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/session';
import { getDb } from '@/lib/db';

const db = getDb();

function ensureSavedAccountsTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      steam_id TEXT DEFAULT '',
      epic_id TEXT DEFAULT '',
      social_club_id TEXT DEFAULT '',
      psn_id TEXT DEFAULT '',
      xbox_live_id TEXT DEFAULT '',
      discord_username TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

ensureSavedAccountsTable();

const getSavedAccounts = db.prepare('SELECT * FROM saved_accounts WHERE user_id = @userId LIMIT 1');
const upsertSavedAccounts = db.prepare(`
  INSERT INTO saved_accounts (user_id, steam_id, epic_id, social_club_id, psn_id, xbox_live_id, discord_username, updated_at)
  VALUES (@userId, @steamId, @epicId, @socialClubId, @psnId, @xboxLiveId, @discordUsername, @updatedAt)
  ON CONFLICT(user_id) DO UPDATE SET
    steam_id = @steamId,
    epic_id = @epicId,
    social_club_id = @socialClubId,
    psn_id = @psnId,
    xbox_live_id = @xboxLiveId,
    discord_username = @discordUsername,
    updated_at = @updatedAt
`);

export async function GET() {
  try {
    const cookieHeader = globalThis.headers?.get?.('cookie') || '';
    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    if (!sessionMatch) {
      return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 });
    }

    const session = await verifySessionToken(sessionMatch[1]);
    if (!session || !session.userId) {
      return NextResponse.json({ message: 'Invalid session.' }, { status: 401 });
    }

    const saved = getSavedAccounts.get({ userId: session.userId });
    return NextResponse.json(saved || {
      steamId: '',
      epicId: '',
      socialClubId: '',
      psnId: '',
      xboxLiveId: '',
      discordUsername: '',
    });
  } catch (error) {
    return NextResponse.json({ message: 'Unable to load saved accounts.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieHeader = globalThis.headers?.get?.('cookie') || '';
    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    if (!sessionMatch) {
      return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 });
    }

    const session = await verifySessionToken(sessionMatch[1]);
    if (!session || !session.userId) {
      return NextResponse.json({ message: 'Invalid session.' }, { status: 401 });
    }

    const body = await request.json();
    const entry = {
      userId: session.userId,
      steamId: String(body.steamId || '').trim().slice(0, 200),
      epicId: String(body.epicId || '').trim().slice(0, 200),
      socialClubId: String(body.socialClubId || '').trim().slice(0, 200),
      psnId: String(body.psnId || '').trim().slice(0, 200),
      xboxLiveId: String(body.xboxLiveId || '').trim().slice(0, 200),
      discordUsername: String(body.discordUsername || '').trim().slice(0, 200),
      updatedAt: new Date().toISOString(),
    };

    upsertSavedAccounts.run(entry);
    return NextResponse.json({ message: 'Saved accounts updated successfully.' });
  } catch (error) {
    return NextResponse.json({ message: 'Unable to save accounts.' }, { status: 500 });
  }
}
