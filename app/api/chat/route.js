import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRequest } from '@/lib/admin';
import { getDb } from '@/lib/db';

const db = getDb();

function ensureChatTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      booster_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL,
      order_id TEXT NOT NULL,
      sender_type TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      message TEXT NOT NULL,
      flagged INTEGER NOT NULL DEFAULT 0,
      flag_reason TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

ensureChatTables();

const OFF_PLATFORM_KEYWORDS = ['whatsapp', 'discord', 'paytm', 'direct upi', 'phone number', 'instagram', 'telegram', 'snapchat'];

function containsOffPlatformKeywords(message) {
  const lower = message.toLowerCase();
  return OFF_PLATFORM_KEYWORDS.some((kw) => lower.includes(kw));
}

const getThreadByOrder = db.prepare('SELECT * FROM chat_threads WHERE order_id = @orderId LIMIT 1');
const getMessagesByThread = db.prepare('SELECT * FROM chat_messages WHERE thread_id = @threadId ORDER BY created_at ASC');
const insertThread = db.prepare('INSERT INTO chat_threads (order_id, customer_email, booster_id) VALUES (@orderId, @customerEmail, @boosterId)');
const insertMessage = db.prepare('INSERT INTO chat_messages (thread_id, order_id, sender_type, sender_id, message, flagged, flag_reason) VALUES (@threadId, @orderId, @senderType, @senderId, @message, @flagged, @flagReason)');
const updateThreadTimestamp = db.prepare('UPDATE chat_threads SET updated_at = @updatedAt WHERE id = @id');

export async function GET(request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get('orderId');

  if (!(await isAdminRequest())) {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 });
    }
  }

  if (orderId) {
    const thread = getThreadByOrder.get({ orderId });
    if (!thread) {
      return NextResponse.json({ thread: null, messages: [] });
    }
    const messages = getMessagesByThread.all({ threadId: thread.id });
    return NextResponse.json({ thread, messages });
  }

  if (await isAdminRequest()) {
    const threads = db.prepare('SELECT * FROM chat_threads ORDER BY updated_at DESC').all();
    return NextResponse.json({ threads });
  }

  return NextResponse.json({ message: 'Order ID required.' }, { status: 400 });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 });
  }

  const body = await request.json();
  const orderId = String(body.orderId || '').trim();
  const message = String(body.message || '').trim();

  if (!orderId || !message) {
    return NextResponse.json({ message: 'Order ID and message are required.' }, { status: 400 });
  }

  let thread = getThreadByOrder.get({ orderId });
  if (!thread) {
    const result = insertThread.run({ orderId, customerEmail: user.email, boosterId: null });
    thread = getThreadByOrder.get({ orderId });
  }

  const flagged = containsOffPlatformKeywords(message) ? 1 : 0;
  const flagReason = flagged ? 'Off-platform keyword detected' : null;

  insertMessage.run({
    threadId: thread.id,
    orderId,
    senderType: 'customer',
    senderId: user.email,
    message,
    flagged,
    flagReason,
  });

  updateThreadTimestamp.run({ id: thread.id, updatedAt: new Date().toISOString() });

  return NextResponse.json({ success: true, flagged });
}
