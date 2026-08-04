import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getOrderById, attachRazorpayOrder } from '../../../../lib/store';
import { sanitizeString, validateOrderId } from '../../../../lib/validate';

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
  const orderId = validateOrderId(payload.orderId);

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({
      message: 'Payment processing is not configured.',
    }, { status: 400 });
  }

  if (!orderId) {
    return NextResponse.json({ message: 'A valid order ID is required.' }, { status: 400 });
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
  }

  if (order.status === 'paid' || order.status === 'delivered') {
    return NextResponse.json({ message: 'This order has already been paid.' }, { status: 400 });
  }

  if (order.amountPaise <= 0) {
    return NextResponse.json({ message: 'This order has an invalid amount.' }, { status: 400 });
  }

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const createdOrder = await razorpay.orders.create({
      amount: order.amountPaise,
      currency: 'INR',
      receipt: `order_${orderId}`,
      notes: {
        customerName: order.name,
        customerEmail: order.email,
        account: order.game,
        launcher: order.launcher,
      },
    });

    await attachRazorpayOrder(orderId, createdOrder.id);

    return NextResponse.json({
      id: createdOrder.id,
      amount: createdOrder.amount,
      currency: createdOrder.currency,
      orderId,
    });
  } catch (error) {
    return NextResponse.json({ message: 'Unable to create a Razorpay order.' }, { status: 500 });
  }
}
