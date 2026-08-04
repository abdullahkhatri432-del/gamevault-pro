import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRequest } from '@/lib/admin';
import { getDb } from '@/lib/db';
import { sanitizeString, truncate } from '@/lib/validate';

const db = getDb();

function ensureBoosterTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS boosters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      whatsapp TEXT,
      discord_tag TEXT,
      id_document_url TEXT,
      selfie_url TEXT,
      social_proof TEXT,
      upi_id TEXT,
      bank_details TEXT,
      crypto_wallet TEXT,
      supported_games TEXT,
      supported_launchers TEXT,
      supported_platforms TEXT,
      supported_service_types TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      escrow_hold_days INTEGER NOT NULL DEFAULT 14,
      security_deposit INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      verified_at TEXT
    );
  `);
}

ensureBoosterTable();

const insertBooster = db.prepare(`
  INSERT INTO boosters (user_id, full_name, email, whatsapp, discord_tag, id_document_url, selfie_url, social_proof, upi_id, bank_details, crypto_wallet, supported_games, supported_launchers, supported_platforms, supported_service_types)
  VALUES (@userId, @fullName, @email, @whatsapp, @discordTag, @idDocumentUrl, @selfieUrl, @socialProof, @upiId, @bankDetails, @cryptoWallet, @supportedGames, @supportedLaunchers, @supportedPlatforms, @supportedServiceTypes)
`);

const getBoosterByEmail = db.prepare('SELECT * FROM boosters WHERE email = @email');
const getAllBoosters = db.prepare('SELECT * FROM boosters ORDER BY created_at DESC');
const updateBoosterStatus = db.prepare('UPDATE boosters SET status = @status, verified_at = @verifiedAt WHERE id = @id');

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });
  }

  const boosters = getAllBoosters.all();
  return NextResponse.json({ boosters });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 });
  }

  const existing = getBoosterByEmail.get({ email: user.email });
  if (existing) {
    return NextResponse.json({ message: 'You have already applied as a booster.' }, { status: 400 });
  }

  const body = await request.json();

  const entry = {
    userId: user.id,
    fullName: truncate(sanitizeString(body.fullName), 200),
    email: user.email,
    whatsapp: truncate(sanitizeString(body.whatsapp), 20),
    discordTag: truncate(sanitizeString(body.discordTag), 200),
    idDocumentUrl: truncate(sanitizeString(body.idDocumentUrl), 2048),
    selfieUrl: truncate(sanitizeString(body.selfieUrl), 2048),
    socialProof: truncate(sanitizeString(body.socialProof), 5000),
    upiId: truncate(sanitizeString(body.upiId), 200),
    bankDetails: truncate(sanitizeString(body.bankDetails), 500),
    cryptoWallet: truncate(sanitizeString(body.cryptoWallet), 200),
    supportedGames: truncate(sanitizeString(JSON.stringify(body.supportedGames || [])), 2000),
    supportedLaunchers: truncate(sanitizeString(JSON.stringify(body.supportedLaunchers || [])), 2000),
    supportedPlatforms: truncate(sanitizeString(JSON.stringify(body.supportedPlatforms || [])), 2000),
    supportedServiceTypes: truncate(sanitizeString(JSON.stringify(body.supportedServiceTypes || [])), 2000),
  };

  if (!entry.fullName || !entry.whatsapp || !entry.discordTag) {
    return NextResponse.json({ message: 'Full name, WhatsApp, and Discord tag are required.' }, { status: 400 });
  }

  try {
    insertBooster.run(entry);
    return NextResponse.json({ message: 'Booster application submitted successfully. Pending verification.' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Unable to submit application.' }, { status: 400 });
  }
}

export async function PATCH(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });
  }

  const body = await request.json();
  const { id, status } = body;

  if (!id || !['approved', 'rejected', 'suspended'].includes(status)) {
    return NextResponse.json({ message: 'Valid booster ID and status are required.' }, { status: 400 });
  }

  updateBoosterStatus.run({ id, status, verifiedAt: status === 'approved' ? new Date().toISOString() : null });
  return NextResponse.json({ message: `Booster ${status}.` });
}
