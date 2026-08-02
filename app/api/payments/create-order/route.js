import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request) {
  const payload = await request.json();

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({
      message: 'Razorpay credentials are not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment.',
    }, { status: 400 });
  }

  const amount = Number(payload.amount || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ message: 'A valid amount is required for Razorpay checkout.' }, { status: 400 });
  }

  const normalizedAmount = amount > 1000 ? Math.round(amount) : Math.round(amount * 100);

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: normalizedAmount,
      currency: payload.currency || 'INR',
      receipt: payload.receipt || `receipt_${Date.now()}`,
      notes: payload.notes || {},
    });

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Unable to create a Razorpay order.' }, { status: 500 });
  }
}
