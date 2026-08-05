import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminToken } from '../../../../lib/admin';
import { clientIp, rateLimit } from '../../../../lib/ratelimit';

const expectedUsername = process.env.ADMIN_USERNAME;
const expectedPassword = process.env.ADMIN_PASSWORD;

const adminConfigured = expectedUsername && expectedPassword && expectedPassword.length >= 12;

if (!adminConfigured) {
  console.error(
    '[SECURITY] Admin authentication disabled. Set ADMIN_USERNAME and ADMIN_PASSWORD (min 12 chars) in .env.local'
  );
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

const loginAttempts = new Map();

function constantTimeEqual(a, b) {
  const bufferA = Buffer.from(String(a));
  const bufferB = Buffer.from(String(b));
  const maxLength = Math.max(bufferA.length, bufferB.length);
  const paddedA = Buffer.alloc(maxLength, 0);
  const paddedB = Buffer.alloc(maxLength, 0);
  bufferA.copy(paddedA);
  bufferB.copy(paddedB);
  return crypto.timingSafeEqual(paddedA, paddedB);
}

function isLockedOut(ip) {
  const attempt = loginAttempts.get(ip);
  if (!attempt) {
    return false;
  }
  if (attempt.count >= MAX_LOGIN_ATTEMPTS && Date.now() - attempt.lastAttempt < LOCKOUT_DURATION_MS) {
    return true;
  }
  if (Date.now() - attempt.lastAttempt >= LOCKOUT_DURATION_MS) {
    loginAttempts.delete(ip);
    return false;
  }
  return false;
}

function recordFailedAttempt(ip) {
  const attempt = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
  attempt.count += 1;
  attempt.lastAttempt = Date.now();
  loginAttempts.set(ip, attempt);
}

function clearFailedAttempts(ip) {
  loginAttempts.delete(ip);
}

export async function POST(request) {
  if (!adminConfigured) {
    return NextResponse.json(
      { message: 'Admin authentication is not configured. Contact the server administrator.' },
      { status: 500 }
    );
  }

  const payload = await request.json();
  const username = String(payload.username || '').trim();
  const password = String(payload.password || '');
  const ip = clientIp(request);

  if (isLockedOut(ip)) {
    return NextResponse.json(
      { message: 'Too many failed attempts. Please try again later.' },
      { status: 429 }
    );
  }

  if (!rateLimit(`admin-login:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { message: 'Too many sign-in attempts. Try again later.' },
      { status: 429 }
    );
  }

  const usernameValid = constantTimeEqual(username, expectedUsername);
  const passwordValid = constantTimeEqual(password, expectedPassword);

  if (!usernameValid || !passwordValid) {
    recordFailedAttempt(ip);
    return NextResponse.json({ message: 'Invalid admin credentials.' }, { status: 401 });
  }

  clearFailedAttempts(ip);

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: 'gamevault_admin',
    value: createAdminToken(),
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return response;
}
