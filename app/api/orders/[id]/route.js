import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth';
import { isAdminRequest } from '../../../lib/admin';
import { clientIp, rateLimit } from '../../../lib/ratelimit';
import { createOrderWith2FA, getOrdersForFulfillment, updateOrderFulfillmentStatus, generateAndStoreOTP, verifyOTP, purgeSensitiveData, decryptCredentials, sendDiscordWebhook } from '../../../lib/store';
import { validateOrderId, sanitizeString } from '../../../lib/validate';

const MAX_JSON_SIZE = 1024 * 1024;

function checkRequestSize(request) {
  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > MAX_JSON_SIZE) {
    return true;
  }
  return false;
}

export async function GET(request, { params }) {
  const { id } = await params;
  const orderId = validateOrderId(id);

  if (!(await isAdminRequest())) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const order = await decryptCredentials(orderId);
  if (!order) {
    return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
  }

  return NextResponse.json(order);
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
    return NextResponse.json({ message: 'Unable to place the order.' }, { status: 400 });
  }
}

export async function PATCH(request, { params }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const { id } = await params;
  const orderId = validateOrderId(id);
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (!action) {
    return NextResponse.json({ message: 'Action is required.' }, { status: 400 });
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

    return NextResponse.json({ message: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ message: 'Operation failed.' }, { status: 400 });
  }
}
