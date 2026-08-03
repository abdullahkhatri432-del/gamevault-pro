import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../lib/admin';
import { createCoupon, listCoupons } from '../../../../lib/store';

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ coupons: await listCoupons() });
}

export async function POST(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const payload = await request.json();

  try {
    const coupon = await createCoupon(payload);
    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Unable to create the promo code.' }, { status: 400 });
  }
}
