import { auth } from './firebase';

export async function deleteUser(userId: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl || !auth?.currentUser) throw new Error('Not authenticated');
  const token = await auth.currentUser.getIdToken();
  const res = await fetch(`${appUrl}/api/admin/delete-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    let errMsg = `Request failed (${res.status})`;
    try {
      const data = await res.json() as { error?: string };
      if (data.error) errMsg = data.error;
    } catch {}
    throw new Error(errMsg);
  }
}
