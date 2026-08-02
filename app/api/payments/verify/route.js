import crypto from 'crypto';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const payload = await request.json();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;

  if (!process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ message: 'Razorpay signature secret is not configured yet.' }, { status: 400 });
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ message: 'Missing Razorpay payment details for signature verification.' }, { status: 400 });
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const isValid = expectedSignature === razorpay_signature;
  return NextResponse.json({ valid: isValid, message: isValid ? 'Signature verified.' : 'Signature mismatch.' });
}
