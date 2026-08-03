import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth';
import { isAdminRequest } from '../../../lib/admin';
import { clientIp, rateLimit } from '../../../lib/ratelimit';
import { createOrderWith2FA, getOrdersForFulfillment, updateOrderFulfillmentStatus, generateAndStoreOTP, verifyOTP, purgeSensitiveData, decryptCredentials, sendDiscordWebhook } from '../../../lib/store';

export async function GET(request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (action === 'fulfillment') {
    if (!(await isAdminRequest())) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const orders = await getOrdersForFulfillment();
    return NextResponse.json(orders);
  }

  if (!(await isAdminRequest())) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const { createApiEndpoint } = await import('../../../lib/store');
  const orders = await createApiEndpoint();
  return NextResponse.json(orders);
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: 'Please sign in with Google to place an order.' }, { status: 401 });
  }

  if (!rateLimit(`create-order:${clientIp(request)}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ message: 'Too many order requests. Try again later.' }, { status: 429 });
  }

  const payload = await request.json();

  if (!payload.serviceType) {
    return NextResponse.json({ message: 'Service type is required to place an order.' }, { status: 400 });
  }

  const discordWebhookId = payload.discordWebhookId || null;

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

  const payload = await request.json();

  try {
    if (action === 'update-status') {
      const { status, agentId } = payload;
      await updateOrderFulfillmentStatus(orderId, status, agentId);
      return NextResponse.json({ message: 'Order status updated.', orderId });
    }

    if (action === 'generate-otp') {
      const { expiryMinutes } = payload;
      const otpData = await generateAndStoreOTP(orderId, expiryMinutes);
      return NextResponse.json(otpData);
    }

    if (action === 'verify-otp') {
      const { otp } = payload;
      await verifyOTP(orderId, otp);
      return NextResponse.json({ message: 'OTP verified successfully.' });
    }

    if (action === 'purge-data') {
      const result = await purgeSensitiveData(orderId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ message: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Operation failed.' }, { status: 400 });
  }
}

export async function GET_CREDENTIALS(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const url = new URL(request.url);
  const orderId = url.searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ message: 'Order ID is required.' }, { status: 400 });
  }

  try {
    const credentials = await decryptCredentials(orderId);
    return NextResponse.json(credentials);
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Unable to decrypt credentials.' }, { status: 400 });
  }
}
