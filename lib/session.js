import crypto from 'crypto';

function sessionSecret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'gamevault-dev-secret';
}

function hmac(value) {
  return crypto.createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

export function sign(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${hmac(encoded)}`;
}

export function verify(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const separatorIndex = token.lastIndexOf('.');
  if (separatorIndex <= 0) {
    return null;
  }

  const encoded = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);

  const expectedSignature = hmac(encoded);
  const signatureA = Buffer.from(signature);
  const signatureB = Buffer.from(expectedSignature);

  if (signatureA.length !== signatureB.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(signatureA, signatureB)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}
