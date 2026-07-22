const API_URL = import.meta.env.VITE_API_URL || '';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_URL}${path}`, options);
}

export function getSocketUrl(): string {
  return import.meta.env.VITE_API_URL || window.location.origin;
}

// Try direct browser fetch first (bypasses Cloudflare with real TLS + cf_clearance)
// Falls back to backend proxy if CORS blocks it
export async function queryMuDream(graphQLQuery: GraphQLQuery): Promise<any> {
  // Try direct fetch from browser (has real TLS fingerprint + cf_clearance cookie)
  try {
    const resp = await fetch('https://mudream.online/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/graphql-response+json',
      },
      body: JSON.stringify(graphQLQuery),
      credentials: 'include',
    });

    if (resp.ok) {
      return await resp.json();
    }

    // If not ok, throw to fall through to proxy
    throw new Error(`HTTP ${resp.status}`);
  } catch (directErr) {
    console.log('[API] Direct fetch failed, trying proxy...', directErr);

    // Fallback: use backend proxy
    const token = localStorage.getItem('token');
    const resp = await fetch(`${API_URL}/api/config/mudream-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(graphQLQuery),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`GraphQL proxy failed: ${resp.status} - ${text.substring(0, 200)}`);
    }

    return resp.json();
  }
}

interface GraphQLQuery {
  operationName: string;
  query: string;
  variables: Record<string, unknown>;
}
