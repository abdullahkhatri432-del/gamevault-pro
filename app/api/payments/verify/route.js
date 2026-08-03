import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getOrderById, markOrderPaid } from '../../../../lib/store';

export async function POST(request) {
  const payload = await request.json();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = payload;

  if (!process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ message: 'Razorpay signature secret is not configured yet.' }, { status: 400 });
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
    return NextResponse.json({ message: 'Missing payment details for verification.' }, { status: 400 });
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
  }

  if (order.razorpayOrderId !== razorpay_order_id) {
    return NextResponse.json({ message: 'Payment order does not match this order.' }, { status: 400 });
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const isValid =
    expectedSignature.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature));

  if (!isValid) {
    return NextResponse.json({ message: 'Signature mismatch.' }, { status: 400 });
  }

  await markOrderPaid(orderId, razorpay_payment_id);
  return NextResponse.json({ valid: true, message: 'Payment verified successfully. Your order is confirmed.' });
}
