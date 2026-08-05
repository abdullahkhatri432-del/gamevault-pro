import crypto from 'crypto';
import Razorpay from 'razorpay';
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

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
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

  if (order.status === 'cancelled') {
    return NextResponse.json({ message: 'This order has been cancelled.' }, { status: 400 });
  }

  if (order.razorpayOrderId !== razorpayOrderId) {
    return NextResponse.json({ message: 'Payment order does not match.' }, { status: 400 });
  }

  if ((order.status === 'paid' || order.status === 'delivered') && order.razorpayPaymentId === razorpayPaymentId) {
    return NextResponse.json({ valid: true, message: 'Payment already verified. Your order is confirmed.' });
  }

  if ((order.status === 'paid' || order.status === 'delivered') && order.razorpayPaymentId !== razorpayPaymentId) {
    return NextResponse.json({ message: 'This order has already been paid with a different payment.' }, { status: 400 });
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

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const payment = await razorpay.payments.fetch(razorpayPaymentId);

    if (payment.status !== 'captured') {
      return NextResponse.json({ message: 'Payment has not been captured yet.' }, { status: 400 });
    }

    if (payment.currency !== 'INR') {
      return NextResponse.json({ message: 'Invalid payment currency.' }, { status: 400 });
    }

    if (payment.amount !== order.amountPaise) {
      return NextResponse.json({ message: 'Payment amount does not match order total.' }, { status: 400 });
    }

    if (payment.order_id !== razorpayOrderId) {
      return NextResponse.json({ message: 'Payment does not belong to this Razorpay order.' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ message: 'Unable to verify payment with Razorpay.' }, { status: 502 });
  }

  await markOrderPaid(orderId, razorpayPaymentId);
  return NextResponse.json({ valid: true, message: 'Payment verified successfully. Your order is confirmed.' });
}