import { NextRequest, NextResponse } from 'next/server';

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (!origin || !host) {
    return true;
  }

  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

function isStateChangingMethod(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // CSRF protection: validate Origin header for state-changing API requests
  if (isStateChangingMethod(method) && pathname.startsWith('/api/')) {
    if (!isSameOrigin(request)) {
      return NextResponse.json(
        { message: 'CSRF validation failed.' },
        { status: 403 }
      );
    }
  }

  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
