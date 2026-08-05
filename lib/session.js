import crypto from 'crypto';

const DEFAULT_SECRETS = new Set([
  'change_this_session_secret',
  'change_this_encryption_key',
  'change_this_otp_encryption_key',
  'default',
  '',
]);

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required.');
  }
  if (DEFAULT_SECRETS.has(secret) || secret.length < 32) {
    throw new Error(
      'SESSION_SECRET is insecure. Generate a strong value with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return secret;
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
