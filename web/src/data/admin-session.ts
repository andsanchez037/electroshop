const ownerKey = 'electroshop-admin-tab';
const sessionKey = 'electroshop-admin-session-v2';

export interface AdminTokens { access_token: string; refresh_token: string }

function claimTab(id: string): Promise<boolean> {
  return new Promise(resolve => {
    void navigator.locks.request(`electroshop-admin:${id}`, { ifAvailable: true }, lock => {
      resolve(lock !== null);
      // The browser releases the lock when this document is destroyed.
      if (lock) return new Promise<void>(() => {});
    }).catch(() => resolve(false));
  });
}

export async function openAdminSessionStore(origin: string) {
  try {
    const storage = window.sessionStorage;
    // The old fixed SDK key was used for cross-tab Auth broadcasts.
    storage.removeItem('electroshop-admin-session');
    const previous = storage.getItem(ownerKey);
    // A reload can reclaim its lock. A live owner signals a copy, e.g. from an opener.
    const reclaimed = previous && navigator.locks && await claimTab(previous);
    if (!reclaimed) {
      storage.removeItem(sessionKey);
      storage.removeItem(ownerKey);
      if (!navigator.locks) return undefined;
      const id = crypto.randomUUID();
      if (!await claimTab(id)) return undefined;
      storage.setItem(ownerKey, id);
    }

    return {
      read(): AdminTokens | undefined {
        try {
          const value = JSON.parse(storage.getItem(sessionKey) ?? 'null');
          if (value?.origin === origin && typeof value.access_token === 'string' && typeof value.refresh_token === 'string') {
            return { access_token: value.access_token, refresh_token: value.refresh_token };
          }
        } catch { /* unavailable storage or invalid saved session */ }
      },
      write(tokens: AdminTokens | null) {
        try {
          if (tokens) {
            const { access_token, refresh_token } = tokens;
            storage.setItem(sessionKey, JSON.stringify({ origin, access_token, refresh_token }));
          } else {
            storage.removeItem(sessionKey);
          }
        } catch { /* keep the current session in SDK memory */ }
      },
    };
  } catch {
    return undefined;
  }
}
