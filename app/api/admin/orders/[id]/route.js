import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../../lib/admin';
import { getOrderById, updateOrderStatus } from '../../../../../lib/store';
import { sanitizeString, truncate } from '../../../../../lib/validate';

const MAX_JSON_SIZE = 1024 * 1024;

function checkRequestSize(request) {
  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > MAX_JSON_SIZE) {
    return true;
  }
  return false;
}

export async function PATCH(request, { params }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  if (checkRequestSize(request)) {
    return NextResponse.json({ message: 'Request too large.' }, { status: 413 });
  }

  const { id } = await params;
  const orderId = sanitizeString(id, 64);
  if (!orderId) {
    return NextResponse.json({ message: 'A valid order ID is required.' }, { status: 400 });
  }

  const payload = await request.json();

  try {
    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
    }

    const status = sanitizeString(payload.status, 32);
    const allowedStatuses = ['pending', 'paid', 'in_progress', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ message: 'Invalid status.' }, { status: 400 });
    }

    await updateOrderStatus(orderId, status);
    return NextResponse.json({ ok: true, id: orderId, status });
  } catch (error) {
    return NextResponse.json({ message: 'Unable to update the order.' }, { status: 400 });
  }
}
