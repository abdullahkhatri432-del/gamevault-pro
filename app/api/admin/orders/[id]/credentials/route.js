import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../../../lib/admin';
import { getOrderById } from '../../../../../../lib/store';
import { decryptText } from '../../../../../../lib/crypto';

export async function GET(_request, { params }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const { id } = await params;
  const orderId = String(id || '').trim();
  const order = await getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
  }

  return NextResponse.json({
    id: order.id,
    accountId: decryptText(order.accountId),
    accountPassword: decryptText(order.accountPassword),
  });
}
