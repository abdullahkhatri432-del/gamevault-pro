import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin';
import { getDb } from '@/lib/db';

const db = getDb();

function ensureEscrowTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS escrow_payouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      booster_id TEXT NOT NULL,
      amount_paise INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'held',
      held_until TEXT NOT NULL,
      released_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

ensureEscrowTable();

const getAllPayouts = db.prepare('SELECT * FROM escrow_payouts ORDER BY created_at DESC');
const getPayoutByOrder = db.prepare('SELECT * FROM escrow_payouts WHERE order_id = @orderId');
const createPayout = db.prepare('INSERT INTO escrow_payouts (order_id, booster_id, amount_paise, held_until) VALUES (@orderId, @boosterId, @amountPaise, @heldUntil)');
const releasePayout = db.prepare("UPDATE escrow_payouts SET status = 'released', released_at = @releasedAt WHERE id = @id");
const forfeitPayout = db.prepare("UPDATE escrow_payouts SET status = 'forfeited' WHERE id = @id");
const flagPayout = db.prepare("UPDATE escrow_payouts SET status = 'flagged' WHERE id = @id");

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });
  }

  const payouts = getAllPayouts.all();
  return NextResponse.json({ payouts });
}

export async function POST(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });
  }

  const body = await request.json();
  const { orderId, boosterId, amountPaise, holdDays = 14 } = body;

  if (!orderId || !boosterId || !amountPaise) {
    return NextResponse.json({ message: 'Order ID, booster ID, and amount are required.' }, { status: 400 });
  }

  const heldUntil = new Date();
  heldUntil.setDate(heldUntil.getDate() + holdDays);

  createPayout.run({ orderId, boosterId, amountPaise, heldUntil: heldUntil.toISOString() });

  return NextResponse.json({ message: 'Escrow payout created.', heldUntil: heldUntil.toISOString() }, { status: 201 });
}

export async function PATCH(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });
  }

  const body = await request.json();
  const { id, action } = body;

  if (!id || !['release', 'forfeit', 'flag'].includes(action)) {
    return NextResponse.json({ message: 'Valid payout ID and action are required.' }, { status: 400 });
  }

  if (action === 'release') {
    releasePayout.run({ id, releasedAt: new Date().toISOString() });
  } else if (action === 'forfeit') {
    forfeitPayout.run({ id });
  } else if (action === 'flag') {
    flagPayout.run({ id });
  }

  return NextResponse.json({ message: `Payout ${action}d.` });
}
