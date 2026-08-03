import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../../lib/admin';
import { getOrderById, updateOrderStatus } from '../../../../../lib/store';

export async function PATCH(request, { params }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const { id } = await params;
  const orderId = String(id || '').trim();
  const payload = await request.json();

  try {
    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
    }

    await updateOrderStatus(orderId, String(payload.status || '').trim());
    return NextResponse.json({ ok: true, id: orderId, status: payload.status });
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Unable to update the order.' }, { status: 400 });
  }
}
