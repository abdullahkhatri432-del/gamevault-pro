import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { deleteProduct, updateProduct } from '../../../../../lib/store';

export async function PATCH(request, { params }) {
  const adminCookie = cookies().get('gamevault_admin');

  if (adminCookie?.value !== 'true') {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const productId = Number(params.id);
  if (!productId) {
    return NextResponse.json({ message: 'A valid product ID is required.' }, { status: 400 });
  }

  const payload = await request.json();

  try {
    const updatedProduct = await updateProduct(productId, payload);
    return NextResponse.json(updatedProduct);
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Unable to update the product.' }, { status: 400 });
  }
}

export async function DELETE(_request, { params }) {
  const adminCookie = cookies().get('gamevault_admin');

  if (adminCookie?.value !== 'true') {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const productId = Number(params.id);
  if (!productId) {
    return NextResponse.json({ message: 'A valid product ID is required.' }, { status: 400 });
  }

  await deleteProduct(productId);
  return NextResponse.json({ ok: true });
}
