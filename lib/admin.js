import { cookies } from 'next/headers';
import { sign, verify } from './session';

const ADMIN_SESSION_HOURS = 8;

export function createAdminToken() {
  return sign({ scope: 'admin', exp: Date.now() + ADMIN_SESSION_HOURS * 60 * 60 * 1000 });
}

export async function isAdminRequest() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get('gamevault_admin');
  if (!adminCookie?.value) {
    return false;
  }

  const payload = verify(adminCookie.value);
  if (!payload || payload.scope !== 'admin') {
    return false;
  }

  if (typeof payload.exp !== 'number' || payload.exp < Date.now()) {
    return false;
  }

  return true;
}
