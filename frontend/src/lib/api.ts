const API_URL = import.meta.env.VITE_API_URL || '';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_URL}${path}`, options);
}

export function getSocketUrl(): string {
  return import.meta.env.VITE_API_URL || window.location.origin;
}

// Try multiple approaches to query MuDream API
export async function queryMuDream(graphQLQuery: GraphQLQuery): Promise<any> {
  const body = JSON.stringify(graphQLQuery);

  // Approach 1: Direct fetch (works if CORS headers are present)
  try {
    const resp = await fetch('https://mudream.online/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/graphql-response+json',
      },
      body: body,
      credentials: 'include',
    });
    if (resp.ok) {
      const text = await resp.text();
      return JSON.parse(text);
    }
  } catch {}

  // Approach 2: Via allorigins proxy (adds CORS headers)
  try {
    const resp = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://mudream.online/api/graphql'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
    });
    if (resp.ok) {
      const text = await resp.text();
      return JSON.parse(text);
    }
  } catch {}

  // Approach 3: Via corsproxy.io
  try {
    const resp = await fetch('https://corsproxy.io/?' + encodeURIComponent('https://mudream.online/api/graphql'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/graphql-response+json',
      },
      body: body,
    });
    if (resp.ok) {
      const text = await resp.text();
      return JSON.parse(text);
    }
  } catch {}

  throw new Error('Todos os proxies bloqueados pelo Cloudflare. Use o Console do DevTools (F12) no mudream.online.');
}

interface GraphQLQuery {
  operationName: string;
  query: string;
  variables: Record<string, unknown>;
}
