import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createProduct, listProducts } from '../../../../lib/store';

export async function GET() {
  const adminCookie = cookies().get('gamevault_admin');

  if (adminCookie?.value !== 'true') {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const products = await listProducts();
  return NextResponse.json({ products });
}

export async function POST(request) {
  const adminCookie = cookies().get('gamevault_admin');

  if (adminCookie?.value !== 'true') {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const payload = await request.json();

  try {
    const createdProduct = await createProduct(payload);
    return NextResponse.json(createdProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Unable to create the product.' }, { status: 400 });
  }
}
