import { cookies } from 'next/headers';
import { getUserById } from './store';
import { verify } from './session';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('gamevault_user');
  if (!userCookie?.value) {
    return null;
  }

  const payload = verify(userCookie.value);
  if (!payload || payload.scope !== 'user' || typeof payload.exp !== 'number' || payload.exp < Date.now()) {
    return null;
  }

  return getUserById(payload.id);
}
