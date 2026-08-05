import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRequest } from '@/lib/admin';
import { getDb } from '@/lib/db';
import { verifyOrderOwnership } from '@/lib/auth-guard';
import { rateLimit } from '@/lib/ratelimit';

const db = getDb();

function ensureChatTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      booster_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      last_read_message_id INTEGER,
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
      admin_notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    db.exec(`ALTER TABLE chat_threads ADD COLUMN last_read_message_id INTEGER`);
  } catch {}

  try {
    db.exec(`ALTER TABLE chat_messages ADD COLUMN admin_notes TEXT`);
  } catch {}
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
const markThreadRead = db.prepare('UPDATE chat_threads SET last_read_message_id = @lastReadMessageId WHERE id = @id');
const softDeleteMessage = db.prepare("UPDATE chat_messages SET message = @message, flagged = 1, flag_reason = @flagReason WHERE id = @id");

export async function GET(request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get('orderId');

  if (orderId) {
    const isAdmin = await isAdminRequest();

    if (!isAdmin) {
      const user = await getCurrentUser();
      const check = await verifyOrderOwnership(orderId, user);
      if (!check.ok) {
        return check.response;
      }
    }

    const thread = getThreadByOrder.get({ orderId });
    if (!thread) {
      return NextResponse.json({ thread: null, messages: [], unreadCount: 0 });
    }

    const allMessages = getMessagesByThread.all({ threadId: thread.id });

    const messages = allMessages.map((msg) => {
      const m = { ...msg };
      if (msg.sender_type !== 'admin') {
        delete m.flag_reason;
      }
      delete m.admin_notes;
      return m;
    });

    let unreadCount = 0;
    if (!isAdmin && thread.last_read_message_id) {
      const lastReadIdx = allMessages.findIndex((m) => m.id === thread.last_read_message_id);
      if (lastReadIdx >= 0) {
        unreadCount = allMessages.length - (lastReadIdx + 1);
      }
    } else if (!isAdmin) {
      unreadCount = allMessages.length;
    }

    return NextResponse.json({ thread, messages, unreadCount });
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

  if (message.length > 2000) {
    return NextResponse.json({ message: 'Message must be 2000 characters or less.' }, { status: 400 });
  }

  const rlKey = `chat:${user.email}:${orderId}`;
  if (!rateLimit(rlKey, 5, 60 * 1000)) {
    return NextResponse.json(
      { message: 'Too many messages. Please wait before sending again.', retryAfter: 60 },
      { status: 429 }
    );
  }

  const ownership = await verifyOrderOwnership(orderId, user);
  if (!ownership.ok) {
    return ownership.response;
  }

  let thread = getThreadByOrder.get({ orderId });
  if (!thread) {
    insertThread.run({ orderId, customerEmail: user.email, boosterId: null });
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

export async function PATCH(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 });
  }

  const body = await request.json();
  const { orderId, lastReadMessageId } = body;

  if (!orderId || !lastReadMessageId) {
    return NextResponse.json({ message: 'orderId and lastReadMessageId are required.' }, { status: 400 });
  }

  const isAdmin = await isAdminRequest();

  if (!isAdmin) {
    const check = await verifyOrderOwnership(orderId, user);
    if (!check.ok) {
      return check.response;
    }
  }

  const thread = getThreadByOrder.get({ orderId });
  if (!thread) {
    return NextResponse.json({ message: 'Thread not found.' }, { status: 404 });
  }

  markThreadRead.run({ lastReadMessageId, id: thread.id });

  return NextResponse.json({ success: true });
}

export async function DELETE(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });
  }

  const body = await request.json();
  const { messageId } = body;

  if (!messageId) {
    return NextResponse.json({ message: 'messageId is required.' }, { status: 400 });
  }

  softDeleteMessage.run({
    message: '[message deleted by moderator]',
    flagReason: 'Deleted by moderator',
    id: messageId,
  });

  return NextResponse.json({ success: true });
}