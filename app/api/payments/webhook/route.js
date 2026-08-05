import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { recordPaymentEvent, markPaymentEventDone, findOrderForWebhook, markOrderPaidIfPending } from '../../../../lib/store';

const RAW_BODY_LIMIT = 512 * 1024;

export async function POST(request) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > RAW_BODY_LIMIT) {
    return NextResponse.json({ message: 'Payload too large.' }, { status: 413 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature');

  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ message: 'Webhook not configured.' }, { status: 500 });
  }

  if (!signature) {
    return NextResponse.json({ message: 'Missing webhook signature.' }, { status: 400 });
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  const isValid =
    expectedSignature.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));

  if (!isValid) {
    return NextResponse.json({ message: 'Invalid webhook signature.' }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ message: 'Invalid JSON payload.' }, { status: 400 });
  }

  const eventId = event.id;
  const eventType = event.event;

  if (!eventId || !eventType) {
    return NextResponse.json({ message: 'Missing event id or type.' }, { status: 400 });
  }

  const allowedEvents = [
    'payment.captured',
    'payment.failed',
    'payment.authorized',
    'order.paid',
  ];

  if (!allowedEvents.includes(eventType)) {
    return NextResponse.json({ message: 'Unhandled event type.' }, { status: 200 });
  }

  const payload = event.payload || {};
  const paymentEntity = payload.payment?.entity || {};
  const orderEntity = payload.order?.entity || {};

  const razorpayOrderId = paymentEntity.order_id || orderEntity.id || '';
  const razorpayPaymentId = paymentEntity.id || '';

  const record = recordPaymentEvent(eventId, eventType, razorpayOrderId, razorpayPaymentId, event);

  if (record.duplicate) {
    return NextResponse.json({ message: 'Event already processed.' });
  }

  try {
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const order = findOrderForWebhook(razorpayOrderId);
      if (order) {
        markOrderPaidIfPending(order.id, razorpayPaymentId || order.razorpayPaymentId);
      }
    }

    markPaymentEventDone(record.id);
  } catch {
    return NextResponse.json({ message: 'Event processing failed.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Webhook processed.' });
}