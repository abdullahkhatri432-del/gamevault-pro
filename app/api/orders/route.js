import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth';
import { isAdminRequest } from '../../../lib/admin';
import { clientIp, rateLimit } from '../../../lib/ratelimit';
import { createOrderWith2FA, getOrdersForFulfillment, updateOrderFulfillmentStatus, generateAndStoreOTP, verifyOTP, purgeSensitiveData, decryptCredentials, sendDiscordWebhook, listOrders, listOrdersByUser, updateDeliveryProof } from '../../../lib/store';
import { validateOrderId, sanitizeString, truncate } from '../../../lib/validate';

const MAX_JSON_SIZE = 1024 * 1024;

function checkRequestSize(request) {
  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > MAX_JSON_SIZE) {
    return true;
  }
  return false;
}

export async function GET(request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const gameId = url.searchParams.get('gameId');

  if (action === 'fulfillment') {
    if (!(await isAdminRequest())) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const orders = await getOrdersForFulfillment();
    return NextResponse.json(orders);
  }

  if (action === 'my-orders') {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 });
    }

    const orders = await listOrdersByUser(user.email);
    return NextResponse.json(orders);
  }

  if (!(await isAdminRequest())) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const orders = await listOrders(gameId);
  return NextResponse.json(orders);
}

export async function POST(request) {
  if (checkRequestSize(request)) {
    return NextResponse.json({ message: 'Request too large.' }, { status: 413 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: 'Please sign in with Google to place an order.' }, { status: 401 });
  }

  if (!rateLimit(`create-order:${clientIp(request)}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ message: 'Too many order requests. Try again later.' }, { status: 429 });
  }

  const payload = await request.json();

  const serviceType = sanitizeString(payload.serviceType, 64);
  if (!serviceType) {
    return NextResponse.json({ message: 'Service type is required to place an order.' }, { status: 400 });
  }

  const discordWebhookId = payload.discordWebhookId ? sanitizeString(payload.discordWebhookId, 256) : null;

  try {
    const order = await createOrderWith2FA({
      ...payload,
      name: user.name,
      email: user.email,
    });

    if (discordWebhookId) {
      await sendDiscordWebhook(discordWebhookId, order);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Unable to place the order.' }, { status: 400 });
  }
}

export async function PATCH(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const url = new URL(request.url);
  const orderId = url.searchParams.get('orderId');
  const action = url.searchParams.get('action');

  if (!orderId) {
    return NextResponse.json({ message: 'Order ID is required.' }, { status: 400 });
  }

  if (checkRequestSize(request)) {
    return NextResponse.json({ message: 'Request too large.' }, { status: 413 });
  }

  const payload = await request.json();

  try {
    if (action === 'update-status') {
      const status = sanitizeString(payload.status, 32);
      const allowedStatuses = ['pending', 'paid', 'in_progress', 'delivered', 'cancelled'];
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json({ message: 'Invalid status.' }, { status: 400 });
      }
      const agentId = payload.agentId ? sanitizeString(payload.agentId, 64) : null;
      await updateOrderFulfillmentStatus(orderId, status, agentId);
      return NextResponse.json({ message: 'Order status updated.', orderId });
    }

    if (action === 'generate-otp') {
      const expiryMinutes = Math.min(Math.max(Number(payload.expiryMinutes) || 15, 1), 60);
      const otpData = await generateAndStoreOTP(orderId, expiryMinutes);
      return NextResponse.json(otpData);
    }

    if (action === 'verify-otp') {
      const otp = sanitizeString(payload.otp, 10);
      await verifyOTP(orderId, otp);
      return NextResponse.json({ message: 'OTP verified successfully.' });
    }

    if (action === 'purge-data') {
      const result = await purgeSensitiveData(orderId);
      return NextResponse.json(result);
    }

    if (action === 'update-delivery-proof') {
      const deliveryProof = sanitizeString(payload.deliveryProof, 5000);
      const result = await updateDeliveryProof(orderId, deliveryProof);
      return NextResponse.json(result);
    }

    return NextResponse.json({ message: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Operation failed.' }, { status: 400 });
  }
}
