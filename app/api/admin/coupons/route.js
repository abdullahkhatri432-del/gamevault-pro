import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../lib/admin';
import { createCoupon, listCoupons } from '../../../../lib/store';
import { sanitizeString, truncate, validateCouponCode } from '../../../../lib/validate';

const MAX_JSON_SIZE = 1024 * 1024;

function checkRequestSize(request) {
  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > MAX_JSON_SIZE) {
    return true;
  }
  return false;
}

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

  if (checkRequestSize(request)) {
    return NextResponse.json({ message: 'Request too large.' }, { status: 413 });
  }

  const payload = await request.json();

  try {
    const coupon = await createCoupon({
      ...payload,
      code: validateCouponCode(payload.code),
      discountType: sanitizeString(payload.discountType || payload.discount_type, 10),
      discountValue: Number.parseFloat(payload.discountValue ?? payload.discount_value),
      maxUses: Math.max(0, Number.parseInt(payload.maxUses ?? payload.max_uses, 10) || 0),
      expiresAt: payload.expiresAt || payload.expires_at || null,
      active: payload.active !== undefined && payload.active !== null ? Number(payload.active) : 1,
    });
    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Unable to create the promo code.' }, { status: 400 });
  }
}
