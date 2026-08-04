const COOKIE_PREFIX = 'gvp_';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

export function setCookie(name, value, days = 90) {
  if (typeof document === 'undefined') return;
  const encoded = encodeURIComponent(JSON.stringify(value));
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${COOKIE_PREFIX}${name}=${encoded}; expires=${expires}; path=/; SameSite=Lax`;
}

export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const key = `${COOKIE_PREFIX}${name}=`;
  const match = document.cookie.split('; ').find((c) => c.startsWith(key));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.slice(key.length)));
  } catch {
    return null;
  }
}

export function deleteCookie(name) {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_PREFIX}${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}
