import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../../lib/admin';
import { deleteCoupon, updateCoupon } from '../../../../../lib/store';

export async function PATCH(request, { params }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const { id } = await params;
  const couponId = Number(id);
  if (!couponId) {
    return NextResponse.json({ message: 'A valid promo code ID is required.' }, { status: 400 });
  }

  const payload = await request.json();

  try {
    const updated = await updateCoupon(couponId, payload);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Unable to update the promo code.' }, { status: 400 });
  }
}

export async function DELETE(_request, { params }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const { id } = await params;
  const couponId = Number(id);
  if (!couponId) {
    return NextResponse.json({ message: 'A valid promo code ID is required.' }, { status: 400 });
  }

  await deleteCoupon(couponId);
  return NextResponse.json({ ok: true });
}
