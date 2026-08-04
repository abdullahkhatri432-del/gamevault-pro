import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from '@/lib/session';
import { getUserById } from '@/lib/store';
import { getDb } from '@/lib/db';

const db = getDb();

function ensureSavedAccountsTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
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

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('gamevault_user');
  if (!userCookie?.value) return null;

  const payload = verify(userCookie.value);
  if (!payload || payload.scope !== 'user' || typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;

  return getUserById(payload.id);
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 });
    }

    const saved = getSavedAccounts.get({ userId: user.id });
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
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 });
    }

    const body = await request.json();
    const entry = {
      userId: user.id,
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
