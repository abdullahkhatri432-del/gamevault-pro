import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin';
import { getDb } from '@/lib/db';
import { GAMES, LAUNCHER_STATUS } from '@/lib/games';

const db = getDb();

function ensureLauncherSettingsTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS launcher_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL,
      launcher_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(game_id, launcher_name)
    );
  `);
}

ensureLauncherSettingsTable();

const getAllSettings = db.prepare('SELECT * FROM launcher_settings ORDER BY game_id, launcher_name');
const upsertSetting = db.prepare(`
  INSERT INTO launcher_settings (game_id, launcher_name, status, updated_at)
  VALUES (@gameId, @launcherName, @status, @updatedAt)
  ON CONFLICT(game_id, launcher_name) DO UPDATE SET status = @status, updated_at = @updatedAt
`);
const getSettingByGameAndLauncher = db.prepare('SELECT * FROM launcher_settings WHERE game_id = @gameId AND launcher_name = @launcherName');

function initDefaultSettings() {
  for (const game of Object.values(GAMES)) {
    for (const launcher of game.launchers) {
      const existing = getSettingByGameAndLauncher.get({ gameId: game.id, launcherName: launcher.name });
      if (!existing) {
        upsertSetting.run({ gameId: game.id, launcherName: launcher.name, status: launcher.status, updatedAt: new Date().toISOString() });
      }
    }
  }
}

initDefaultSettings();

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });
  }

  const settings = getAllSettings.all();
  return NextResponse.json({ settings });
}

export async function POST(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });
  }

  const body = await request.json();
  const { gameId, launcherName, status } = body;

  if (!gameId || !launcherName || !['active', 'inactive', 'coming_soon'].includes(status)) {
    return NextResponse.json({ message: 'Game ID, launcher name, and valid status are required.' }, { status: 400 });
  }

  upsertSetting.run({ gameId, launcherName, status, updatedAt: new Date().toISOString() });

  return NextResponse.json({ message: `Launcher ${launcherName} updated to ${status}.` });
}
