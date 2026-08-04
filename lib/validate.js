const MAX_STRING_LENGTH = 2000;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
const MAX_URL_LENGTH = 2048;
const MAX_NOTE_LENGTH = 2000;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/[^\s<>"]+$/i;
const ID_REGEX = /^[a-zA-Z0-9_\-]+$/;
const ORDER_ID_REGEX = /^[a-zA-Z0-9_\-]{1,64}$/;

function sanitizeString(input, maxLength = MAX_STRING_LENGTH) {
  if (typeof input !== 'string') {
    return '';
  }
  return input.replace(/[<>"'&]/g, '').trim().slice(0, maxLength);
}

function sanitizeHTML(input, maxLength = MAX_STRING_LENGTH) {
  if (typeof input !== 'string') {
    return '';
  }
  return input.replace(/<[^>]*>/g, '').trim().slice(0, maxLength);
}

function validateEmail(email) {
  const sanitized = sanitizeString(email, MAX_EMAIL_LENGTH);
  if (!EMAIL_REGEX.test(sanitized)) {
    throw new Error('A valid email address is required.');
  }
  return sanitized;
}

function validateRequiredString(input, fieldName, maxLength = MAX_STRING_LENGTH) {
  const sanitized = sanitizeString(input, maxLength);
  if (!sanitized) {
    throw new Error(`${fieldName} is required.`);
  }
  return sanitized;
}

function validateOrderId(orderId) {
  const sanitized = sanitizeString(orderId, 64);
  if (!ORDER_ID_REGEX.test(sanitized)) {
    throw new Error('A valid order ID is required.');
  }
  return sanitized;
}

function validateURL(url) {
  const sanitized = sanitizeString(url, MAX_URL_LENGTH);
  if (!URL_REGEX.test(sanitized)) {
    throw new Error('A valid URL is required.');
  }
  return sanitized;
}

function validateRating(rating) {
  const num = Number(rating);
  if (!Number.isFinite(num) || num < 1 || num > 5) {
    throw new Error('Rating must be a number between 1 and 5.');
  }
  return num;
}

function validateCouponCode(code) {
  const sanitized = sanitizeString(code, 32).toUpperCase();
  if (!/^[A-Z0-9_\-]+$/.test(sanitized)) {
    throw new Error('Invalid promo code format.');
  }
  return sanitized;
}

function truncate(str, max) {
  if (typeof str !== 'string') {
    return '';
  }
  return str.trim().slice(0, max);
}

export {
  sanitizeString,
  sanitizeHTML,
  validateEmail,
  validateRequiredString,
  validateOrderId,
  validateURL,
  validateRating,
  validateCouponCode,
  truncate,
  MAX_STRING_LENGTH,
  MAX_NAME_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_NOTE_LENGTH,
};