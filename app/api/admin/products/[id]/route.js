import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../../lib/admin';
import { deleteProduct, updateProduct } from '../../../../../lib/store';
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
  const productId = Number(id);
  if (!productId) {
    return NextResponse.json({ message: 'A valid product ID is required.' }, { status: 400 });
  }

  const payload = await request.json();

  try {
    const updatedProduct = await updateProduct(productId, {
      ...payload,
      title: truncate(sanitizeString(payload.title), 200),
      price: truncate(sanitizeString(payload.price), 50),
      tag: truncate(sanitizeString(payload.tag), 100),
      rating: truncate(sanitizeString(payload.rating), 10),
      stock: truncate(sanitizeString(payload.stock), 50),
      category: truncate(sanitizeString(payload.category), 50),
      gameId: truncate(sanitizeString(payload.gameId || payload.game_id || 'gta5'), 20),
      imageUrl: truncate(sanitizeString(payload.imageUrl), 2048),
      description: truncate(sanitizeString(payload.description), 2000),
    });
    return NextResponse.json(updatedProduct);
  } catch (error) {
    return NextResponse.json({ message: 'Unable to update the product.' }, { status: 400 });
  }
}

export async function DELETE(_request, { params }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const { id } = await params;
  const productId = Number(id);
  if (!productId) {
    return NextResponse.json({ message: 'A valid product ID is required.' }, { status: 400 });
  }

  await deleteProduct(productId);
  return NextResponse.json({ ok: true });
}
