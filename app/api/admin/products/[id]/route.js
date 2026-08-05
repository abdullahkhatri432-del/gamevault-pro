import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../../lib/admin';
import { deleteProduct, updateProduct } from '../../../../../lib/store';
import { sanitizeString, truncate, validatePrice } from '../../../../../lib/validate';
import { logApiError } from '../../../../../lib/logger';

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
      price: validatePrice(payload.price),
      tag: truncate(sanitizeString(payload.tag), 100),
      rating: truncate(sanitizeString(payload.rating), 10),
      stock: truncate(sanitizeString(payload.stock), 50),
      category: truncate(sanitizeString(payload.category), 50),
      gameId: truncate(sanitizeString(payload.gameId || payload.game_id || 'gta5'), 20),
      imageUrl: truncate(sanitizeString(payload.imageUrl), 2048),
      description: truncate(sanitizeString(payload.description), 2000),
      platform: truncate(sanitizeString(payload.platform), 200),
      launcher: truncate(sanitizeString(payload.launcher), 200),
      requirements: truncate(sanitizeString(payload.requirements), 2000),
      deliveryTime: truncate(sanitizeString(payload.deliveryTime || payload.delivery_time), 100),
      warrantyDays: Number.parseInt(payload.warrantyDays ?? payload.warranty_days ?? 30, 10) || 30,
      originalPrice: truncate(sanitizeString(payload.originalPrice || payload.original_price), 50),
      serviceStatus: truncate(sanitizeString(payload.serviceStatus || payload.service_status), 50),
      fulfillmentMethod: truncate(sanitizeString(payload.fulfillmentMethod || payload.fulfillment_method), 100),
      importantNotes: truncate(sanitizeString(payload.importantNotes || payload.important_notes), 2000),
      supportedRegions: truncate(sanitizeString(payload.supportedRegions || payload.supported_regions), 200),
    });
    return NextResponse.json(updatedProduct);
  } catch (error) {
    logApiError('PATCH /api/admin/products/[id]', error, { productId });
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
