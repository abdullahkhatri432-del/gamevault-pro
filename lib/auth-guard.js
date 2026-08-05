import { getDb } from './db';

const db = getDb();

const orderOwnerCheck = db.prepare('SELECT id, email FROM orders WHERE id = @id');

/**
 * Verify that the currently authenticated user owns the given order.
 * Returns { ok: true, order } or { ok: false, response } with a NextResponse.
 */
export async function verifyOrderOwnership(orderId, user) {
  if (!user || !user.email) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ message: 'Not authenticated.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  const order = orderOwnerCheck.get({ id: String(orderId) });
  if (!order) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ message: 'Order not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  if (order.email.toLowerCase() !== user.email.toLowerCase()) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ message: 'Order not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  return { ok: true, order };
}
