import crypto from 'crypto';

const DEFAULT_SECRETS = new Set([
  'change_this_session_secret',
  'change_this_encryption_key',
  'change_this_otp_encryption_key',
  'default',
  '',
]);

function encryptionKey() {
  const configuredKey = process.env.ORDER_ENCRYPTION_KEY;
  if (!configuredKey) {
    throw new Error('ORDER_ENCRYPTION_KEY environment variable is required.');
  }
  if (DEFAULT_SECRETS.has(configuredKey) || configuredKey.length < 32) {
    throw new Error(
      'ORDER_ENCRYPTION_KEY is insecure. Generate a strong value with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  return crypto.createHash('sha256').update(configuredKey).digest();
}

export function isEncryptionConfigured() {
  return Boolean(process.env.ORDER_ENCRYPTION_KEY);
}

export function encryptText(plainText) {
  const key = encryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join('.');
}

export function decryptText(encrypted) {
  if (!encrypted || typeof encrypted !== 'string') {
    return '';
  }

  const key = encryptionKey();

  try {
    const [ivText, authTagText, ciphertextText] = encrypted.split('.');
    if (!ivText || !authTagText || !ciphertextText) {
      return '';
    }

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivText, 'base64'));
    decipher.setAuthTag(Buffer.from(authTagText, 'base64'));
    const plain = Buffer.concat([decipher.update(Buffer.from(ciphertextText, 'base64')), decipher.final()]);
    return plain.toString('utf8');
  } catch {
    return '';
  }
}
