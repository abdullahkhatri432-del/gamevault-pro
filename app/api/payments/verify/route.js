import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getOrderById, markOrderPaid } from '../../../../lib/store';
import { sanitizeString } from '../../../../lib/validate';
import { getCurrentUser } from '@/lib/auth';

const MAX_JSON_SIZE = 1024 * 1024;

function checkRequestSize(request) {
  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > MAX_JSON_SIZE) {
    return true;
  }
  return false;
}

export async function POST(request) {
  if (checkRequestSize(request)) {
    return NextResponse.json({ message: 'Request too large.' }, { status: 413 });
  }

  const payload = await request.json();
  const razorpayOrderId = sanitizeString(payload.razorpay_order_id, 64);
  const razorpayPaymentId = sanitizeString(payload.razorpay_payment_id, 64);
  const razorpaySignature = sanitizeString(payload.razorpay_signature, 128);
  const orderId = sanitizeString(payload.orderId, 64);

  if (!process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ message: 'Payment verification is not configured.' }, { status: 400 });
  }

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
    return NextResponse.json({ message: 'Missing payment details.' }, { status: 400 });
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
  }

  const user = await getCurrentUser();
  if (!user || order.email.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
  }

  if (order.razorpayOrderId !== razorpayOrderId) {
    return NextResponse.json({ message: 'Payment order does not match.' }, { status: 400 });
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  const isValid =
    expectedSignature.length === razorpaySignature.length &&
    crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpaySignature));

  if (!isValid) {
    return NextResponse.json({ message: 'Signature mismatch.' }, { status: 400 });
  }

  await markOrderPaid(orderId, razorpayPaymentId);
  return NextResponse.json({ valid: true, message: 'Payment verified successfully. Your order is confirmed.' });
}